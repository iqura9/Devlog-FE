# DevLog — AI-Assisted Build Progress

This file documents what was built with AI assistance (Claude) and the decisions made along the way.

---

## What was built

### Session 1 — Initial implementation

Starting from a clean Next.js 16 scaffold, the entire DevLog frontend was built from a Claude Design handoff bundle in one session.

**Architecture decisions:**
- Blue theme (user choice; reference design was orange/terracotta)
- `next.config.ts` rewrite proxy: `/api/*` → `http://localhost:3001` — no CORS, no env leaking API keys to the browser
- Tailwind v4 CSS-first config via `@theme {}` in `globals.css` (no `tailwind.config.ts`)
- `@/*` alias pointing at repo root, not `src/`
- ESM packages (`react-markdown`, `remark-gfm`) required `transpilePackages` in Next config

**Data layer rebuilt from scratch** (reference FE had a different backend contract):
- Backend returns enveloped `{data: T}` or 204 for DELETE — custom `http<T>()` wrapper unwraps it
- `AgentUnavailableError` for 503s — each agent panel shows a graceful card when no `GEMINI_API_KEY`
- Subtasks are just `Task` rows with `parentId`; grouped client-side in `hooks/use-tasks.ts`
- Agent `output` is a raw string (markdown or JSON); `DecomposeDialog` JSON-parses it with markdown fence stripping

**Components implemented:**
- `Header`, `Toolbar`, `TaskList`, `TaskCard`, `TaskDialog` — full CRUD
- `AgentPanel` with tabs: Plan day, Standup, Triage
- `PlanDay` — prioritize agent, manual-trigger
- `StaleTriage` — sweep-stale agent, manual-trigger  
- `StandupPanel` — status-update agent; task selector → Slack-format message
- `DecomposeDialog` (modal, now inline in detail page)
- `StatusUpdateDialog` — tone selector, notes textarea, markdown output

**Bugs caught during build:**
- `DecomposeDialog` TypeScript generic was overly complex → simplified to `useState<DecomposeSubtask[]>([])` 
- `PlanDay` and `StaleTriage` auto-fired agent calls on mount → caused Gemini rate-limit errors on every page load. Fixed by removing `useEffect(() => run(), [])` — agents now fire only on explicit button click.
- `react-markdown` / `remark-gfm` are pure ESM → wrapped in `transpilePackages`

---

### Session 2 — Task detail view + UX polish

User reviewed the initial build and gave specific feedback. Three main additions:

**Task detail page** (`/tasks/[id]`):
- Two-panel layout: left = title/description/subtasks, right = DETAILS sidebar
- Priority-colored left border (same as card)
- Whole card clickable; back navigation "← All tasks"

**Standup tab in Agent panel:**
- Third tab added to AgentPanel (Plan day / Standup / Triage)
- `StandupPanel` component: task selector → `api.statusUpdate()` → Slack-format output
- Copy + Redo buttons

**DecomposeDialog clarification flow:**
- Fixed JSON extraction: strips markdown code fences before `JSON.parse`
- `needs_clarification` phase now reliably surfaces the agent's question to the user

---

### Session 3 — Card redesign + inline decompose

**TaskCard redesign** (matching reference screenshots):
- Whole card is now a navigation target (`cursor-pointer`, `onClick` → `/tasks/${id}`)
- Action buttons removed from card; all editing happens in detail page
- Subtasks collapsible via "Show/Hide N subtasks · Y done" toggle chip
- Subtask mini-cards with progress bar, status badge, visual done indicator
- No interactive checkbox on the list view (navigates to detail to edit)

**Edit UX** (detail page):
- Editing happens ONLY in the detail page — no edit modal
- Title and description auto-save with debounce (500ms title, 800ms description)
- Focus state shows a visible blue outline (`ring-2 ring-primary/10 border-primary/40`) so it's obvious what you're editing
- "Auto-saves on pause" hint shows while description is focused

**Subtask cards** (detail page):
- Each subtask is a full card with priority-colored left border
- Interactive toggle checkbox (done/not-done) — on left
- Inline status select dropdown — changes status without leaving the page
- Inline priority select dropdown — same
- Delete button appears on hover (right side)

**Inline decompose** (detail page, replacing the modal):
- Gradient border (blue → purple) wraps the suggestion area — visually distinct from the task
- Loading state: `AgentTrace` stepper ("Assess clarity → Generate → Review")
- Clarify phase: agent shows its question inline; user types answer and continues
- Suggest phase: checkable list of suggested subtasks, each removable with ×
- Refinement input: "Ask AI to refine suggestions…" re-runs the agent with the new prompt
- Regenerate / Discard / Add N buttons

---

## Architecture overview

```
Develog-FE/
├── app/
│   ├── page.tsx              ← task list + create dialog
│   ├── tasks/[id]/page.tsx   ← task detail (edit, subtasks, inline decompose)
│   └── globals.css           ← Tailwind v4 @theme (blue tokens)
├── components/
│   ├── TaskCard.tsx           ← navigational card, collapsible subtasks
│   ├── TaskList.tsx
│   ├── TaskDialog.tsx         ← create-only dialog
│   ├── Header.tsx / Toolbar.tsx
│   ├── badges.tsx             ← StatusBadge, PriorityBadge, ModelBadge
│   └── agents/
│       ├── AgentPanel.tsx     ← 3-tab sidebar
│       ├── PlanDay.tsx        ← prioritize agent
│       ├── StandupPanel.tsx   ← status-update agent
│       ├── StaleTriage.tsx    ← sweep-stale agent
│       ├── DecomposeDialog.tsx ← still available (unused from list, used inline logic)
│       ├── StatusUpdateDialog.tsx
│       └── AgentTrace.tsx
├── hooks/use-tasks.ts         ← flat list → grouped TaskWithSubtasks[]
├── lib/
│   ├── api.ts                 ← HTTP client, envelope unwrap, AgentUnavailableError
│   ├── types.ts               ← Task, Status, Priority, AgentRun, DecomposeOutput
│   └── format.ts              ← ageLabel, STATUS_LABELS, PRIORITY_LABELS
└── next.config.ts             ← rewrite proxy + ESM transpile
```

## How to run

```bash
# 1. Start backend (SQLite + Express + Gemini agents)
cd Backend
cp .env.example .env          # add GEMINI_API_KEY for AI features
npm install && npm run dev     # http://localhost:3001

# 2. Start frontend
cd Develog-FE
npm install && npm run dev     # http://localhost:3000
```

## Limitations / known gaps

- **Estimate field** shown in reference design is not in the backend data model — omitted
- **AI badge** on AI-generated subtasks: backend doesn't track origin — omitted
- Subtask nesting is capped at one level by the backend (enforced server-side)
- `DecomposeDialog` modal component is still present but no longer triggered from the card list — the detail page uses inline decompose state machine instead
