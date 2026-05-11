import { Queue, Worker } from "bullmq";
import { redisConnection } from "./connection.js";

// Define explicit input shape for stability
interface CognitiveJobData {
  messageId: string;
  text: string;
}

// Cognitive processing queue
export const cognitiveQueue = new Queue<CognitiveJobData>("cognitive-tasks", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: parseInt(process.env.COGNITIVE_ATTEMPTS || "5"), 
    backoff: {
      type: "exponential",
      delay: 60000, 
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

console.log("🚀 [Cognitive Queue] Resurrection Core Ready. Connected to Redis.");

// Background Worker
export const cognitiveWorker = new Worker<CognitiveJobData>(
  "cognitive-tasks",
  async (job) => {
    const { messageId, text } = job.data;
    const isRetry = job.attemptsMade > 0; 

    console.log(`⚡ [Queue Worker] Starting Job #${job.id} for Msg: ${messageId} (Attempt: ${job.attemptsMade + 1})`);

    const { processCognitiveEvent } = await import("../cognitive/processor.js");
    
    await processCognitiveEvent(messageId, text, isRetry);

    console.log(`✅ [Queue Worker] Successfully cleared Job #${job.id} for Msg: ${messageId}`);
  },
  {
    connection: redisConnection,
    concurrency: parseInt(process.env.COGNITIVE_CONCURRENCY || "1"), 
    lockDuration: parseInt(process.env.COGNITIVE_LOCK_MS || "300000"), 
    stalledInterval: parseInt(process.env.COGNITIVE_LOCK_MS || "300000"),
  }
);

cognitiveWorker.on("failed", (job, err) => {
   console.error(`❌ [Queue Worker] Job ${job?.id} encountered blocking failure:`, err);
});
