import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { prisma } from "./db/prisma.js";

/**
 * Handles OCR extraction routing on inbound files
 */
export async function runOcrOnMedia(
  messageId: string,
  mediaBuffer: Buffer,
  extension: string = "jpg",
) {
  const ext = extension.toLowerCase();

  if (["csv", "xlsx", "xls"].includes(ext)) {
    try {
      console.log(`📊 [Tabular] Detecting spreadsheet format for ${messageId}. Running native parser...`);
      
      const { parseSpreadsheetToText } = await import("./tabular.js");
      const extractedText = parseSpreadsheetToText(mediaBuffer, ext);
      
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: { text: true }
      });
      
      const originalCaption = message?.text ? message.text.replace("[Document Message]", "").trim() : "";
      const contextPrompt = `[MEDIA_CONTENT_TYPE: spreadsheet/csv]\n[EXTRACTED_TABULAR_DATA]:\n${extractedText}\n${originalCaption ? `[USER_CAPTION]: ${originalCaption}` : "[NO_USER_CAPTION_PROVIDED]"}`;

      await prisma.message.update({
        where: { id: messageId },
        data: {
          processedText: contextPrompt,
          processingStatus: "completed",
        },
      });
      
      console.log(`📊 [Tabular] Ingestion SUCCESS for ${messageId}. Enqueuing task...`);
      const { cognitiveQueue } = await import("./queue/cognitiveQueue.js");
      await cognitiveQueue.add("process-tabular", { messageId, text: contextPrompt });
      return;
    } catch (tabErr) {
      console.error(`📊 [Tabular] Critical parsing failure on ${messageId}:`, tabErr);
      try {
        await prisma.message.update({
          where: { id: messageId },
          data: { processingStatus: "failed" },
        });
      } catch {}
      return;
    }
  }

  const tempDir = path.join(process.cwd(), "temp");

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempFilePath = path.join(tempDir, `ocr_${messageId}.${extension}`);

  fs.writeFileSync(tempFilePath, mediaBuffer);

  try {
    await prisma.message.update({
      where: { id: messageId },
      data: { processingStatus: "processing" },
    });
  } catch (err) {
    console.error(
      `👁️ [OCR] Failed to set processing status for message ${messageId}:`,
      err,
    );
  }

  try {
    const { mediaQueue } = await import("./queue/mediaQueue.js");
    await mediaQueue.add("analyze-media", { messageId, tempFilePath, extension });
    console.log(`📦 [OCR] Heavy task staged successfully for message ${messageId}. Relayed to sequential protection queue.`);
  } catch (queueErr) {
    console.error(`❌ [OCR] Failed to add message ${messageId} to media queue:`, queueErr);
    try {
      await prisma.message.update({
        where: { id: messageId },
        data: { processingStatus: "failed" },
      });
      fs.unlink(tempFilePath, () => {});
    } catch {}
  }
}
