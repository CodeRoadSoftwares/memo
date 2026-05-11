import { Queue, Worker } from "bullmq";
import { redisConnection } from "./connection.js";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { prisma } from "../db/prisma.js";

interface MediaJobData {
  messageId: string;
  tempFilePath: string;
  extension: string;
}

// Media extraction queue
export const mediaQueue = new Queue<MediaJobData>("media-tasks", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: parseInt(process.env.MEDIA_ATTEMPTS || "2"), 
    backoff: {
      type: "exponential",
      delay: 10000, 
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

console.log("🔒 [Media Queue] Safety Governor Activated. Limit: 1 Active Python Instance.");

// Background Worker
export const mediaWorker = new Worker<MediaJobData>(
  "media-tasks",
  async (job) => {
    const { messageId, tempFilePath, extension } = job.data;

    console.log(`🔍 [Media Worker] Initiating deep scan for message ${messageId}...`);

    const pythonExec =
      process.platform === "win32"
        ? path.join(process.cwd(), "venv", "Scripts", "python.exe")
        : path.join(process.cwd(), "venv", "bin", "python");

    const scriptPath = path.join(process.cwd(), "python", "ocr.py");

    const cmd = `"${pythonExec}" "${scriptPath}" "${tempFilePath}"`;

    return new Promise((resolve, reject) => {
      exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, async (error, stdout, stderr) => {
        fs.unlink(tempFilePath, () => {});

        if (error) {
          console.error(`❌ [Media Worker] Python execution failed for ${messageId}:`, error);
          console.error(stderr);
          
          await prisma.message.update({
            where: { id: messageId },
            data: { processingStatus: "failed" },
          }).catch(() => {});
          
          return reject(error);
        }

        const extractedText = stdout.trim();
        console.log(`✅ [Media Worker] OCR Extraction SUCCESS for ${messageId}. (${extractedText.length} chars)`);

        try {
          const message = await prisma.message.findUnique({
            where: { id: messageId },
            select: { text: true },
          });

          const originalCaption = message?.text
            ? message.text
                .replace("[Image Message]", "")
                .replace("[Document Message]", "")
                .trim()
            : "";
          
          const contextPrompt = `[MEDIA_CONTENT_TYPE: image/doc]\n[EXTRACTED_TEXT_VIA_OCR]: ${extractedText}\n${
            originalCaption ? `[USER_CAPTION]: ${originalCaption}` : "[NO_USER_CAPTION_PROVIDED]"
          }`;

          await prisma.message.update({
            where: { id: messageId },
            data: {
              processedText: contextPrompt,
              processingStatus: "completed",
            },
          });

          const { cognitiveQueue } = await import("./cognitiveQueue.js");
          await cognitiveQueue.add("process-ocr", {
            messageId,
            text: contextPrompt,
          });

          resolve(true);
        } catch (dbErr) {
          console.error(`❌ [Media Worker] Final pipeline handoff crashed for ${messageId}:`, dbErr);
          reject(dbErr);
        }
      });
    });
  },
  {
    connection: redisConnection,
    concurrency: parseInt(process.env.MEDIA_CONCURRENCY || "1"), 
    lockDuration: parseInt(process.env.MEDIA_LOCK_MS || "600000"), 
  }
);

mediaWorker.on("failed", (job, err) => {
  console.error(`⚠️ [Media Worker] Permanent fault recorded on Job ${job?.id}:`, err);
});
