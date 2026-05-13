import { FastifyInstance } from "fastify";
import { prisma } from "../../core/db/prisma.js";

export async function memoryRoutes(fastify: FastifyInstance) {
  fastify.get("/memories", async (request, reply) => {
    const userId = request.user!.id;
    const memories = await prisma.memory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return reply.send({ memories });
  });

  fastify.put<{ Params: { id: string }; Body: { category?: string; content?: string; metadata?: any } }>(
    "/memories/:id",
    async (request, reply) => {
      const userId = request.user!.id;
      const { id } = request.params;
      const { category, content, metadata } = request.body;

      try {
        const memory = await prisma.memory.update({
          where: { id, userId },
          data: {
            ...(category !== undefined && { category }),
            ...(content !== undefined && { content }),
            ...(metadata !== undefined && { metadata }),
          },
        });
        
        // Update embedding if content changed
        if (content) {
          import("../../core/embeddings.js")
            .then(({ getEmbedding }) =>
              getEmbedding(content).then((vector) => {
                const vectorStr = `[${vector.join(",")}]`;
                return prisma.$executeRawUnsafe(`UPDATE "Memory" SET embedding = $1::vector WHERE id = $2`, vectorStr, id);
              })
            )
            .catch(() => {});
        }

        return reply.send({ memory });
      } catch (err) {
        return reply.status(404).send({ error: "Memory not found" });
      }
    }
  );

  fastify.delete<{ Params: { id: string } }>(
    "/memories/:id",
    async (request, reply) => {
      const userId = request.user!.id;
      const { id } = request.params;
      try {
        await prisma.memory.delete({
          where: { id, userId },
        });
        return reply.send({ success: true });
      } catch (err) {
        return reply.status(404).send({ error: "Memory not found" });
      }
    }
  );
}
