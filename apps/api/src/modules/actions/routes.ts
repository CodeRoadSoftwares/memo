import { FastifyInstance } from "fastify";
import { prisma } from "../../core/db/prisma.js";

export async function actionRoutes(fastify: FastifyInstance) {
  fastify.get("/actions", async (request, reply) => {
    const userId = request.user!.id;
    const actions = await prisma.action.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return reply.send({ actions });
  });

  fastify.put<{ 
    Params: { id: string }; 
    Body: { type?: string; title?: string; status?: string; payload?: any; scheduledFor?: string | null; recurrence?: string | null } 
  }>(
    "/actions/:id",
    async (request, reply) => {
      const userId = request.user!.id;
      const { id } = request.params;
      const { type, title, status, payload, scheduledFor, recurrence } = request.body;

      try {
        let scheduledForDate: Date | null | undefined = undefined;
        if (scheduledFor !== undefined) {
          scheduledForDate = scheduledFor ? new Date(scheduledFor) : null;
        }

        const action = await prisma.action.update({
          where: { id, userId },
          data: {
            ...(type !== undefined && { type }),
            ...(title !== undefined && { title }),
            ...(status !== undefined && { status }),
            ...(payload !== undefined && { payload }),
            ...(scheduledForDate !== undefined && { scheduledFor: scheduledForDate }),
            ...(recurrence !== undefined && { recurrence }),
          },
        });
        return reply.send({ action });
      } catch (err) {
        return reply.status(404).send({ error: "Action not found" });
      }
    }
  );

  fastify.delete<{ Params: { id: string } }>(
    "/actions/:id",
    async (request, reply) => {
      const userId = request.user!.id;
      const { id } = request.params;
      try {
        await prisma.action.delete({
          where: { id, userId },
        });
        return reply.send({ success: true });
      } catch (err) {
        return reply.status(404).send({ error: "Action not found" });
      }
    }
  );
}
