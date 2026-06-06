# DevLog — Frontend

Next.js 16 frontend for the DevLog AI task tracker.

[Video Presentation](https://www.loom.com/share/65db4ead9bd345848cb81ff783491b90)
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

### Or run both with Docker

From **this folder**, `docker compose up --build` runs the frontend and backend together in
production mode (frontend on **4000**, backend on **4001**). The compose file builds the backend from
the sibling `../Backend` folder and persists its SQLite DB to `../Backend/data`. See
`../Backend/README.md` for details.

---

## Architecture

```
Browser (localhost:3000)
   │
   ├─ initial page load ──▶ Next.js Server Component
   │                          └─ lib/api.server.ts fetches BACKEND_URL directly (server→server)
   │                          └─ streams the tasks promise to the client, unwrapped with use() under <Suspense>
   │
   └─ mutations / agents ─▶ relative /api/* fetch
                              └─ next.config.ts rewrite proxy ──▶ BACKEND_URL (default :3001)
                                                                    ├── /api/tasks      CRUD, SQLite
                                                                    └── /api/agents/*   multi-step AI agents
```

Data fetching is split by responsibility:

- **Reads (initial render)** happen in **Server Components** (`app/tasks/page.tsx`,
  `app/tasks/[id]/page.tsx`) via `lib/api.server.ts`. The list page kicks off the fetch, hands the
  *promise* to a client view, and `TaskBoard` unwraps it with React's `use()` inside a `<Suspense>`
  boundary — so the shell paints instantly and the board streams in.
- **Mutations and agent calls** run client-side through `lib/api.ts`, hitting relative `/api/*` URLs
  that the `next.config.ts` rewrite proxies to the backend (no CORS, no keys in the browser).
- After a mutation, the client calls `router.refresh()` to re-run the Server Component fetch.

Routes are defined once in `routes/paths.ts` and consumed through the typed `Links` helper — no
hardcoded route strings anywhere.

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
  globals.css            Tailwind v4 CSS-first theme (blue palette + custom tokens)
  layout.tsx             Root layout: fonts, Toaster
  page.tsx               Redirects to /tasks
  loading.tsx · error.tsx · not-found.tsx · global-error.tsx   Route-level states
  tasks/
    page.tsx             Server Component: fetches tasks, streams promise to the view
    [id]/page.tsx        Server Component: fetches a task + its subtasks → TaskDetailView
    _components/
      TasksView.tsx      Client shell: Header + <Suspense>TaskBoard + AgentPanel + create dialog
      TaskDialog.tsx     Create/edit task dialog

routes/
  paths.ts               Paths + typed Links helper (single source of truth for routes)

lib/
  types.ts               Domain types matching the Backend API (Task, Status, Priority, AgentRun…)
  api.ts                 Client HTTP wrapper: envelope unwrap, AgentUnavailableError, all methods
  api.server.ts          Server-side fetchers used by the RSC pages
  format.ts              Date/age helpers, label maps
  plan.ts · standup.ts · triage.ts · decompose.ts   Parse + shape each agent's JSON output
  json.ts                Tolerant JSON extraction (strips markdown code fences)
  sanitize.ts            URL/text sanitisation for rendered LLM markdown
  utils.ts               cn() utility

hooks/
  use-tasks.ts           useTaskBoard: groups flat list → TaskWithSubtasks[], filter + sort + counts
  useAgentRun.ts         Shared agent-call state (loading / result / unavailable, localStorage persist)
  useDecompose.ts        Decomposition state machine (clarify → suggest → persist)
  useSubtasks.ts · useTaskEditor.ts · useDialogState.ts · useDebouncedCallback.ts

components/
  Header.tsx · Toolbar.tsx          Header (+ action slot) and status filter / sort controls
  TaskBoard.tsx                     use(promise) → useTaskBoard → grouped list (under Suspense)
  TaskBoardSkeleton.tsx             Streaming fallback
  TaskList.tsx · TaskCard.tsx       Empty/loading states and navigational task cards
  TaskDetailView.tsx                Detail page: inline edit, subtasks, inline decompose
  SubtaskDialog.tsx · ConfirmDialog.tsx
  badges.tsx                        StatusBadge, PriorityBadge, ModelBadge
  Markdown.tsx · ErrorDisplay.tsx
  ui/                               shadcn/ui primitives (button, dialog, select, tabs…)
  agents/
    AgentPanel.tsx                  Sticky sidebar, tabs: Plan day / Standup / Triage
    PlanDay.tsx + DayPlanView.tsx   Prioritisation agent + rendered day plan
    StandupPanel.tsx + StandupView.tsx + SlackMessageCard.tsx   Status-update agent
    StaleTriage.tsx + TriageView.tsx                            Stale-sweeper agent
    AgentTrace.tsx                  Multi-step progress visualiser
    AgentUnavailable.tsx            Graceful "no API key" card
```

---

## Backend API contract

The Backend returns **enveloped responses**: `{ "data": ... }` for success, `{ "error": { "code",
"message" } }` for errors, `204 No Content` for DELETE. The `api.ts` client unwraps `.data`
automatically.

### Subtasks

The Backend models subtasks as regular Tasks with a `parentId` (one-level nesting cap). There are
**no independent subtask entities** — `GET /api/tasks` returns a flat list; the `useTaskBoard` hook
(`hooks/use-tasks.ts`) groups them. "Done" state is `status === "done"`, not a boolean flag.

### AI agents

All four agent endpoints (`/api/agents/prioritize`, `/decompose`, `/status-update`, `/sweep-stale`)
return:
```json
{ "data": { "output": "...", "model": "gemini-2.5-flash | claude-…", "steps": [...] } }
```
- `output` is markdown or a JSON string depending on the agent; the `lib/{plan,standup,triage,decompose}.ts`
  helpers parse and shape each one (with `lib/json.ts` stripping any markdown code fences first).
- `steps` is the raw tool-call trace from the multi-step agent loop.
- The backend serves agents with Gemini **or** Claude. When neither key is configured it returns
  **503**; the UI catches `AgentUnavailableError` and renders the `AgentUnavailable` card instead of
  crashing. CRUD still works without any key.

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `BACKEND_URL` | `http://localhost:3001` | URL of the Express backend (server-side only: used by the rewrite proxy and the RSC fetchers) |

`BACKEND_URL` needs **two different values** depending on how you run the app, so split it across two files:

- **`.env`** → `BACKEND_URL=http://backend:4001` — used by **Docker Compose** (it interpolates this file)
  to reach the backend over the compose network by service name. Also baked into the production build's
  rewrite via the compose build arg.
- **`.env.local`** → `BACKEND_URL=http://localhost:3001` — used by **local `npm run dev`**. Next.js
  prefers `.env.local` over `.env`; Docker Compose ignores `.env.local`, so the two never collide.

For plain local development (no Docker) you can keep a single `.env` pointing at `http://localhost:3001`.

---

## Working with the coding agent

This frontend was scaffolded and iterated on with Claude Code. See **[`AGENT_LOG.md`](./AGENT_LOG.md)**
for the honest, session-by-session account of what the agent generated, what was adapted from the
reference design, and what was changed by hand.
