# Memo Architecture

This document describes **Memo’s backend** (`apps/api`): the Fastify process, data stores, queues, cognitive pipeline, scheduler, and Python helpers. **WhatsApp** is documented as its **own layer**—connection lifecycle, session persistence, and message handling—because it is a distinct integration (Baileys WebSocket) on top of the same Node process.

A minimal **web client** (`apps/mobile`) exists for auth, skills, phone numbers, and opening the QR link; it is not the architectural focus here.

**Quick source map**

| Area | Primary paths |
|------|----------------|
| HTTP bootstrap, CORS, startup | `apps/api/src/server.ts` |
| Auth | `apps/api/src/core/auth/apiKeyAuth.ts`, `apps/api/src/modules/auth/routes.ts` |
| WhatsApp (connection + ingest + outbound) | `apps/api/src/core/whatsapp/connection.ts`, `prismaAuth.ts` |
| WhatsApp HTTP triggers | `apps/api/src/modules/whatsapp/routes.ts` |
| Queues | `apps/api/src/core/queue/connection.ts`, `cognitiveQueue.ts`, `mediaQueue.ts` |
| Cognition | `apps/api/src/core/cognitive/processor.ts`, `context.ts`, `actions.ts`, `response.ts`, `session.ts` |
| Media / tabular | `apps/api/src/core/uploadFile.ts`, `r2.ts`, `ocr.ts`, `tabular.ts`, `transcribe.ts` |
| Embeddings | `apps/api/src/core/embeddings.ts`, `apps/api/python/embed_server.py` |
| Scheduler | `apps/api/src/core/scheduler.ts` |
| Schema | `apps/api/prisma/schema.prisma` |

---

## 1. Backend architecture overview

One **Node/OS process** hosts: **Fastify** (HTTP), **Baileys** (WhatsApp WebSocket — detailed in §2–§3), **BullMQ workers**, **node-cron**, and **child processes** for Python (embeddings server, Whisper, OCR). The diagram below is **backend-centric**: HTTP and queues are first-class; WhatsApp is shown as an **adapter** boundary, not expanded here.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND PROCESS — apps/api (Node)                                       │
│                                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  FASTIFY — server.ts                                                                       │ │
│  │  · HTTP: public auth, JWT-protected REST (/me, /skills*, /phone-numbers*)                  │ │
│  │  · Plugins: @fastify/cors, @fastify/cookie, apiKeyAuth preHandler                          │ │
│  │  · Modules: auth, skills, phoneNumbers, whatsapp routes                                    │ │
│  └────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  WHATSAPP ADAPTER (Baileys) — boundary only; lifecycle & ingest in §2–§3                   │ │
│  │  · In-memory activeConnections · persisted WhatsAppSession · events → Message / queues     │ │
│  └────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                 │
│  ┌─────────────────────────────┐  ┌───────────────────────────────────────────────────────────┐ │
│  │  REDIS (ioredis)            │  │  BULLMQ WORKERS (same process)                            │ │
│  │  · Queue backend            │  │  · cognitive-tasks → processCognitiveEvent (processor.ts) │ │
│  │  · REDIS_HOST / REDIS_PORT  │  │  · media-tasks → venv python ocr.py → cognitive handoff   │ │
│  └──────────────┬──────────────┘  └───────────────────────────────────────────────────────────┘ │
│                 │                                                                               │
│  ┌──────────────┴─────────────────────────────────────────────────────────────────────────────┐ │
│  │  COGNITIVE PLANE — core/cognitive/*                                                        │ │
│  │  context.ts → processor.ts (Gemini JSON + Zod) → actions.ts / response.ts → session.ts     │ │
│  │  · Embeddings: embeddings.ts ↔ persistent embed_server.py                                  │ │
│  └────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  AUTONOMOUS PLANE — scheduler.ts (node-cron every minute)                                  │ │
│  │  · Due Action rows → sendWhatsAppMessage / sendMessageToRecipient → status + ConvEvent     │ │
│  └────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  PYTHON SUBPROCESSES (venv under apps/api)                                                 │ │
│  │  · embed_server.py (long-lived) · transcribe.py (per audio) · ocr.py (per media job)       │ │
│  └────────────────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────┬───────────────────────────────────────────----─────┘
                                             |
        ┌────────────────────────────────────┼──────────────────────────────────┐
        ▼                                    ▼                                  ▼
┌───────────────────--┐              ┌─────────────────────┐            ┌─────────────────────────┐
│  PostgreSQL         │              │  pgvector           │            │  Cloudflare R2          │
│  Prisma 7 +         │              │  Memory / Entity    │            │  S3 API (Put/Get)       │
│  @prisma/adapter-pg │              │  vector(384) <=>    │            │  Media objects          │
│  (see §6)           │              │                     │            │                         │
└──────────────────-─-┘              └─────────────────────┘            └─────────────────────────┘
```

**Startup sequence** (`server.ts` after `listen`): (1) load all `WhatsAppSession` rows and call `connectWhatsApp(userId)` for each; (2) `startReminderScheduler()`; (3) import cognitive + media queue modules so **Workers** attach to Redis.

---

## 2. WhatsApp connection layer (separate concern)

This is **pairing and session management**: how the backend holds a Baileys socket, where credentials live, and how HTTP routes drive connect / disconnect / QR. It does **not** describe message classification—that is §3.

### 2.1 Actors and persistence

| Concept | Where it lives |
|---------|----------------|
| Linked WA identity per Memo user | `WhatsAppSession` (Prisma): `userId` (unique), `creds`, `keys`, optional `phone` (WA account number once `open`) |
| Live socket + QR + status | **In memory only**: `activeConnections: Map<userId, WhatsAppClient>` in `connection.ts` |
| Auth state bridge | `usePrismaAuthState` in `prismaAuth.ts` — reads/writes `WhatsAppSession` so restarts can resume without re-scanning when creds still valid |

### 2.2 Connection lifecycle (diagram)

```
                    HTTP (authenticated user)
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
   GET /connect        GET /disconnect      GET /link , /link/status
         │                    │                    │
         │                    │                    └──► HTML QR page or
         │                    │                         "already connected"
         │                    │
         │                    └──► socket.logout / end
         │                         prisma.whatsAppSession.delete
         │                         activeConnections.delete(userId)
         │
         └──► connectWhatsApp(userId)
                    │
                    ├──► If already connecting/connected/qrcode → return existing client
                    │
                    ├──► usePrismaAuthState(userId) ←──► DB WhatsAppSession (creds, keys)
                    │
                    ├──► makeWASocket({ auth: state, printQRInTerminal: false })
                    │
                    ├──► socket.ev.on("creds.update", saveCreds)
                    │
                    ├──► socket.ev.on("messages.upsert", …)     ──► §3 Inbound pipeline
                    │
                    └──► socket.ev.on("connection.update", …)
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
           qr string      connection      connection
           → data URL     === "open"      === "close"
           status         status           │
           qrcode         connected        ├── loggedOut → delete DB session, drop map
                            clear QR       └── else → schedule reconnect (5s): delete map, connectWhatsApp again
```

### 2.3 HTTP routes (`modules/whatsapp/routes.ts`)

| Route | Role |
|-------|------|
| `GET /connect` | Ensures `connectWhatsApp` runs; returns JSON status / hint to open `/link` |
| `GET /disconnect` | Logout + delete `WhatsAppSession` + remove from `activeConnections` |
| `GET /link` | Returns HTML: spinner, QR `<img>`, or success card; may call `connectWhatsApp` if no client in map |
| `GET /link/status` | JSON `{ status }` from `activeConnections.get(userId)?.connectionStatus` or `disconnected` |

### 2.4 Auto-reconnect on API boot

After Fastify listens, the server loads **every** `WhatsAppSession` and calls `connectWhatsApp(userId)` in a loop (errors per user are logged, not fatal). That is **connection** behavior: attempt to restore Baileys from persisted `creds`/`keys`, not ingestion logic.

### 2.5 Outbound sends (still “connection” module, not cognition)

`sendWhatsAppMessage`, `sendWhatsAppMedia`, `sendWhatsAppPresence`, and `sendMessageToRecipient` all resolve `userPhone` → `UserPhoneNumber` → `userId` → `activeConnections.get(userId).socket`. If the socket is missing, send fails (logged). JID selection prefers the last inbound `Message.rawPayload.key.remoteJid` for that `userPhone` when available.

---

## 3. WhatsApp inbound pipeline (after the socket is up)

Once `messages.upsert` fires, the backend **normalizes** traffic and **hands off** to the rest of the backend (DB, R2, queues, or direct cognition).

### 3.1 Acceptance gate

- Skip `fromMe`.
- Resolve allowed senders: `User.phoneNumbers` → match any JID fragment containing a registered `phone`.
- Unwrap: `ephemeralMessage`, `viewOnceMessage`, `viewOnceMessageV2`.
- Classify: `text` | `audio` | `image` | `document` | `video` | `unknown`.
- **Quoted message** on the live payload → prepend `[Context - Replied to: "…"]` to text for the model.

### 3.2 Persist and branch

- Always `prisma.message.create` for accepted inbound (stores `rawPayload` for stanza / JID replay).
- Non-text: download → `uploadFileBuffer` → R2 key `whatsapp/{User.phone}/{msgId}.{ext}`.
- **Routing** (same as modality diagram in §4):

| Type | Next step |
|------|-----------|
| Text | Debounce **3s** per `userPhone` → merge rows → `cognitiveQueue.add({ messageId, text })` |
| Audio | `transcribeAudio` → `processedText` → **`processCognitiveEvent` in-process** (no queue on success path) |
| csv / xls / xlsx | `tabular.ts` → `processedText` → enqueue `cognitiveQueue` |
| Image / document | temp file → `mediaQueue` → `ocr.py` → `cognitiveQueue` |

- `sendWhatsAppPresence(userPhone, "composing")` on save.

### 3.3 Rich reply context (for cognition, not for connection)

`buildContext` (`context.ts`) uses `rawPayload.message.*.contextInfo.stanzaId` to load the quoted **`Message`** row (`text`, `processedText`, `type`, `storageKey`). That powers pronouns and **media retrieval** queries—see §5 cognitive section.

---

## 4. Inbound modality routing (compact)

```
                         messages.upsert (§3)
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  fromMe?  →  SKIP      │
                    │  phone in allowlist?   │
                    └────────────┬───────────┘
                                 │ yes
         ┌───────────────────────┼───────────────────────┬────────────────────┐
         ▼                       ▼                       ▼                    ▼
   ┌───────────┐         ┌────────────----─┐         ┌─────────────┐     ┌─────────────┐
   │   TEXT    │         │    AUDIO        │         │ SPREADSHEET │     │ IMAGE / DOC │
   │ debounce  │         │ R2 + transcribe │         │ tabular.ts  │     │ mediaQueue  │
   │ 3s / phone│         │ (no queue)      │         │ cognitive   │     │ media+OCR   │
   └─────┬─────┘         └──────┬──────----┘         └──────┬──────┘     └──────┬──────┘
         │                      │                           │                   │
         ▼                      ▼                           ▼                   ▼
  cognitiveQueue          processCognitiveEvent       cognitiveQueue       cognitiveQueue
  Worker                      directly                  Worker               Worker
```

---

## 5. Data flow: one user turn (message → side effects → reply)

Entry is typically **WhatsApp** (§3); the cognitive core is the same if a job is retried from the queue.

```
Inbound (WA) ──► Message row + optional R2
        │
        ├──► TEXT / sheet / post-OCR ──► cognitive-tasks ──► Worker
        └──► AUDIO ─────────────────────────────► processCognitiveEvent (direct)
                                    │
                                    ▼
                    processCognitiveEvent
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
 ConversationEvent(user)    buildContext (+ getEmbedding)    UserSkill + Skill
        │                           │                           │
        └───────────────────────────┼───────────────────────────┘
                                    ▼
                    Gemini extractCognition (JSON, no search tools)
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            needsClarification  executeActions  entities + memories
                    │               │               │
                    │               ├──► query? ──► generateQueryResponse (+ optional Google Search)
                    │               └──► media_retrieval? ──► sendWhatsAppMedia (R2)
                    ▼
            sendWhatsAppMessage / session update
                    │
                    ▼
            ConversationEvent(assistant) + presence paused
```

---

## 6. Storage layer (logical view)

```
┌─────────────────────────────────────────────────────────────────────┐
│  PostgreSQL                                                         │
│  User ──┬── WhatsAppSession (creds, keys)     ← §2                  │
│         ├── UserPhoneNumber (inbound allowlist) ← §3 gate           │
│         ├── UserSkill ──► Skill                                     │
│         ├── Message · ConversationEvent · CognitiveSession · Action │
│         ├── Entity · Memory · Relationship                          │
│  pgvector: `<=>` on Memory.embedding / Entity.embedding             │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│  R2 — keys whatsapp/{User.phone}/{waMessageId}.{ext}                │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│  Redis — BullMQ metadata only                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Repository layout

| Path | Role |
|------|------|
| `apps/api` | Backend described in this document |
| `apps/mobile` | Thin SPA: `VITE_API_URL`, cookie auth to API |

No root `package.json`; run API and web as separate packages.

---

## 8. `apps/api/src` module map

```
src/
├── server.ts
├── core/
│   ├── auth/apiKeyAuth.ts
│   ├── db/prisma.ts
│   ├── queue/connection.ts , cognitiveQueue.ts , mediaQueue.ts
│   ├── whatsapp/connection.ts , prismaAuth.ts
│   ├── cognitive/processor.ts , context.ts , actions.ts , response.ts , session.ts
│   ├── scheduler.ts
│   ├── embeddings.ts , transcribe.ts , ocr.ts , tabular.ts
│   ├── uploadFile.ts , r2.ts
├── modules/auth , skills , phoneNumbers , whatsapp/routes.ts
```

---

## 9. Queues (`core/queue/`)

**Redis:** `REDIS_HOST` (default `127.0.0.1`), `REDIS_PORT` (default `6379`).

### Cognitive queue (`cognitive-tasks`)

| Aspect | Behavior |
|--------|----------|
| Producers | Debounced text; OCR completion; tabular completion |
| Payload | `{ messageId, text }` |
| Consumer | `processCognitiveEvent(messageId, text, isRetry)` |
| Concurrency | `COGNITIVE_CONCURRENCY` (default **1**) |
| Lock / stall | `COGNITIVE_LOCK_MS` (default 300000 ms) |
| Retries | `COGNITIVE_ATTEMPTS` (default 5), exponential backoff from 60s |

### Media queue (`media-tasks`)

| Aspect | Behavior |
|--------|----------|
| Role | Serialize OCR (`python/ocr.py`) |
| Concurrency | `MEDIA_CONCURRENCY` (default **1**) |
| Handoff | Update `Message` → `cognitiveQueue.add` |

**Bypass:** Whisper success path calls `processCognitiveEvent` **without** enqueuing.

---

## 10. Cognitive pipeline (`core/cognitive/`)

### `processor.ts` — `processCognitiveEvent` (ordered)

1. Load `Message`; log user `ConversationEvent`.
2. Require at least one `UserSkill`; else WhatsApp reply + return.
3. `buildContext` → `ContextPackage`.
4. `extractCognition` — **Gemini 2.5 Flash**, JSON mime, **no tools**.
5. **Zod** validation; update `Message.intent` / `intentData`.
6. Staleness / `activeQuote` for threaded replies.
7. Clarification branch → working memory + reply + return.
8. `executeActions`; optional `generateQueryResponse` (Gemini + **Google Search**) or `sendWhatsAppMedia`.
9. `upsertEntities`, `storeMemories` (async embeddings).
10. Final WhatsApp reply + assistant `ConversationEvent`.

### Context (`context.ts`)

| Field | Limit / note |
|-------|----------------|
| `recentConversation` | 20 rows; prompt uses **15** |
| `pendingActions` | 30 |
| `recentlyCompletedActions` | 5 |
| `relevantMemories` / `relevantEntities` | 10 / 8 (vector) |
| `workingMemory` | `CognitiveSession`, **1h** TTL |

### `actions.ts` / `response.ts` / `session.ts`

- **chrono-node** on `Action.scheduledFor`; ops: create/update/delete/complete/reopen/query.
- **response.ts**: query narration + optional Google Search (not used on main extraction).
- **session.ts**: `pendingClarification`, `lastActionList`, etc.

---

## 11. HTTP API surface (backend)

**Public:** `GET /`, `POST /auth/signup`, `POST /auth/signin`.

**JWT:** HttpOnly cookie `token`, or `Authorization: Bearer`, or `?accessToken=`.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/me` | Current user |
| POST | `/auth/logout` | Clear cookie |
| GET | `/skills`, `/skills/me` | Catalog / user skills |
| POST | `/skills/me` | `{ skillId }` |
| DELETE | `/skills/me/:skillId` | Remove skill |
| GET/POST | `/phone-numbers` | List / bulk add |
| DELETE | `/phone-numbers/:id` | Remove |
| GET | `/connect`, `/disconnect`, `/link`, `/link/status` | **WhatsApp connection layer (§2)** |

**CORS:** localhost Vite ports + `https://memo-cioe.onrender.com` (+ `www`), credentials on.

---

## 12. Web client (non-primary)

`apps/mobile`: React 19, Vite 8, React Router 7, Axios `withCredentials`, routes under `/signin`, `/signup`, `/link`, `/phones`, `/skills`, `/chat`.

---

## 13. Environment variables

| Concern | Variables |
|---------|-----------|
| Postgres | `DATABASE_URL` |
| JWT | `JWT_SECRET` |
| Gemini | `GEMINI_API_KEY` |
| R2 | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` |
| Redis | `REDIS_HOST`, `REDIS_PORT` |
| Queues | `COGNITIVE_*`, `MEDIA_*` |

Python: **`apps/api/venv`** for `transcribe.py`, `ocr.py`, `embed_server.py`.

---

## 14. Core design decisions

1. **Universal extraction (Zod)** — One schema for LLM output; skills extend behavior via data.
2. **Skill-driven prompts** — Active `Skill` rows shape `extractCognition`.
3. **Layered context** — Timeline, actions, vectors, session, stanza-linked `repliedToMessage`.
4. **Persistent embed server** — Amortize model load (`embed_server.py`).
5. **Text debounce (3s)** — Merge rapid bubbles before one cognitive job.
6. **Stanza resolution** — DB-backed quoted message for pronouns and media queries.
7. **Session persistence** — `WhatsAppSession` + startup `connectWhatsApp` for reconnect (§2).
8. **Entity–memory graph** — With async embedding backfill.
9. **IST** — `Asia/Kolkata` in prompts and query formatting rules.
10. **Two-phase LLM** — JSON extraction vs search-augmented query narration.
11. **Tiered concurrency** — Cognitive retries vs single-flight OCR.
12. **Prisma 7 + adapter-pg** — Explicit pool + driver adapter.

---

## 15. Known gaps

- `/link` HTML may pass `?apiKey=` to `/link/status`; auth expects JWT (`cookie` / `Bearer` / `accessToken`). Cookie to the API origin is the reliable path.
- `zhipuai` in `package.json` is unused by the live Gemini path.

---

## 16. Future (not implemented here)

Examples: TTS replies, richer spreadsheet exports.
