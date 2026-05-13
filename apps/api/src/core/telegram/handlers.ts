import { bot } from "./bot.js";
import { prisma } from "../db/prisma.js";
import { uploadFileBuffer } from "../uploadFile.js";
import { cognitiveQueue } from "../queue/cognitiveQueue.js";
import { runOcrOnMedia } from "../ocr.js";
import { transcribeAudio } from "../transcribe.js";
import { processCognitiveEvent } from "../cognitive/processor.js";
import { message } from "telegraf/filters";

interface DebounceBatch {
  timer: NodeJS.Timeout;
  messageIds: string[];
  texts: string[];
}
const telegramBatches = new Map<string, DebounceBatch>();

export async function registerTelegramHandlers() {
  if (!bot) return;

  // Command: Link
  bot.command("link", async (ctx) => {
    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
      return ctx.reply("⚠️ Usage: `/link YOUR_API_KEY`\nGet your API Key from the profile section in the web client.");
    }

    const apiKey = args[1].trim();
    try {
      const user = await prisma.user.findUnique({ where: { apiKey } });
      if (!user) {
        return ctx.reply("❌ Invalid API key provided. Please double check and try again.");
      }

      const chatId = ctx.chat.id.toString();
      const username = ctx.from?.username || null;

      await prisma.user.update({
        where: { id: user.id },
        data: { telegramChatId: chatId, telegramUsername: username }
      });

      return ctx.reply(`🎉 Successfully linked! Welcome to Memo, ${user.name || "User"}. You can now message me directly!`);
    } catch (err) {
      console.error("[Telegram Handlers] Link command failure:", err);
      return ctx.reply("❌ Encountered an unexpected issue linking your account. Please contact support.");
    }
  });

  // Handle text messages
  bot.on(message("text"), async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const user = await prisma.user.findUnique({ where: { telegramChatId: chatId } });
    if (!user) {
      return ctx.reply("⚠️ You haven't linked your Telegram account yet. Please send `/link YOUR_API_KEY` to begin.");
    }

    const text = ctx.message.text;
    if (text.startsWith("/")) return; // Skip command strings not caught by handlers

    // Incorporate quotes if any
    let contextText = text;
    const replyTo = (ctx.message as any).reply_to_message;
    if (replyTo) {
      let quotedText = "";
      if (replyTo.text) quotedText = replyTo.text;
      else if (replyTo.caption) quotedText = replyTo.caption;
      else if (replyTo.photo) quotedText = "[Image Message]";
      else if (replyTo.document) quotedText = `[Document: ${replyTo.document.file_name || "unnamed"}]`;
      else if (replyTo.voice || replyTo.audio) quotedText = "[Audio Message]";
      else if (replyTo.video) quotedText = "[Video Message]";

      if (quotedText) {
        contextText = `[Context - Replied to: "${quotedText}"] User's message: ${text}`;
      }
    }

    try {
      const savedMsg = await prisma.message.create({
        data: {
          userId: user.id,
          platform: "telegram",
          userPhone: chatId,
          type: "text",
          text: contextText,
          rawPayload: ctx.message as any,
        }
      });

      await ctx.sendChatAction("typing");

      const existing = telegramBatches.get(chatId);
      if (existing) {
        clearTimeout(existing.timer);
        existing.messageIds.push(savedMsg.id);
        existing.texts.push(contextText);
      } else {
        telegramBatches.set(chatId, {
          timer: null as any,
          messageIds: [savedMsg.id],
          texts: [contextText],
        });
      }

      const batch = telegramBatches.get(chatId)!;
      batch.timer = setTimeout(async () => {
        telegramBatches.delete(chatId);
        try {
          const combined = batch.texts.join(" ");
          const primaryId = batch.messageIds[0];

          await prisma.message.update({
            where: { id: primaryId },
            data: { text: combined },
          });

          if (batch.messageIds.length > 1) {
            await prisma.message.deleteMany({
              where: { id: { in: batch.messageIds.slice(1) } }
            });
          }

          await cognitiveQueue.add("process-text", { messageId: primaryId, text: combined });
          console.log(`🚀 [Telegram Queue] Enqueued batched text for telegram: ${primaryId}`);
        } catch (err) {
          console.error("[Telegram Handlers] Failed debouncing batch:", err);
        }
      }, 3000);

    } catch (err) {
      console.error("[Telegram Handlers] Text ingestion failed:", err);
    }
  });

  // Handle audio messages
  bot.on([message("voice"), message("audio")], async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const user = await prisma.user.findUnique({ where: { telegramChatId: chatId } });
    if (!user) {
      return ctx.reply("⚠️ Please link your account first using `/link YOUR_API_KEY`.");
    }

    const msg: any = ctx.message;
    const audioObj = msg.voice || msg.audio;
    const fileId = audioObj.file_id;
    const mimeType = audioObj.mime_type || "audio/ogg";

    try {
      await ctx.sendChatAction("record_voice");
      const fileLink = await ctx.telegram.getFileLink(fileId);
      const response = await fetch(fileLink.toString());
      const buffer = Buffer.from(await response.arrayBuffer());

      const ext = mimeType.split("/")[1] || "oga";
      const storageKey = `telegram/${user.phone}/${msg.message_id}.${ext}`;
      await uploadFileBuffer(buffer, storageKey, mimeType);

      const savedMsg = await prisma.message.create({
        data: {
          userId: user.id,
          platform: "telegram",
          userPhone: chatId,
          type: "audio",
          text: "[Telegram Voice Message]",
          mimeType,
          storageKey,
          rawPayload: msg
        }
      });

      console.log("🔊 [Telegram Handlers] Dispatched to transcription pipeline.");
      transcribeAudio(savedMsg.id, buffer, ext).catch((err) => {
         console.error("[Telegram Handlers] Transcription pipeline failure:", err);
      });

    } catch (err) {
      console.error("[Telegram Handlers] Audio handling failed:", err);
    }
  });

  // Handle images
  bot.on(message("photo"), async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const user = await prisma.user.findUnique({ where: { telegramChatId: chatId } });
    if (!user) return ctx.reply("⚠️ Please link your account first.");

    const msg = ctx.message;
    const photo = msg.photo[msg.photo.length - 1]; // Best quality photo
    const fileId = photo.file_id;
    const caption = msg.caption || "[Telegram Image]";

    try {
      await ctx.sendChatAction("upload_photo");
      const fileLink = await ctx.telegram.getFileLink(fileId);
      const response = await fetch(fileLink.toString());
      const buffer = Buffer.from(await response.arrayBuffer());

      const mimeType = "image/jpeg";
      const storageKey = `telegram/${user.phone}/${msg.message_id}.jpg`;
      await uploadFileBuffer(buffer, storageKey, mimeType);

      const savedMsg = await prisma.message.create({
        data: {
          userId: user.id,
          platform: "telegram",
          userPhone: chatId,
          type: "image",
          text: caption,
          mimeType,
          storageKey,
          rawPayload: msg as any
        }
      });

      runOcrOnMedia(savedMsg.id, buffer, "jpg").catch(err => {
        console.error("[Telegram Handlers] OCR pipeline failure:", err);
      });

    } catch (err) {
      console.error("[Telegram Handlers] Photo handling failed:", err);
    }
  });

  // Handle documents
  bot.on(message("document"), async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const user = await prisma.user.findUnique({ where: { telegramChatId: chatId } });
    if (!user) return ctx.reply("⚠️ Please link your account first.");

    const msg = ctx.message;
    const doc = msg.document;
    const fileId = doc.file_id;
    const mimeType = doc.mime_type || "application/octet-stream";
    const filename = doc.file_name || `doc_${msg.message_id}`;

    try {
      await ctx.sendChatAction("upload_document");
      const fileLink = await ctx.telegram.getFileLink(fileId);
      const response = await fetch(fileLink.toString());
      const buffer = Buffer.from(await response.arrayBuffer());

      const ext = filename.split(".").pop() || "bin";
      const storageKey = `telegram/${user.phone}/${msg.message_id}.${ext}`;
      await uploadFileBuffer(buffer, storageKey, mimeType);

      const savedMsg = await prisma.message.create({
        data: {
          userId: user.id,
          platform: "telegram",
          userPhone: chatId,
          type: "document",
          text: msg.caption || filename,
          mimeType,
          storageKey,
          rawPayload: msg as any
        }
      });

      runOcrOnMedia(savedMsg.id, buffer, ext).catch(err => {
        console.error("[Telegram Handlers] OCR pipeline failed for document:", err);
      });

    } catch (err) {
      console.error("[Telegram Handlers] Document ingest failed:", err);
    }
  });
}
