import { FastifyInstance } from "fastify";
import { prisma } from "../../core/db/prisma.js";

export async function relationshipRoutes(fastify: FastifyInstance) {
  fastify.get("/relationships", async (request, reply) => {
    const userId = request.user!.id;
    const relationships = await prisma.relationship.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return reply.send({ relationships });
  });

  fastify.put<{ Params: { id: string }; Body: { relationship?: string; metadata?: any } }>(
    "/relationships/:id",
    async (request, reply) => {
      const userId = request.user!.id;
      const { id } = request.params;
      const { relationship, metadata } = request.body;

      try {
        const rel = await prisma.relationship.update({
          where: { id, userId },
          data: {
            ...(relationship !== undefined && { relationship }),
            ...(metadata !== undefined && { metadata }),
          },
        });
        return reply.send({ relationship: rel });
      } catch (err) {
        return reply.status(404).send({ error: "Relationship not found" });
      }
    }
  );

  fastify.delete<{ Params: { id: string } }>(
    "/relationships/:id",
    async (request, reply) => {
      const userId = request.user!.id;
      const { id } = request.params;
      try {
        await prisma.relationship.delete({
          where: { id, userId },
        });
        return reply.send({ success: true });
      } catch (err) {
        return reply.status(404).send({ error: "Relationship not found" });
      }
    }
  );
}
