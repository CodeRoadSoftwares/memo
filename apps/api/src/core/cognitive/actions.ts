import * as chrono from "chrono-node";
import { prisma } from "../db/prisma.js";
import { WorkingMemory, updateSession } from "./session.js";

interface ActionInstruction {
  operation: string;
  type: string;
  title?: string | null;
  resolvedIds?: string[];
  scheduledFor?: string | null;
  recurrence?: string | null;
  query?: string | null;
  mutations?: Record<string, any> | null;
}

export interface ActionResults {
  updatedWorkingMemory?: WorkingMemory;
  queryData?: any;
}

/**
 * Universal Action Engine
 */
export async function executeActions(
  userId: string,
  userPhone: string,
  platform: string,
  messageId: string,
  actions: ActionInstruction[],
  workingMemory: WorkingMemory,
  repliedToMessage?: any,
): Promise<ActionResults> {
  let queryData: any = null;
  const wm = { ...workingMemory };

  for (const action of actions) {
    switch (action.operation) {
      case "create":
        await handleCreate(userId, userPhone, platform, messageId, action, wm);
        break;
      case "complete":
        await handleComplete(userId, action, wm);
        break;
      case "delete":
        await handleDelete(userId, action, wm);
        break;
      case "update":
        await handleUpdate(userId, action, wm);
        break;
      case "reopen":
        await handleReopen(userId, action, wm);
        break;
      case "query":
        queryData = await handleQuery(userId, action, wm, repliedToMessage);
        break;
    }
  }

  return { updatedWorkingMemory: wm, queryData };
}

async function handleCreate(
  userId: string, 
  userPhone: string, 
  platform: string,
  messageId: string, 
  action: ActionInstruction, 
  wm: WorkingMemory
) {
  const actionTitle = action.title || "Untitled";
  const actionType = action.type;
  let parsedDate: Date | null = null;

  if (action.scheduledFor) {
    parsedDate = chrono.parseDate(action.scheduledFor) || new Date(action.scheduledFor);
  }

  const created = await prisma.action.create({
    data: {
      userId,
      platform,
      userPhone: platform === "whatsapp" ? userPhone : null,
      telegramChatId: platform === "telegram" ? userPhone : null,
      type: actionType,
      title: actionTitle,
      status: "pending",
      sourceMessageId: messageId,
      scheduledFor: parsedDate || undefined,
      recurrence: action.recurrence || null,
      payload: action.mutations || {},
    },
  });

  if (parsedDate) {
    const recStr = action.recurrence ? ` [Recurrence: ${action.recurrence}]` : "";
    console.log(`⏰ [Action] Created scheduled ${actionType}: "${actionTitle}" for ${parsedDate.toISOString()}${recStr}`);
  } else {
    console.log(`✅ [Action] Created ${actionType}: "${created.title}"`);
  }

  if (!wm.lastActionList) wm.lastActionList = [];
  wm.lastActionList.unshift({ id: created.id, title: created.title, type: created.type, status: "pending" });

  const scheduleStr = parsedDate ? ` scheduled for ${parsedDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })}` : "";

  await storeMemories(userId, messageId, [{
    category: "daily_routine",
    content: `Created ${actionType}: "${actionTitle}"${scheduleStr}.`,
    importance: 0.3
  }]);
}

async function handleComplete(userId: string, action: ActionInstruction, wm: WorkingMemory) {
  const ids = action.resolvedIds || [];
  if (ids.length === 0) return;

  const completedList = await prisma.action.findMany({
    where: { id: { in: ids }, userId },
    select: { type: true, title: true }
  });

  await prisma.action.updateMany({
    where: { id: { in: ids }, userId },
    data: { status: "completed", completedAt: new Date() },
  });
  console.log(`✅ [Action] Completed ${ids.length} action(s)`);

  if (wm.lastActionList) {
    wm.lastActionList = wm.lastActionList.filter((a) => !ids.includes(a.id));
  }

  const memoriesToStore = completedList.map(a => ({
    category: "daily_routine",
    content: `Completed ${a.type}: "${a.title}".`,
    importance: 0.3
  }));
  if (memoriesToStore.length > 0) {
    await storeMemories(userId, "", memoriesToStore);
  }
}

async function handleDelete(userId: string, action: ActionInstruction, wm: WorkingMemory) {
  const ids = action.resolvedIds || [];
  if (ids.length === 0) return;

  await prisma.action.deleteMany({ where: { id: { in: ids }, userId } });
  console.log(`🗑️ [Action] Deleted ${ids.length} action(s)`);

  if (wm.lastActionList) {
    wm.lastActionList = wm.lastActionList.filter((a) => !ids.includes(a.id));
  }
}

async function handleUpdate(userId: string, action: ActionInstruction, wm: WorkingMemory) {
  const ids = action.resolvedIds || [];
  if (ids.length === 0) return;

  const updateData: any = {};
  if (action.title) updateData.title = action.title;
  if (action.mutations) {
    for (const [key, value] of Object.entries(action.mutations)) {
      if (["title", "status"].includes(key)) updateData[key] = value;
    }
  }
  if (action.scheduledFor) {
    updateData.scheduledFor = chrono.parseDate(action.scheduledFor) || new Date(action.scheduledFor);
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.action.updateMany({ where: { id: { in: ids }, userId }, data: updateData });
    console.log(`✏️ [Action] Updated ${ids.length} action(s)`);

    if (wm.lastActionList && updateData.title) {
      for (const item of wm.lastActionList) {
        if (ids.includes(item.id)) item.title = updateData.title;
      }
    }
  }
}

async function handleReopen(userId: string, action: ActionInstruction, wm: WorkingMemory) {
  const ids = action.resolvedIds || [];
  if (ids.length === 0) return;

  const reopened = await prisma.action.updateMany({
    where: { id: { in: ids }, userId },
    data: { status: "pending", completedAt: null },
  });
  console.log(`🔄 [Action] Reopened ${reopened.count} action(s)`);

  const actions = await prisma.action.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, type: true, status: true } });
  if (!wm.lastActionList) wm.lastActionList = [];
  for (const a of actions) {
    if (!wm.lastActionList.some((e) => e.id === a.id)) {
      wm.lastActionList.unshift({ id: a.id, title: a.title, type: a.type, status: a.status });
    }
  }
}

async function handleQuery(userId: string, action: ActionInstruction, wm: WorkingMemory, repliedToMessage?: any): Promise<any> {
  const queryType = action.type.toLowerCase();

  if (queryType === "task") {
    const tasks = await prisma.action.findMany({
      where: { userId, type: "task", status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    wm.lastActionList = tasks.map((t) => ({ id: t.id, title: t.title, type: t.type, status: t.status }));
    wm.activeTopic = "tasks";
    return { type: "task_list", items: tasks.map((t, i) => ({ index: i + 1, title: t.title, status: t.status, createdAt: t.createdAt })) };
  }

  if (["reminder", "appointment", "meeting", "demo", "calendar_event"].includes(queryType)) {
    const targetTypes = queryType === "reminder"
      ? ["reminder"]
      : ["appointment", "meeting", "demo", "calendar_event", "reminder"];

    const items = await prisma.action.findMany({
      where: { userId, type: { in: targetTypes }, status: "pending" },
      orderBy: { scheduledFor: "asc" },
      take: 20,
    });
    wm.lastActionList = items.map((t) => ({ id: t.id, title: t.title, type: t.type, status: t.status }));
    wm.activeTopic = queryType === "reminder" ? "reminders" : "appointments";
    return {
      type: queryType === "reminder" ? "reminder_list" : "appointment_list",
      items: items.map((r, i) => ({ index: i + 1, title: r.title, type: r.type, scheduledFor: r.scheduledFor }))
    };
  }

  if (["document", "file", "media", "image", "receipt"].includes(queryType)) {
    if (repliedToMessage && repliedToMessage.storageKey) {
       wm.activeTopic = "media_retrieval";
       return {
          type: "media_retrieval",
          found: true,
          storageKey: repliedToMessage.storageKey,
          mimeType: repliedToMessage.type === "image" ? "image/jpeg" : "application/pdf",
          caption: (repliedToMessage.text && !repliedToMessage.text.startsWith("[")) ? repliedToMessage.text : "Here is the document you referenced.",
          messageId: repliedToMessage.id
       };
    }

    const genericWords = ["it", "that", "file", "document", "image", "receipt", "them", "back", "me"];
    const searchPhrase = (action.query || action.title || "").trim().toLowerCase();
    
    const isVague = !searchPhrase || genericWords.includes(searchPhrase) || searchPhrase === "send it back" || searchPhrase === "it back";

    let semanticMatchId: string | null = null;
    if (!isVague) {
       try {
          const { getEmbedding } = await import("../embeddings.js");
          const vector = await getEmbedding(searchPhrase);
          const vectorStr = `[${vector.join(",")}]`;
          const memoryMatches = await prisma.$queryRawUnsafe<any[]>(
             `SELECT "sourceMessageId" FROM "Memory" 
              WHERE "userId" = $1 AND "sourceMessageId" IS NOT NULL AND embedding IS NOT NULL 
              ORDER BY (embedding <=> $2::vector) ASC LIMIT 1`,
             userId,
             vectorStr
          );
          if (memoryMatches && memoryMatches.length > 0 && memoryMatches[0].sourceMessageId) {
             semanticMatchId = memoryMatches[0].sourceMessageId;
             console.log(`🎯 [Semantic Search] Located candidate sourceMessageId via memory embedding: ${semanticMatchId}`);
          }
       } catch (err) {
          console.warn("[Semantic Search] Memory embedding fallback lookup failed or engine offline.");
       }
    }

    let fileSearch: any = null;
    if (semanticMatchId) {
       fileSearch = await prisma.message.findUnique({
          where: { id: semanticMatchId },
          select: { id: true, storageKey: true, mimeType: true, text: true }
       });
       if (!fileSearch?.storageKey) fileSearch = null; 
    }

    if (!fileSearch) {
       fileSearch = await prisma.message.findFirst({
         where: {
           userId,
           storageKey: { not: null },
           ...(isVague ? {} : {
             OR: [
               { text: { contains: searchPhrase, mode: "insensitive" } },
               { processedText: { contains: searchPhrase, mode: "insensitive" } }
             ]
           })
         },
         orderBy: { createdAt: "desc" },
         select: { id: true, storageKey: true, mimeType: true, text: true }
       });
    }

    if (fileSearch && fileSearch.storageKey) {
      wm.activeTopic = "media_retrieval";
      return {
        type: "media_retrieval",
        found: true,
        storageKey: fileSearch.storageKey,
        mimeType: fileSearch.mimeType || "application/octet-stream",
        caption: (fileSearch.text && !fileSearch.text.startsWith("[")) ? fileSearch.text : "Here is the requested document.",
        messageId: fileSearch.id
      };
    }
    return { type: "media_retrieval", found: false };
  }

  const memories = await prisma.memory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return { type: "memory_search", query: action.query || action.title, items: memories.map((m) => ({ category: m.category, content: m.content })) };
}

/**
 * Store extracted memories
 */
export async function storeMemories(userId: string, messageId: string, memories: { category: string; content: string; entityName?: string | null; entityType?: string | null; importance?: number }[]) {
  for (const mem of memories) {
    let entityId: string | undefined;
    if (mem.entityName) {
      const entity = await prisma.entity.findFirst({
        where: { 
          userId, 
          name: { equals: mem.entityName, mode: "insensitive" },
          ...(mem.entityType ? { type: { equals: mem.entityType, mode: "insensitive" } } : {})
        },
        select: { id: true },
      });
      if (entity) entityId = entity.id;
    }

    const created = await prisma.memory.create({
      data: {
        userId,
        entityId,
        category: mem.category,
        content: mem.content,
        sourceMessageId: messageId || undefined,
        importanceScore: mem.importance || 0.5,
        metadata: mem.entityName ? { entityName: mem.entityName } : undefined,
      },
    });
    console.log(`🧠 [Memory] Stored: "${mem.content.substring(0, 50)}..." (${mem.category})${entityId ? ` → Entity: ${mem.entityName}` : ""}`);

    import("../embeddings.js")
      .then(({ getEmbedding }) =>
        getEmbedding(mem.content).then((vector) => {
          const vectorStr = `[${vector.join(",")}]`;
          return prisma.$executeRawUnsafe(`UPDATE "Memory" SET embedding = $1::vector WHERE id = $2`, vectorStr, created.id);
        }),
      )
      .catch(() => {});
  }
}

/**
 * Upsert extracted entities
 */
export async function upsertEntities(userId: string, entities: { type: string; name: string; metadata?: any }[]) {
  for (const ent of entities) {
    const existing = await prisma.entity.findFirst({
      where: { userId, type: ent.type, name: { equals: ent.name, mode: "insensitive" } },
    });

    if (existing) {
      await prisma.entity.update({
        where: { id: existing.id },
        data: { metadata: { ...(existing.metadata as any), ...ent.metadata } },
      });
      console.log(`🔄 [Entity] Updated: ${ent.type}/${ent.name}`);
    } else {
      const created = await prisma.entity.create({
        data: { userId, type: ent.type, name: ent.name, metadata: ent.metadata || {} },
      });
      console.log(`✨ [Entity] Created: ${ent.type}/${ent.name}`);

      import("../embeddings.js")
        .then(({ getEmbedding }) =>
          getEmbedding(`${ent.type}: ${ent.name}`).then((vector) => {
            const vectorStr = `[${vector.join(",")}]`;
            return prisma.$executeRawUnsafe(`UPDATE "Entity" SET embedding = $1::vector WHERE id = $2`, vectorStr, created.id);
          }),
        )
        .catch(() => {});
    }
  }
}
