<div align="center">

# Memo - second brain on WhatsApp

_Every conversation remembered. Every decision stored. Tasks, reminders, and relationships tracked — through the channel your team already uses._

<br/>

[![PostgreSQL + pgvector](https://img.shields.io/badge/DB-PostgreSQL%20+%20pgvector-4169E1?style=flat-square&logo=postgresql)](https://github.com/pgvector/pgvector)
[![Gemini](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-8E75B2?style=flat-square&logo=google)](https://deepmind.google/technologies/gemini/)
[![WhatsApp](https://img.shields.io/badge/Interface-WhatsApp-25D366?style=flat-square&logo=whatsapp)](https://whatsapp.com)
[![Cloudflare R2](https://img.shields.io/badge/Storage-Cloudflare%20R2-F38020?style=flat-square&logo=cloudflare)](https://developers.cloudflare.com/r2/)

</div>

---

## What Memo is

Memo is an AI-assisted **business memory and operations** layer that sits on **WhatsApp**:

- Users message a linked WhatsApp number (only numbers you register in Memo are accepted).
- Messages are classified, stored, and optionally transcribed (voice) or parsed (images, PDFs via OCR, spreadsheets natively in Node).
- A **cognitive pipeline** loads conversation history, pending actions, semantic memories/entities, short-term session state, and reply-thread context, then calls **Google Gemini 2.5 Flash** for structured output: actions, entities, memories, and a natural-language reply.
- **Skills** (rows in the database) dynamically extend what the model is allowed to do and remember — enable them from the web app.

Deep technical detail lives in **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

---

## Your AI team (skills)

Activate combinations of skills in the web UI. Each skill contributes capabilities, entity types, memory categories, and execution rules to the runtime prompt. The seven product narratives (scheduling, operations, knowledge, CRM, HR, outbound messaging, document intelligence) map to those catalog entries — see `apps/api/seed_skill.ts` / DB seeds for the canonical list.

---

## How a message becomes a reply (accurate summary)

1. **Baileys** receives a WhatsApp update; Memo ignores your own outbound messages and only processes senders that match **`UserPhoneNumber`** rows for that account.
2. **Ephemeral / view-once** wrappers are stripped; text, audio, image, document, and video are classified.
3. **Replies** to earlier messages inject quoted context into the text and, when possible, resolve the quoted stanza to a stored **`Message`** for rich `repliedToMessage` in the model context.
4. **Media** is uploaded to **Cloudflare R2** (`whatsapp/...` keys).
5. **Text** is **debounced 3 seconds** per sender phone, then a **BullMQ** job on Redis runs cognition.
6. **Voice** is transcribed with a local **Python + faster-whisper** script; on success cognition runs **in the same API process** (no queue for that hop).
7. **CSV / XLS / XLSX** is converted to text in Node and enqueued for cognition.
8. **Images / heavy documents** go through a **separate media queue** (concurrency 1 by default) running **Python OCR**, then cognition is enqueued.
9. Cognition builds context (including **pgvector** search: up to 10 memories and 8 entities), compiles **active skills** into the prompt, and returns validated JSON via **Zod**.
10. **Actions** hit PostgreSQL (tasks, reminders, appointments, scheduled outbound messages, etc.); **node-cron** runs every minute to fire due **`Action`** rows.
11. For **list / “what’s on my plate”** style queries, a second Gemini call may run **with Google Search** to polish the answer — the main extraction call is JSON-only without search tools.

---

## Repository structure

| Path | Description |
|------|-------------|
| `apps/api` | Fastify 5, Prisma 7 + `adapter-pg`, Baileys, BullMQ workers, cron, R2 uploads, cognitive code, `python/` scripts, expected local **`venv`** for ML scripts |
| `apps/mobile` | Vite + React 19 + React Router 7 — auth, linking WhatsApp, phone numbers, skills |

There is **no root `package.json`**; install and run each app separately.

---

## Tech stack (from dependencies and code)

| Layer | Technology |
|-------|------------|
| API | Fastify 5, TypeScript (ESM), `tsx` for dev |
| Auth | JWT in HttpOnly cookie + optional `Authorization: Bearer` / `accessToken` query (see ARCHITECTURE) |
| DB | PostgreSQL, Prisma 7, `@prisma/adapter-pg`, **pgvector** (`vector(384)`) |
| Queue | BullMQ + **ioredis** |
| Jobs | node-cron (scheduled actions) |
| WhatsApp | `@whiskeysockets/baileys` |
| Object storage | AWS SDK v3 S3 client → **Cloudflare R2** |
| LLM | `@google/genai` — **gemini-2.5-flash** |
| Embeddings | Persistent Python `embed_server.py` (384-dim vectors, aligned with pgvector columns) |
| Speech | Python `transcribe.py` (faster-whisper in venv) |
| Vision / OCR | Python `ocr.py` via media queue; spreadsheets via **`xlsx`** in Node (`core/tabular.ts`) |
| Dates | **chrono-node** in the action engine |
| Web | React 19, Vite 8, Axios (`withCredentials`), `VITE_API_URL` |

Hosting is environment-specific (e.g. Render for the linked static site); the API must be reachable from the browser for cookies/CORS and must run Redis plus Postgres for full functionality.

---

## Local development (minimal)

**API** (`apps/api`):

- Copy/configure `.env` with at least: `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, R2 variables, Redis host/port, and a populated **`Skill`** / **`User`** data set (migrations + seed as you prefer).
- Create Python **`venv`** under `apps/api` with packages required by `python/transcribe.py`, `python/ocr.py`, and `python/embed_server.py`.
- `npm install` && `npm run dev` (listens on **port 3000**).

**Web** (`apps/mobile`):

- `npm install`
- Set `VITE_API_URL` to your API origin (e.g. `http://localhost:3000`).
- `npm run dev` (Vite default port **5173** — already allowed in API CORS).

---

## Documentation links

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Data flow, queues, Prisma models, routes, env vars, and code-level behavior.
- **[PROBLEM_STATEMENT.md](./PROBLEM_STATEMENT.md)** — Product framing (if present in the repo).

---

<div align="center">

**One WhatsApp surface. Structured cognition. Persistent memory.**

</div>
