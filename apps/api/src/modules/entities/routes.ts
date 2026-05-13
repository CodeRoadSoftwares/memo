import { FastifyInstance } from "fastify";
import { prisma } from "../../core/db/prisma.js";

export async function entityRoutes(fastify: FastifyInstance) {
  fastify.get("/entities", async (request, reply) => {
    const userId = request.user!.id;
    const entities = await prisma.entity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return reply.send({ entities });
  });

  fastify.put<{ Params: { id: string }; Body: { type?: string; name?: string; metadata?: any } }>(
    "/entities/:id",
    async (request, reply) => {
      const userId = request.user!.id;
      const { id } = request.params;
      const { type, name, metadata } = request.body;

      try {
        const entity = await prisma.entity.update({
          where: { id, userId },
          data: {
            ...(type !== undefined && { type }),
            ...(name !== undefined && { name }),
            ...(metadata !== undefined && { metadata }),
          },
        });

        // Update embedding if name or type changed
        if (name || type) {
          import("../../core/embeddings.js")
            .then(({ getEmbedding }) =>
              getEmbedding(`${entity.type}: ${entity.name}`).then((vector) => {
                const vectorStr = `[${vector.join(",")}]`;
                return prisma.$executeRawUnsafe(`UPDATE "Entity" SET embedding = $1::vector WHERE id = $2`, vectorStr, id);
              })
            )
            .catch(() => {});
        }

        return reply.send({ entity });
      } catch (err) {
        return reply.status(404).send({ error: "Entity not found" });
      }
    }
  );

  fastify.delete<{ Params: { id: string } }>(
    "/entities/:id",
    async (request, reply) => {
      const userId = request.user!.id;
      const { id } = request.params;
      try {
        await prisma.entity.delete({
          where: { id, userId },
        });
        return reply.send({ success: true });
      } catch (err) {
        return reply.status(404).send({ error: "Entity not found" });
      }
    }
  );
}
