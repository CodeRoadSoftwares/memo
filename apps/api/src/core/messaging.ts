import { 
  sendWhatsAppMessage, 
  sendWhatsAppMedia, 
  sendWhatsAppPresence 
} from "./whatsapp/connection.js";
import { bot } from "./telegram/bot.js";
import { getFileBuffer } from "./uploadFile.js";

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
      const extra: any = {};
      if (quotedMessagePayload?.message_id) {
        extra.reply_to_message_id = quotedMessagePayload.message_id;
        extra.reply_parameters = { message_id: quotedMessagePayload.message_id };
      }
      await bot.telegram.sendMessage(targetId, text, extra);
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

export async function sendUnifiedPresence(
  platform: string,
  targetId: string,
  state: "composing" | "paused"
): Promise<boolean> {
  if (platform === "telegram") {
    if (!bot) return false;
    try {
      if (state === "composing") {
        await bot.telegram.sendChatAction(targetId, "typing");
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

      const extra: any = { caption };
      if (quotedMessagePayload?.message_id) {
        extra.reply_to_message_id = quotedMessagePayload.message_id;
        extra.reply_parameters = { message_id: quotedMessagePayload.message_id };
      }

      if (mimeType.startsWith("image/")) {
        await bot.telegram.sendPhoto(targetId, { source: buffer }, extra);
      } else if (mimeType.startsWith("audio/")) {
        await bot.telegram.sendAudio(targetId, { source: buffer }, extra);
      } else if (mimeType.startsWith("video/")) {
        await bot.telegram.sendVideo(targetId, { source: buffer }, extra);
      } else {
        await bot.telegram.sendDocument(targetId, { source: buffer, filename: mediaKey.split("/").pop() }, extra);
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
