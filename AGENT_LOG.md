# Agent Log — DevLog Frontend

Honest, session-by-session account of how Claude Code was used to build the DevLog frontend, where it
helped, and where it needed correction. (This file was previously named `AI_PROGRESS.md`; renamed to
`AGENT_LOG.md` to match the brief.)

---

## What the agent did

The frontend was **scaffolded by the agent** from a Claude Design handoff bundle (exported from
claude.ai/design): the component tree, shadcn/ui setup, the Tailwind v4 CSS-first theme, the data
layer, and all agent UI panels. Manual edits on top were expected and frequent — they're called out
per session below.

### Session 1 — Initial implementation

Built the whole frontend from the design bundle in one pass.

**Architecture decisions (human-driven, agent-executed):**
- Blue theme (reference design was orange/terracotta)
- `next.config.ts` rewrite proxy: `/api/*` → `http://localhost:3001` — no CORS, no API keys in the browser
- Tailwind v4 CSS-first config via `@theme {}` in `globals.css` (no `tailwind.config.ts`)
- `@/*` alias pointing at repo root, not `src/`
- ESM packages (`react-markdown`, `remark-gfm`) required `transpilePackages` in the Next config

**Data layer rebuilt from scratch** (the reference bundle assumed a different backend contract):
- Backend returns enveloped `{data: T}`, or 204 for DELETE — a custom `http<T>()` wrapper unwraps it
- `AgentUnavailableError` for the 503 case — each agent panel shows a graceful card when no provider key is set
- Subtasks are just `Task` rows with `parentId`; grouped in `hooks/use-tasks.ts`
- Agent `output` is a raw string (markdown or JSON), parsed by small `lib/*` helpers with fence-stripping

**Bugs caught during the build:**
- `PlanDay` and `StaleTriage` auto-fired their agent calls on mount → rate-limit errors on every page
  load. Fixed by removing the `useEffect(() => run(), [])` — agents now fire only on explicit click.
- Over-complex TypeScript generics in the decompose state → simplified.
- `react-markdown` / `remark-gfm` are pure ESM → wrapped in `transpilePackages`.

### Session 2 — Task detail view + UX polish

- **Task detail page** (`/tasks/[id]`): two-panel layout, priority-coloured border, back navigation.
- **Standup tab** added to the agent panel (Plan day / Standup / Triage), wired to `api.statusUpdate()`.
- **Decompose clarification flow**: reliably strips markdown fences before `JSON.parse` so the
  `needs_clarification` question surfaces to the user.

### Session 3 — Card redesign + inline decompose

- **TaskCard** became a navigation target; per-card action buttons removed (all editing lives in the detail page).
- **Detail-page editing**: title/description auto-save with debounce; visible focus ring; "auto-saves on pause" hint.
- **Subtask cards**: inline status + priority selects, toggle checkbox, hover-to-delete.
- **Inline decompose** replaced the modal: an `AgentTrace` stepper, a clarify phase, a checkable
  suggestion list, and a "refine suggestions" re-run — driven by the `useDecompose` state machine.

### Session 4 — Move reads to Server Components + estimation

- **Reads moved to RSC.** `app/tasks/page.tsx` and `app/tasks/[id]/page.tsx` now fetch on the server
  via `lib/api.server.ts`. The list page hands the *promise* to a client view and `TaskBoard` unwraps
  it with `use()` under `<Suspense>` (streaming). Mutations stay client-side and call `router.refresh()`.
- **Typed routing.** All routes are defined in `routes/paths.ts` and consumed via the `Links` helper —
  no hardcoded route strings (enforced by the project's code-style skill).
- **Estimation.** The backend gained an `estimation` field (and a subtask-rollup flag), so the client
  now reads/writes it; the "estimate not supported" limitation from earlier sessions no longer applies.

---

## Architecture overview (current)

```
Develog-FE/
├── app/
│   ├── page.tsx                  → redirect to /tasks
│   ├── tasks/page.tsx            → Server Component: fetch tasks, stream promise to the view
│   ├── tasks/[id]/page.tsx       → Server Component: fetch task + subtasks → TaskDetailView
│   ├── tasks/_components/        → TasksView (client shell), TaskDialog
│   ├── globals.css               → Tailwind v4 @theme (blue tokens)
│   └── loading/error/not-found   → route-level states
├── routes/paths.ts               → Paths + typed Links helper
├── components/
│   ├── TaskBoard.tsx             → use(promise) + useTaskBoard → grouped list (under Suspense)
│   ├── TaskCard / TaskList / TaskDetailView / SubtaskDialog / ConfirmDialog
│   ├── badges.tsx · Markdown.tsx · ErrorDisplay.tsx
│   └── agents/
│       ├── AgentPanel.tsx        → 3-tab sidebar (Plan day / Standup / Triage)
│       ├── PlanDay + DayPlanView         → prioritisation agent
│       ├── StandupPanel + StandupView + SlackMessageCard → status-update agent
│       ├── StaleTriage + TriageView      → sweep-stale agent
│       ├── AgentTrace.tsx        → multi-step progress visualiser
│       └── AgentUnavailable.tsx  → graceful "no API key" card
├── hooks/   use-tasks · useAgentRun · useDecompose · useSubtasks · useTaskEditor · useDialogState · useDebouncedCallback
├── lib/     api · api.server · types · format · plan · standup · triage · decompose · json · sanitize · utils
└── next.config.ts                → rewrite proxy + ESM transpile
```

## How to run

```bash
# 1. Start the backend (SQLite + Express + AI agents)
cd ../Backend
cp .env.example .env          # add GEMINI_API_KEY and/or ANTHROPIC_API_KEY for AI features
npm install && npm run dev    # http://localhost:3001

# 2. Start the frontend
cd ../Develog-FE
npm install && npm run dev    # http://localhost:3000
```

## What required human judgment

- Splitting reads (RSC) from mutations (client) rather than going all-client or all-server.
- The inline-decompose state machine UX (clarify → suggest → refine → persist) — the agent built the
  pieces; the flow design and copy were directed by hand.
- Theme, card redesign, and the "edit only in the detail page" interaction model.

## Known gaps (deliberate)

- **AI-origin badge** on generated subtasks: the backend doesn't track origin, so it's omitted.
- Subtask nesting is capped at one level (enforced server-side).
- No optimistic UI for mutations — they round-trip and then `router.refresh()`; simpler and correct,
  at the cost of a small delay.
