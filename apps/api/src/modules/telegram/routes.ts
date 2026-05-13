import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { bot } from "../../core/telegram/bot.js";
import { prisma } from "../../core/db/prisma.js";

export async function telegramRoutes(fastify: FastifyInstance) {
  fastify.get("/telegram/info", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    let botUsername: string | null = null;
    if (bot) {
      try {
        const me = await bot.telegram.getMe();
        botUsername = me.username;
      } catch (err) {
        console.error("Failed to fetch bot username:", err);
      }
    }

    return {
      botUsername: botUsername || process.env.TELEGRAM_BOT_USERNAME || null,
      telegramChatId: request.user.telegramChatId,
      telegramUsername: request.user.telegramUsername,
    };
  });

  fastify.post("/telegram/unlink", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    try {
      await prisma.user.update({
        where: { id: request.user.id },
        data: {
          telegramChatId: null,
          telegramUsername: null,
        }
      });

      return {
        success: true,
        message: "Telegram account unlinked successfully.",
      };
    } catch (err) {
      console.error("Failed to unlink telegram:", err);
      return reply.status(500).send({ error: "Failed to unlink account." });
    }
  });
}
