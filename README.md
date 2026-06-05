# DevLog — Frontend

Next.js 16 frontend for the DevLog AI task tracker.

## Quick start

> Both the Backend and Frontend must be running at the same time.

```bash
# 1. Start the Express Backend (port 3001)
cd ../Backend
cp .env.example .env          # add your GEMINI_API_KEY
npm install
npm run dev

# 2. In a separate terminal, start this Next.js frontend (port 3000)
cd ../Develog-FE
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Architecture

```
Browser (localhost:3000)
   │
   │  relative /api/* requests
   ▼
Next.js rewrite proxy (next.config.ts)
   │
   │  proxied to BACKEND_URL (default: http://localhost:3001)
   ▼
Express Backend (localhost:3001)
   │
   ├── /api/tasks         CRUD, SQLite
   └── /api/agents/*      Gemini multi-step AI agents
```

The frontend is a single **App Router** `"use client"` page (`app/page.tsx`). There are no Server
Components with data-fetching — all data is fetched client-side via native `fetch` through the rewrite
proxy. This keeps the architecture simple and avoids RSC/streaming complexity.

### Key libraries

| Layer | Library |
|---|---|
| UI components | shadcn/ui (new-york style) + Tailwind v4 |
| Icons | lucide-react |
| Toast notifications | sonner |
| Markdown rendering | react-markdown + remark-gfm |
| Fonts | Plus Jakarta Sans + JetBrains Mono (next/font/google) |

---

## Project structure

```
app/
  globals.css      Tailwind v4 CSS-first theme (blue palette + custom tokens)
  layout.tsx       Root layout: fonts, Toaster
  page.tsx         Main page — two-column layout, dialog orchestration

lib/
  types.ts         Domain types matching the Backend API (Task, Status, Priority…)
  api.ts           HTTP client: fetch wrapper + all API methods
  format.ts        Date helpers, label maps
  utils.ts         cn() utility

hooks/
  use-tasks.ts     Fetches flat task list, groups into TaskWithSubtasks[], counts

components/
  Header.tsx       Logo + "New task" button
  Toolbar.tsx      Status filter tabs + sort selector
  TaskCard.tsx     Individual task card with inline subtask checkboxes
  TaskList.tsx     Loading skeletons, empty state, list of TaskCards
  TaskDialog.tsx   Create/edit task dialog
  badges.tsx       StatusBadge, PriorityBadge, ModelBadge
  Markdown.tsx     Renders LLM markdown output
  ui/              shadcn/ui primitives (button, dialog, select, tabs…)
  agents/
    AgentPanel.tsx         Sticky sidebar with Plan day / Triage tabs
    AgentTrace.tsx         Multi-step progress visualiser
    PlanDay.tsx            Prioritisation agent panel
    StaleTriage.tsx        Stale-sweeper agent panel
    DecomposeDialog.tsx    Task decomposition dialog
    StatusUpdateDialog.tsx Status-update (Slack-message) dialog
```

---

## Backend API contract

The Backend returns **enveloped responses**: `{ "data": ... }` for success, `{ "error": { "code",
"message" } }` for errors, `204 No Content` for DELETE. The `api.ts` client unwraps `.data`
automatically.

### Subtasks

The Backend models subtasks as regular Tasks with a `parentId` (one-level nesting cap). There are
**no independent subtask entities** — `GET /api/tasks` returns a flat list; the `use-tasks` hook
groups them client-side. "Done" state is `status === "done"`, not a boolean flag.

### AI agents

All four agent endpoints (`/api/agents/prioritize`, `/decompose`, `/status-update`, `/sweep-stale`)
return:
```json
{ "data": { "output": "...", "model": "gemini-2.5-flash", "steps": [...] } }
```
- `output` is markdown for most agents, a JSON string for decompose.
- `steps` is the raw tool-call trace from the multi-step agent loop.
- Without `GEMINI_API_KEY`, all agents return **503**. The UI catches
  `AgentUnavailableError` and shows a graceful "Set GEMINI_API_KEY" card instead of crashing.
  CRUD still works without a key.

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `BACKEND_URL` | `http://localhost:3001` | URL of the Express backend (server-side only, used by rewrite proxy) |

Copy `.env.example` to `.env.local` and edit as needed.

---

## AGENT_LOG

This frontend was implemented by Claude Code (claude-opus-4-8) using the Claude Design handoff
bundle (exported from claude.ai/design) as a reference.

**What the agent generated:** The complete component tree, shadcn/ui setup, Tailwind v4 CSS-first
theme (blue variant), data layer (`lib/api.ts`, `lib/types.ts`, `hooks/use-tasks.ts`), all agent UI
components, and this README.

**What was adapted vs the reference design:** The reference design used an independent demo backend
with embedded subtask objects, string IDs, raw JSON responses, structured agent result types, and
`/api/agents/status` endpoint. All of these were rewritten to match the real Backend's contract:
numeric IDs, `parentId` one-level subtask nesting, `{data}` envelopes, `{output: string}` agent
responses parsed from markdown/JSON, and graceful 503 handling. The orange/terracotta colour theme
was swapped to blue per user preference.

**Manual edits:** The `DecomposeDialog` needed extra JSON-parse error handling since the Backend's
`output` format can vary. The `StatusUpdateDialog` added an optional `notes` textarea (the Backend
supports this; the reference design omitted it). The `StaleTriage` component was simplified from
per-item action buttons to a single "Apply safe fixes" re-run with `apply: true` (the Backend's
`sweep-stale` endpoint handles the decision logic internally).
