import makeWASocket, {
  DisconnectReason,
  downloadMediaMessage,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode";
import { prisma } from "../db/prisma.js";
import { usePrismaAuthState } from "./prismaAuth.js";
import { uploadFileBuffer } from "../uploadFile.js";

export interface WhatsAppClient {
  socket: any;
  qrCode?: string;
  connectionStatus: "connecting" | "qrcode" | "connected" | "disconnected";
}

export const activeConnections = new Map<string, WhatsAppClient>();

interface DebounceBatch {
  timer: NodeJS.Timeout;
  messageIds: string[];
  texts: string[];
}
const userBatches = new Map<string, DebounceBatch>();

export async function connectWhatsApp(userId: string): Promise<WhatsAppClient> {
  const existing = activeConnections.get(userId);
  if (
    existing &&
    (existing.connectionStatus === "connected" ||
      existing.connectionStatus === "connecting" ||
      existing.connectionStatus === "qrcode")
  ) {
    return existing;
  }

  const { state, saveCreds } = await usePrismaAuthState(userId);

  const makeWASocketFn = (makeWASocket as any).default || makeWASocket;
  const socket = makeWASocketFn({
    auth: state,
    printQRInTerminal: false,
  });

  const client: WhatsAppClient = {
    socket,
    connectionStatus: "connecting",
  };

  activeConnections.set(userId, client);

  socket.ev.on("creds.update", saveCreds);

  const unwrapMessage = (message: any): any => {
    if (!message) return null;
    if (message.ephemeralMessage?.message)
      return unwrapMessage(message.ephemeralMessage.message);
    if (message.viewOnceMessage?.message)
      return unwrapMessage(message.viewOnceMessage.message);
    if (message.viewOnceMessageV2?.message)
      return unwrapMessage(message.viewOnceMessageV2.message);
    return message;
  };

  socket.ev.on("messages.upsert", async (m: any) => {
    const { messages, type } = m;
    console.log(
      `\n🔔 [Event: messages.upsert] Received ${messages.length} message(s) of type: "${type}"`,
    );

    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { phone: true, name: true, phoneNumbers: { select: { phone: true } } },
      });

      if (!dbUser) return;

      const allowedPhones = dbUser.phoneNumbers.map((p) => p.phone);

      for (const msg of messages) {
        // Ignore bot responses
        if (msg.key.fromMe) {
          console.log(`      └─ Skipping outgoing message (fromMe=true)`);
          continue;
        }

        const senderJid = msg.key.remoteJid || "";
        const senderJidAlt = (msg.key as any).remoteJidAlt || "";
        const participant = msg.key.participant || "";
        const participantAlt = (msg.key as any).participantAlt || "";

        const allJidFields = [senderJid, senderJidAlt, participant, participantAlt];

        const matchedPhone = allowedPhones.find((phone) =>
          allJidFields.some((jid) => jid.includes(phone)),
        );

        if (!matchedPhone) {
          continue;
        }

        const unwrapped = unwrapMessage(msg.message);
        let messageType = "unknown";
        let textContent: string | null = null;
        let mimeType: string | null = null;

        if (unwrapped) {
          if (unwrapped.conversation) {
            messageType = "text";
            textContent = unwrapped.conversation;
          } else if (unwrapped.extendedTextMessage?.text) {
            messageType = "text";
            textContent = unwrapped.extendedTextMessage.text;
          } else if (unwrapped.audioMessage) {
            messageType = "audio";
            textContent = "[Audio Message]";
            mimeType = unwrapped.audioMessage.mimetype || "audio/ogg";
          } else if (unwrapped.imageMessage) {
            messageType = "image";
            textContent = unwrapped.imageMessage.caption || "[Image Message]";
            mimeType = unwrapped.imageMessage.mimetype || "image/jpeg";
          } else if (unwrapped.documentMessage) {
            messageType = "document";
            textContent =
              unwrapped.documentMessage.caption ||
              unwrapped.documentMessage.fileName ||
              "[Document Message]";
            mimeType =
              unwrapped.documentMessage.mimetype || "application/octet-stream";
          } else if (unwrapped.videoMessage) {
            messageType = "video";
            textContent = unwrapped.videoMessage.caption || "[Video Message]";
            mimeType = unwrapped.videoMessage.mimetype || "video/mp4";
          }

          const contextInfo = 
            unwrapped.extendedTextMessage?.contextInfo || 
            unwrapped.imageMessage?.contextInfo || 
            unwrapped.documentMessage?.contextInfo || 
            unwrapped.videoMessage?.contextInfo || 
            unwrapped.audioMessage?.contextInfo;

          if (contextInfo?.quotedMessage) {
             const quoted = contextInfo.quotedMessage;
             let quotedText = "";
             
             if (quoted.conversation) quotedText = quoted.conversation;
             else if (quoted.extendedTextMessage?.text) quotedText = quoted.extendedTextMessage.text;
             else if (quoted.imageMessage?.caption) quotedText = `[Image: ${quoted.imageMessage.caption}]`;
             else if (quoted.imageMessage) quotedText = "[Image Message]";
             else if (quoted.documentMessage?.caption) quotedText = `[Doc: ${quoted.documentMessage.caption}]`;
             else if (quoted.documentMessage) quotedText = "[Document]";
             else if (quoted.audioMessage) quotedText = "[Audio]";
             
             if (quotedText) {
               textContent = `[Context - Replied to: "${quotedText}"] User's message: ${textContent}`;
             }
          }
        }

        console.log(
          `      └─ Classified Type: "${messageType}" | Content: ${JSON.stringify(textContent)}`,
        );

        let storageKey: string | null = null;
        let audioBuffer: Buffer | null = null;

        if (messageType !== "text" && messageType !== "unknown" && unwrapped) {
          try {
            console.log(
              `      └─ Downloading media for type: "${messageType}"...`,
            );
            const buffer = await downloadMediaMessage(msg, "buffer", {}, {
              logger: undefined as any,
            } as any);

            if (buffer) {
              const extension = mimeType?.split("/")[1]?.split(";")[0] || "bin";
              storageKey = `whatsapp/${dbUser.phone}/${msg.key.id}.${extension}`;

              console.log(
                `      └─ Uploading media to R2 with key: "${storageKey}"...`,
              );
              await uploadFileBuffer(
                buffer,
                storageKey,
                mimeType || "application/octet-stream",
              );
              console.log(`      └─ Upload to R2: SUCCESS`);

              if (messageType === "audio") {
                audioBuffer = buffer;
              }
            }
          } catch (downloadErr) {
            console.error(
              "      └─ Download/Upload media FAILED:",
              downloadErr,
            );
          }
        }

        try {
          const savedMessage = await prisma.message.create({
            data: {
              userId,
              platform: "whatsapp",
              userPhone: matchedPhone,
              type: messageType,
              text: textContent,
              storageKey,
              mimeType,
              rawPayload: msg as any,
            },
          });
          console.log(`      └─ DB Save: SUCCESS (${matchedPhone})`);

          sendWhatsAppPresence(matchedPhone, "composing").catch(() => {});

          if (messageType === "text" && textContent) {
              const existingBatch = userBatches.get(matchedPhone);
              if (existingBatch) {
                clearTimeout(existingBatch.timer);
                existingBatch.messageIds.push(savedMessage.id);
                existingBatch.texts.push(textContent);
              } else {
                userBatches.set(matchedPhone, {
                  timer: null as any,
                  messageIds: [savedMessage.id],
                  texts: [textContent],
                });
              }

              const batch = userBatches.get(matchedPhone)!;
              batch.timer = setTimeout(async () => {
                userBatches.delete(matchedPhone);
                try {
                  const combinedText = batch.texts.join(" ");
                  const primaryMessageId = batch.messageIds[0];

                  await prisma.message.update({
                    where: { id: primaryMessageId },
                    data: { text: combinedText },
                  });

                  if (batch.messageIds.length > 1) {
                    await prisma.message.deleteMany({
                      where: { id: { in: batch.messageIds.slice(1) } },
                    });
                  }

                  const { cognitiveQueue } = await import("../queue/cognitiveQueue.js");
                  await cognitiveQueue.add("process-text", { 
                    messageId: primaryMessageId, 
                    text: combinedText 
                  });
                  console.log(`🚀 [Queue] Enqueued batched text event: ${primaryMessageId}`);
                } catch (batchErr) {
                  console.error("Error executing batched messages:", batchErr);
                }
              }, 3000); // 3 seconds debounce
            } else if (messageType === "audio" && audioBuffer) {
              const extension = mimeType?.split("/")[1]?.split(";")[0] || "ogg";
              const { transcribeAudio } = await import("../transcribe.js");
              transcribeAudio(savedMessage.id, audioBuffer, extension).catch(
                (err) => {
                  console.error("🔊 [Whisper] Trigger failed:", err);
                },
              );
            } else if ((messageType === "image" || messageType === "document") && unwrapped) {
              try {
                 const buffer = await downloadMediaMessage(msg, "buffer", {}, { logger: undefined as any } as any);
                 if (buffer) {
                   const extension = mimeType?.split("/")[1]?.split(";")[0] || (messageType === "image" ? "jpg" : "pdf");
                   
                   const { runOcrOnMedia } = await import("../ocr.js");
                   runOcrOnMedia(savedMessage.id, buffer, extension).catch(err => {
                      console.error("👁️ [OCR] Pipeline trigger failed:", err);
                   });
                 }
              } catch (redlErr) {
                 console.error("👁️ [OCR] Failed to refetch buffer for OCR:", redlErr);
              }
            }
        } catch (dbErr) {
          console.error("      └─ DB Save: FAILED:", dbErr);
        }
      }
    } catch (err) {
      console.error("Error processing incoming message event:", err);
    }
  });

  socket.ev.on("connection.update", async (update: any) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        client.connectionStatus = "qrcode";
        client.qrCode = await qrcode.toDataURL(qr);
      } catch (err) {
        console.error("Error generating QR code:", err);
      }
    }

    if (connection === "open") {
      client.connectionStatus = "connected";
      client.qrCode = undefined;
      console.log(`🎉 WhatsApp successfully connected for user: ${userId}`);

      try {
        const waPhone: string | undefined = socket.user?.id
          ?.split(":")[0]
          ?.split("@")[0];
        if (waPhone) {
          await prisma.whatsAppSession.update({
            where: { userId },
            data: { phone: waPhone },
          });
          console.log(
            `📱 Saved WhatsApp phone number for user ${userId}: ${waPhone}`,
          );
        }
      } catch (phoneErr) {
        console.error(
          `Failed to save WhatsApp phone for user ${userId}:`,
          phoneErr,
        );
      }
    }

    if (connection === "close") {
      client.connectionStatus = "disconnected";
      client.qrCode = undefined;

      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(
        `🔌 WhatsApp connection closed for user: ${userId}. StatusCode: ${statusCode}. Reconnecting: ${shouldReconnect}`,
      );

      if (shouldReconnect) {
        setTimeout(() => {
          activeConnections.delete(userId);
          connectWhatsApp(userId);
        }, 5000);
      } else {
        activeConnections.delete(userId);
        try {
          await prisma.whatsAppSession.delete({
            where: { userId },
          });
          console.log(`🗑️ Deleted logged-out session for user: ${userId}`);
        } catch (e) {
          // Ignore if already deleted
        }
      }
    }
  });

  return client;
}

export async function disconnectWhatsApp(userId: string): Promise<boolean> {
  const client = activeConnections.get(userId);
  let removed = false;

  if (client) {
    removed = true;
    try {
      if (client.socket) {
        await client.socket.logout();
      }
    } catch (err) {
      console.error(`Error logging out socket for user ${userId}:`, err);
      try {
        client.socket?.end();
      } catch (e) {}
    }
    activeConnections.delete(userId);
  }

  try {
    await prisma.whatsAppSession.delete({
      where: { userId },
    });
    removed = true;
  } catch (e) {
    // Session may not exist in DB, which is fine
  }

  return removed;
}

export function formatForWhatsApp(text: string): string {
  if (!text) return text;

  let formatted = text;

  formatted = formatted.replace(/^(?:#{1,6})\s+(.+)$/gm, "*$1*");
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, "*$1*");
  formatted = formatted.replace(/\*([^*]+?)([:.,?!;]+)\*/g, "*$1*$2");
  formatted = formatted.replace(/^\s*\*\s+/gm, "• ");
  formatted = formatted.replace(/\*\*\*/g, "*");

  return formatted;
}

import { getFileBuffer } from "../uploadFile.js";

export async function sendWhatsAppMessage(
  userPhone: string,
  text: string,
  quotedMessage: any = null,
): Promise<boolean> {
  try {
    const phoneRecord = await prisma.userPhoneNumber.findUnique({
      where: { phone: userPhone },
      select: { userId: true },
    });

    if (!phoneRecord) {
      console.warn(
        `[WA Message] No user found with phone number: ${userPhone}`,
      );
      return false;
    }

    const connection = activeConnections.get(phoneRecord.userId);
    if (!connection || !connection.socket) {
      console.warn(
        `[WA Message] No active WhatsApp connection found for user: ${phoneRecord.userId}`,
      );
      return false;
    }

    let targetJid = userPhone.includes("@")
      ? userPhone
      : `${userPhone}@s.whatsapp.net`;
    try {
      const lastMessage = await prisma.message.findFirst({
        where: { userPhone: userPhone },
        orderBy: { createdAt: "desc" },
        select: { rawPayload: true },
      });

      if (lastMessage && lastMessage.rawPayload) {
        const payload = lastMessage.rawPayload as any;
        if (payload?.key?.remoteJid) {
          targetJid = payload.key.remoteJid;
        }
      }
    } catch (e) {
      console.warn(
        "[WA Message] Failed to query last message JID, falling back:",
        e,
      );
    }

    const formattedText = formatForWhatsApp(text);
    console.log(`[WA Message] Sending message to ${targetJid}: "${formattedText}"...`);
    await connection.socket.sendMessage(
       targetJid, 
       { text: formattedText }, 
       quotedMessage ? { quoted: quotedMessage } : undefined
    );
    console.log(`[WA Message] Message sent successfully!`);
    return true;
  } catch (err) {
    console.error(`[WA Message] Failed to send message to ${userPhone}:`, err);
    return false;
  }
}

export async function sendWhatsAppMedia(
  userPhone: string,
  mediaKey: string,
  mimeType: string,
  caption?: string,
  quotedMessage: any = null,
): Promise<boolean> {
  try {
    const phoneRecord = await prisma.userPhoneNumber.findUnique({
      where: { phone: userPhone },
      select: { userId: true },
    });

    if (!phoneRecord) return false;

    const connection = activeConnections.get(phoneRecord.userId);
    if (!connection || !connection.socket) return false;

    const buffer = await getFileBuffer(mediaKey);
    if (!buffer) {
      console.error(`[WA Media] Failed to download buffer from R2 for key ${mediaKey}`);
      return false;
    }

    let targetJid = userPhone.includes("@")
      ? userPhone
      : `${userPhone}@s.whatsapp.net`;
    try {
       const lastMessage = await prisma.message.findFirst({
         where: { userPhone: userPhone },
         orderBy: { createdAt: "desc" },
         select: { rawPayload: true },
       });
       if (lastMessage?.rawPayload) {
         const payload = lastMessage.rawPayload as any;
         if (payload?.key?.remoteJid) targetJid = payload.key.remoteJid;
       }
    } catch (e) {}

    const formattedCaption = caption ? formatForWhatsApp(caption) : undefined;
    
    let contentType: "image" | "audio" | "document" | "video" = "document";
    if (mimeType.startsWith("image/")) contentType = "image";
    else if (mimeType.startsWith("audio/")) contentType = "audio";
    else if (mimeType.startsWith("video/")) contentType = "video";

    const messageOptions: any = {
       mimetype: mimeType,
    };
    
    messageOptions[contentType] = buffer;
    
    if (formattedCaption && contentType !== "audio") {
       messageOptions.caption = formattedCaption;
    }

    console.log(`[WA Media] Dispatching ${contentType} media to ${targetJid}...`);
    await connection.socket.sendMessage(
       targetJid, 
       messageOptions, 
       quotedMessage ? { quoted: quotedMessage } : undefined
    );
    console.log(`[WA Media] Dispatch SUCCESS`);
    return true;
  } catch (err) {
    console.error(`[WA Media] Transmission error:`, err);
    return false;
  }
}

/**
 * Outbound direct messaging
 */
export async function sendMessageToRecipient(
  userId: string,
  recipientPhone: string,
  text: string,
): Promise<boolean> {
  try {
    const connection = activeConnections.get(userId);
    if (!connection || !connection.socket) {
      console.warn(`[WA Recipient Message] No active WhatsApp connection found for user: ${userId}`);
      return false;
    }

    let cleanPhone = recipientPhone.replace(/[^\d+]/g, "");
    if (!cleanPhone.includes("@")) {
      if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`; 
      cleanPhone = `${cleanPhone}@s.whatsapp.net`;
    }

    const formattedText = formatForWhatsApp(text);
    console.log(`[WA Recipient Message] Sending outbound to ${cleanPhone} from User ${userId}...`);
    await connection.socket.sendMessage(cleanPhone, { text: formattedText });
    console.log(`[WA Recipient Message] Message sent successfully!`);
    return true;
  } catch (err) {
    console.error(`[WA Recipient Message] Failed to send message to ${recipientPhone}:`, err);
    return false;
  }
}

export async function sendWhatsAppPresence(
  userPhone: string,
  state: "composing" | "paused",
): Promise<boolean> {
  try {
    const phoneRecord = await prisma.userPhoneNumber.findUnique({
      where: { phone: userPhone },
      select: { userId: true },
    });

    if (!phoneRecord) return false;

    const connection = activeConnections.get(phoneRecord.userId);
    if (!connection || !connection.socket) return false;

    let targetJid = userPhone.includes("@")
      ? userPhone
      : `${userPhone}@s.whatsapp.net`;
    try {
      const lastMessage = await prisma.message.findFirst({
        where: { userPhone },
        orderBy: { createdAt: "desc" },
        select: { rawPayload: true },
      });
      if (lastMessage?.rawPayload) {
        const payload = lastMessage.rawPayload as any;
        if (payload?.key?.remoteJid) {
          targetJid = payload.key.remoteJid;
        }
      }
    } catch (e) {}

    await connection.socket.sendPresenceUpdate(state, targetJid);
    return true;
  } catch (err) {
    return false;
  }
}
