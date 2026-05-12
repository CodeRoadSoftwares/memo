import { prisma } from "../db/prisma.js";
import { getSession, WorkingMemory } from "./session.js";

export interface ContextPackage {
  repliedToMessage: { text: string } | null;
  recentConversation: { role: string; message: string; createdAt: Date }[];
  pendingActions: { id: string; type: string; title: string; status: string; scheduledFor: Date | null; recurrence?: string | null }[];
  recentlyCompletedActions: { id: string; type: string; title: string; completedAt: Date | null; recurrence?: string | null }[];
  relevantMemories: { id: string; category: string; content: string }[];
  relevantEntities: { id: string; type: string; name: string; metadata: any }[];
  workingMemory: WorkingMemory;
  currentTime: string;
  currentDayOfWeek: string;
}

export async function buildContext(userId: string, userPhone: string, text: string, rawPayload: any): Promise<ContextPackage> {
  let repliedToMessage: { text: string; processedText?: string | null; type?: string; storageKey?: string | null; id?: string } | null = null;
  
  const unwrapped = rawPayload?.message;
  const contextInfo = 
    unwrapped?.extendedTextMessage?.contextInfo || 
    unwrapped?.imageMessage?.contextInfo || 
    unwrapped?.documentMessage?.contextInfo || 
    unwrapped?.videoMessage?.contextInfo || 
    unwrapped?.audioMessage?.contextInfo;

  if (contextInfo?.stanzaId) {
    try {
      const matches = await prisma.$queryRawUnsafe<any[]>(
         `SELECT id, text, "processedText", type, "storageKey" FROM "Message" WHERE "userId" = $1 AND ("rawPayload"->'key'->>'id') = $2 LIMIT 1`,
         userId,
         contextInfo.stanzaId
      );

      const originalMessage = matches && matches.length > 0 ? matches[0] : null;

      if (originalMessage) {
        repliedToMessage = {
           id: originalMessage.id,
           text: originalMessage.text || "",
           processedText: originalMessage.processedText,
           type: originalMessage.type,
           storageKey: originalMessage.storageKey
        };
      } else {
        const quoted = contextInfo.quotedMessage;
        const quotedText =
          quoted?.conversation ||
          quoted?.extendedTextMessage?.text ||
          quoted?.imageMessage?.caption ||
          quoted?.videoMessage?.caption ||
          null;
        if (quotedText) repliedToMessage = { text: quotedText };
      }
    } catch (err) {
      console.error("[Context] Failed to lookup rich quoted message context:", err);
    }
  }

  const recentConversation = await prisma.conversationEvent.findMany({
    where: { userPhone },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { role: true, message: true, createdAt: true },
  });

  const pendingActions = await prisma.action.findMany({
    where: { userId, status: "pending" },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, type: true, title: true, status: true, scheduledFor: true, recurrence: true },
  });

  const recentlyCompletedActions = await prisma.action.findMany({
    where: { userId, status: "completed" },
    orderBy: { completedAt: "desc" },
    take: 5,
    select: { id: true, type: true, title: true, completedAt: true, recurrence: true },
  });

  let relevantMemories: { id: string; category: string; content: string }[] = [];
  let relevantEntities: { id: string; type: string; name: string; metadata: any }[] = [];
  try {
    const { getEmbedding } = await import("../embeddings.js");
    const vector = await getEmbedding(text);
    const vectorStr = `[${vector.join(",")}]`;

    const memoryMatches = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, category, content FROM "Memory" WHERE "userId" = $1 AND embedding IS NOT NULL ORDER BY (embedding <=> $2::vector) ASC LIMIT 10`,
      userId,
      vectorStr,
    );
    relevantMemories = (memoryMatches || []).map((m) => ({ id: m.id, category: m.category, content: m.content }));

    const entityMatches = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, type, name, metadata FROM "Entity" WHERE "userId" = $1 AND embedding IS NOT NULL ORDER BY (embedding <=> $2::vector) ASC LIMIT 8`,
      userId,
      vectorStr,
    );
    relevantEntities = (entityMatches || []).map((e) => ({ id: e.id, type: e.type, name: e.name, metadata: e.metadata }));

  } catch (err) {
    console.warn("[Context] Skipping semantic search fetch.", err);
  }

  const workingMemory = await getSession(userPhone);

  const now = new Date();
  return {
    repliedToMessage,
    recentConversation: recentConversation.reverse(),
    pendingActions,
    recentlyCompletedActions: recentlyCompletedActions.map((a) => ({ ...a, type: a.type })),
    relevantMemories,
    relevantEntities,
    workingMemory,
    currentTime: now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    currentDayOfWeek: now.toLocaleDateString("en-US", { weekday: "long", timeZone: "Asia/Kolkata" }),
  };
}
