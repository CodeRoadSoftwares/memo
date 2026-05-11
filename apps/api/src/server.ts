import Fastify from "fastify";
import cors from "@fastify/cors";
import { apiKeyAuthPlugin } from "./core/auth/apiKeyAuth.js";
import { whatsappRoutes } from "./modules/whatsapp/routes.js";
import { authRoutes } from "./modules/auth/routes.js";
import { skillRoutes } from "./modules/skills/routes.js";
import { phoneNumberRoutes } from "./modules/phoneNumbers/routes.js";
import cookie from "@fastify/cookie";

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://heymemo.vercel.app",
    "https://www.heymemo.vercel.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  credentials: true,
});

await app.register(cookie, {
  secret: process.env.JWT_SECRET,
});
app.register(apiKeyAuthPlugin);
app.register(authRoutes);
app.register(skillRoutes);
app.register(whatsappRoutes);
app.register(phoneNumberRoutes);

app.get("/", async () => {
  return {
    status: "ok",
  };
});

app.get("/me", async (request) => {
  return {
    user: request.user,
  };
});

const start = async () => {
  try {
    await app.listen({
      port: 3000,
      host: "0.0.0.0",
    });

    console.log("Server running on port 3000");

    // Auto-reconnect existing WhatsApp sessions at startup
    try {
      const { prisma: db } = await import("./core/db/prisma.js");
      const { connectWhatsApp } = await import("./core/whatsapp/connection.js");
      const sessions = await db.whatsAppSession.findMany({
        select: { userId: true },
      });
      console.log(
        `[Startup] Auto-reconnecting ${sessions.length} active WhatsApp session(s)...`,
      );
      for (const session of sessions) {
        connectWhatsApp(session.userId).catch((e) => {
          console.error(
            `[Startup] Failed to auto-reconnect user ${session.userId}:`,
            e,
          );
        });
      }
    } catch (startupErr) {
      console.error("[Startup] Error auto-reconnecting sessions:", startupErr);
    }

    // Start the Reminder Engine Cron Job Scheduler
    try {
      const { startReminderScheduler } = await import("./core/scheduler.js");
      startReminderScheduler();
    } catch (schedErr) {
      console.error("[Startup] Failed to start Reminder Scheduler:", schedErr);
    }
    // Start Cognitive & Media Queue Background Workers
    try {
      await import("./core/queue/cognitiveQueue.js");
      await import("./core/queue/mediaQueue.js");
      console.log("[Startup] Background Task Workers activated (Cognitive + Media).");
    } catch (qErr) {
      console.error("[Startup] Failed to ignite task queue worker:", qErr);
    }
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
