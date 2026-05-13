import { prisma } from "../db/prisma.js";

export interface WorkingMemory {
  lastActionList?: { id: string; title: string; type: string; status: string }[];
  pendingClarification?: {
    type: string;
    originalData: any;
  };
  activeTopic?: string;
}

const SESSION_EXPIRY_MS = 60 * 60 * 1000;

export async function getSession(userId: string): Promise<WorkingMemory> {
  try {
    const session = await prisma.cognitiveSession.findUnique({ where: { userId } });
    if (!session) return {};
    if (new Date() > session.expiresAt) {
      await prisma.cognitiveSession.update({
        where: { userId },
        data: { workingMemory: {}, expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS) },
      });
      return {};
    }
    return (session.workingMemory as any) || {};
  } catch {
    return {};
  }
}

export async function updateSession(userId: string, workingMemory: WorkingMemory) {
  try {
    await prisma.cognitiveSession.upsert({
      where: { userId },
      create: { userId, workingMemory: workingMemory as any, expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS) },
      update: { workingMemory: workingMemory as any, expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS) },
    });
  } catch (err: any) {
    console.error(`[Session] Error updating session:`, err.message || err);
  }
}
