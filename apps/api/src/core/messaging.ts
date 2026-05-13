import { 
  sendWhatsAppMessage, 
  sendWhatsAppMedia, 
  sendWhatsAppPresence 
} from "./whatsapp/connection.js";
import { bot } from "./telegram/bot.js";
import { getFileBuffer } from "./uploadFile.js";

export function formatTelegramMessage(text: string): string {
  if (!text) return "";
  
  // 1. Escape core HTML characters so Telegram parser never chokes on user/AI tokens
  let formatted = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Convert Code Blocks (multi-line)
  formatted = formatted.replace(/```([\s\S]*?)```/g, "<pre>$1</pre>");

  // 3. Convert Inline Code
  formatted = formatted.replace(/`(.*?)`/g, "<code>$1</code>");

  // 4. Convert headers to Bold (e.g., ### Title)
  formatted = formatted.replace(/^#{1,6}\s+(.+)$/gm, "<b>$1</b>");

  // 5. Convert Bold Markdown **text** -> <b>text</b>
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");

  // 6. Convert bullet lists (* Item or - Item) to native list dots (• Item)
  formatted = formatted.replace(/^\s*[*+-]\s+(.+)$/gm, "• $1");

  return formatted;
}

export async function sendUnifiedMessage(
  platform: string,
  targetId: string,
  text: string,
  quotedMessagePayload?: any
): Promise<boolean> {
  if (platform === "telegram") {
    if (!bot) {
      console.error("[Messaging] Telegram Bot not initialized.");
      return false;
    }
    try {
      const extra: any = { parse_mode: "HTML" };
      if (quotedMessagePayload?.message_id) {
        extra.reply_to_message_id = quotedMessagePayload.message_id;
        extra.reply_parameters = { message_id: quotedMessagePayload.message_id };
      }
      
      const formattedText = formatTelegramMessage(text);
      try {
        await bot.telegram.sendMessage(targetId, formattedText, extra);
      } catch (tgHtmlError) {
        console.warn("[Messaging] Telegram HTML delivery failed, sending plain text fallback:", tgHtmlError);
        // Fallback: Drop formatting if HTML parse failed for some boundary condition
        const fallbackExtra = { ...extra };
        delete fallbackExtra.parse_mode;
        await bot.telegram.sendMessage(targetId, text, fallbackExtra as any);
      }
      return true;
    } catch (err) {
      console.error(`[Messaging] Telegram delivery to ${targetId} failed:`, err);
      return false;
    }
  } else {
    // Default to WhatsApp
    return sendWhatsAppMessage(targetId, text, quotedMessagePayload);
  }
}

const activeTelegramTyping = new Map<string, NodeJS.Timeout>();

export async function sendUnifiedPresence(
  platform: string,
  targetId: string,
  state: "composing" | "paused"
): Promise<boolean> {
  if (platform === "telegram") {
    if (!bot) return false;
    
    const intervalKey = `${platform}:${targetId}`;
    
    // Clear existing heartbeat if any
    const existing = activeTelegramTyping.get(intervalKey);
    if (existing) {
      clearInterval(existing);
      activeTelegramTyping.delete(intervalKey);
    }

    try {
      if (state === "composing") {
        // Send immediately
        await bot.telegram.sendChatAction(targetId, "typing");
        
        // Set 4-second heartbeat up to 32 seconds total max safety
        let count = 0;
        const heartbeat = setInterval(async () => {
          count++;
          if (count > 7 || !bot) {
            clearInterval(heartbeat);
            activeTelegramTyping.delete(intervalKey);
            return;
          }
          try {
            await bot.telegram.sendChatAction(targetId, "typing");
          } catch {
            clearInterval(heartbeat);
            activeTelegramTyping.delete(intervalKey);
          }
        }, 4000);

        activeTelegramTyping.set(intervalKey, heartbeat);
      }
      return true;
    } catch {
      return false;
    }
  } else {
    return sendWhatsAppPresence(targetId, state);
  }
}

export async function sendUnifiedMedia(
  platform: string,
  targetId: string,
  mediaKey: string,
  mimeType: string,
  caption?: string,
  quotedMessagePayload?: any
): Promise<boolean> {
  if (platform === "telegram") {
    if (!bot) {
      console.error("[Messaging] Telegram Bot not initialized for media.");
      return false;
    }
    try {
      const buffer = await getFileBuffer(mediaKey);
      if (!buffer) return false;

      const formattedCaption = caption ? formatTelegramMessage(caption) : undefined;
      const extra: any = { 
        caption: formattedCaption,
        parse_mode: formattedCaption ? "HTML" : undefined 
      };
      
      if (quotedMessagePayload?.message_id) {
        extra.reply_to_message_id = quotedMessagePayload.message_id;
        extra.reply_parameters = { message_id: quotedMessagePayload.message_id };
      }

      try {
        if (mimeType.startsWith("image/")) {
          await bot.telegram.sendPhoto(targetId, { source: buffer }, extra);
        } else if (mimeType.startsWith("audio/")) {
          await bot.telegram.sendAudio(targetId, { source: buffer }, extra);
        } else if (mimeType.startsWith("video/")) {
          await bot.telegram.sendVideo(targetId, { source: buffer }, extra);
        } else {
          await bot.telegram.sendDocument(targetId, { source: buffer, filename: mediaKey.split("/").pop() }, extra);
        }
      } catch (mediaHtmlErr) {
        console.warn("[Messaging] Telegram Media Caption HTML failed, trying plain text fallback:", mediaHtmlErr);
        // Fallback: Drop HTML parser for caption
        extra.caption = caption;
        delete extra.parse_mode;
        
        if (mimeType.startsWith("image/")) {
          await bot.telegram.sendPhoto(targetId, { source: buffer }, extra);
        } else if (mimeType.startsWith("audio/")) {
          await bot.telegram.sendAudio(targetId, { source: buffer }, extra);
        } else if (mimeType.startsWith("video/")) {
          await bot.telegram.sendVideo(targetId, { source: buffer }, extra);
        } else {
          await bot.telegram.sendDocument(targetId, { source: buffer, filename: mediaKey.split("/").pop() }, extra);
        }
      }
      
      return true;
    } catch (err) {
      console.error(`[Messaging] Telegram media dispatch failed to ${targetId}:`, err);
      return false;
    }
  } else {
    return sendWhatsAppMedia(targetId, mediaKey, mimeType, caption, quotedMessagePayload);
  }
}
