# Connected Canvas Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A browser demo of Connected Canvas that runs the journey moodboard → AI directions → vote → approve → AI code proposal → simulated GitHub PR, reliably and beautifully, on reusable foundations.

**Architecture:** A pure TypeScript core (types, planner interface, board reducer) has no UI dependencies. A scripted planner implements the planner interface. A demo orchestrator (zustand store) drives beats and talks to the canvas only through a `CanvasPort` interface, so it is unit-tested with a fake port. The tldraw adapter implements that port with custom shapes. React shell components read the store.

**Tech Stack:** React 19, TypeScript, Vite, tldraw 5.6.x, zustand 5, lucide-react, @fontsource-variable/geist + geist-mono, Vitest + jsdom + Testing Library, Playwright (system Chrome at `/usr/bin/google-chrome`).

**Spec:** `docs/superpowers/specs/2026-11-23-connected-canvas-demo-design.md` (read with `PRODUCT.md` and the direction contract in `.impeccable/surfaces/src-app-tsx.md`).

## Global Constraints

- tldraw SDK 5.x; never hide or alter the "made with tldraw" watermark; license key read from `VITE_TLDRAW_LICENSE_KEY` (optional in dev).
- No brand logos for Figma, Adobe, GitHub etc.; tools appear as file-type tags (`.fig`, `.ai`, `.tsx`, `.pdf`) and plain-text tool names.
- Top bar always shows a "Sample data" tag. External actions are labeled "Simulated in demo".
- Only "Warm & tactile" can be approved. Approving "Editorial" or "Playful modern" replies: "In this demo the team has voted for Warm & tactile — in the real product any direction can be approved." and changes nothing.
- Figma is read-only. The execution run has exactly three GitHub steps: create branch `direction/warm-tactile`, commit 1 file, open pull request #42. Completion toast: "Nothing was merged or deployed."
- Beat 0 is a clean wall: no ghosts, "Review changes" = 0, AI greets with the Organize chip.
- Every AI canvas change is previewed as ghosts (cobalt dashed outline, cobalt dot, reduced opacity) and only applied on Accept; one undo reverts an accepted proposal.
- Dot colours mean state only: cobalt = proposal waiting, green = linked/in sync, amber = changed/missing, vermilion = approved.
- Fonts: Geist (UI), Geist Mono (paths, tags, code); tldraw's draw font for human notes. Shell graphite, canvas pale cool grey, artifacts white prints.
- Natural live-call pace: thinking steps 400–800 ms each. No autoplay mode.
- Desktop 1280–1920 is the target; narrow widths must not break. `prefers-reduced-motion` disables dot and card animation. WCAG AA text contrast in shell and panels.
- Sample project: Northbound Studio × Halden Coffee; teammates Maya (designer), Jon (developer), You (creative lead).

## Review Focus

1. Driver deletes a seeded card before a beat → that beat skips it without error (pinned in Task 3).
2. Driver presses Cmd/Ctrl+Z right after accepting → demo returns to that beat and re-offers the proposal (Task 5).
3. Empty, whitespace or unrelated prompt → Send disabled for empty; unrelated text gets the help reply plus the current chip (Tasks 3 and 6).
4. Double-clicking Accept/Approve or a chip while the AI is "thinking" → exactly one proposal or run (Task 5).
5. Restart or Jump while thinking or executing → pending timers cancelled; no stale steps or messages appear afterwards (Task 5).

---

### Task 1: Project scaffold, tokens and empty shell

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles/tokens.css`, `src/styles/app.css`, `vitest.setup.ts`, `playwright.config.ts`, `.gitignore`, `.env.example`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: `App` default export rendering `<div className="cc-app">` with regions `header.cc-topbar`, `aside.cc-sources`, `main.cc-canvas` (contains `<Tldraw>`), `aside.cc-ai`. CSS custom properties in `tokens.css`: `--cc-graphite-950/900/800/700`, `--cc-shell-text`, `--cc-shell-muted`, `--cc-board`, `--cc-print`, `--cc-ink`, `--cc-ink-muted`, `--cc-hairline`, `--cc-dot-cobalt`, `--cc-dot-green`, `--cc-dot-amber`, `--cc-dot-vermilion`, `--cc-font-ui`, `--cc-font-mono`, spacing `--cc-space-1..8`, radii `--cc-radius-s/m/l`, `--cc-shadow-print`, `--cc-shadow-print-lift`. Values are the builder's call within the direction contract.

- [ ] **Step 1:** `npm create vite@latest . -- --template react-ts`, then install `tldraw@^5.6.2 zustand lucide-react @fontsource-variable/geist @fontsource-variable/geist-mono` and dev deps `vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom @playwright/test`. Scripts: `dev`, `build`, `test` (`vitest run`), `e2e` (`playwright test`), `typecheck` (`tsc -b --noEmit`).
- [ ] **Step 2: Write the failing test** `App.test.tsx` › "renders the four shell regions": render `<App/>` (mock `tldraw`'s `Tldraw` to a `<div data-testid="tldraw"/>` via `vi.mock`), assert `getByRole('banner')`, `getByRole('complementary', {name: 'Sources'})`, `getByRole('complementary', {name: 'AI'})`, `getByTestId('tldraw')` exist and `getByText('Sample data')` is visible.
- [ ] **Step 3:** Run `npm test` → FAIL.
- [ ] **Step 4:** Implement the shell grid (top bar 48–56 px, sources rail ~248 px, AI panel ~360 px, canvas fills) with tokens; import tldraw CSS and Geist fonts; pass `licenseKey={import.meta.env.VITE_TLDRAW_LICENSE_KEY}`.
- [ ] **Step 5:** `npm test` → PASS; `npm run typecheck` → no errors; `npm run build` → succeeds.
- [ ] **Step 6:** Commit `chore: scaffold Vite + tldraw shell with Crit Wall tokens`.

### Task 2: Core types, planner interface and board reducer

**Files:**
- Create: `src/core/types.ts`, `src/core/planner.ts`, `src/core/board.ts`
- Test: `src/core/board.test.ts`

**Interfaces:**
- Produces (`types.ts`):
  - `ToolKind = 'figma'|'illustrator'|'repo'|'doc'|'image'`; `ArtifactStatus = 'linked'|'changed'|'missing'|'inaccessible'`; `Capability = 'open'|'preview'|'read'|'propose-edit'`
  - `Artifact { id; name; tool: ToolKind; ext: string; location: string; status: ArtifactStatus; capabilities: Capability[]; summary?: string }`
  - `RelationshipKind = 'inspired'|'constrains'|'developed-into'|'implemented-in'|'included-in'`; `Relationship { id; from; to; kind }`
  - `Decision { id; title; rationale; artifactIds: string[]; approvedBy: string; time: string; votes: number }`
  - `PermissionLevel = 'read'|'suggest'|'prepare'|'execute'`; `TokenChange { name; before; after; source }`; `FileDiff { path; patch }` (unified diff text)
  - `DotState = 'proposal'|'synced'|'changed'|'approved'`
  - `BoardShape { id: string; type: 'artifact'|'reference'|'direction'|'decision'|'pull-request'|'note'; x; y; w?; h?; parentId?: string; tags?: string[]; props: Record<string, unknown> }`
  - `CanvasOp` union: `{op:'createFrame'; id; name; rationale; x; y; w; h}` · `{op:'moveShapes'; moves:{id; x; y; parentId?: string}[]}` · `{op:'createNote'; id; text; x; y; parentId?: string; author: string}` · `{op:'createShape'; shape: BoardShape}` · `{op:'connect'; id; from; to; kind: RelationshipKind}` · `{op:'setStatus'; id; dot: DotState}` · `{op:'addVote'; directionId; voter: string}`
  - `ActionProposal { id; beat: BeatId; summary; ops: CanvasOp[]; tokenChanges?: TokenChange[]; fileDiffs?: FileDiff[]; permission: PermissionLevel; external: boolean }`
  - `StepState = 'pending'|'running'|'done'|'failed'`; `ExecutionStep { id; label; detail?; state: StepState }`; `ExecutionRun { proposalId; steps: ExecutionStep[] }`
  - `BeatId = 0|1|2|3|4|5|6`; `Board { shapes: BoardShape[]; relationships: Relationship[]; votes: Record<string, string[]>; dots: Record<string, DotState> }`
- Produces (`planner.ts`): `PlanContext { beat: BeatId; board: Board; selection: string[] }`; `PlanResult { thinking: string[]; message: string; proposal?: ActionProposal; chips: string[] }`; `interface Planner { plan(prompt: string, ctx: PlanContext): PlanResult }`
- Produces (`board.ts`): `applyOps(board: Board, ops: CanvasOp[]): Board` — pure, immutable; ops referencing missing ids are skipped.

- [ ] **Step 1: Write failing tests** in `board.test.ts`: "createFrame adds a direction shape"; "moveShapes updates x/y/parentId"; "moveShapes skips ids not on the board" (board unchanged, no throw); "connect adds a relationship only when both ends exist"; "addVote is idempotent per voter"; "setStatus records the dot"; "applyOps does not mutate its input" (deep-equal original after call).
- [ ] **Step 2:** `npx vitest run src/core` → FAIL.
- [ ] **Step 3:** Implement `types.ts`, `planner.ts`, `applyOps`.
- [ ] **Step 4:** `npx vitest run src/core` → PASS.
- [ ] **Step 5:** Commit `feat(core): domain types, planner interface, pure board reducer`.

### Task 3: Seed board and scripted planner

**Files:**
- Create: `src/demo/seed.ts`, `src/demo/scenario.ts`, `src/demo/scriptedPlanner.ts`, `src/demo/content.ts` (copy, token changes, `theme.ts` diff text)
- Test: `src/demo/seed.test.ts`, `src/demo/scriptedPlanner.test.ts`

**Interfaces:**
- Consumes: everything in `src/core`.
- Produces: `seedBoard(): Board` (beat-0 wall); `ARTIFACT_IDS = { brief, logo, webUi, theme }` with names `Halden_Brief.pdf`, `Logo_explorations_v3.ai`, `Halden — Web UI.fig`, `website/src/theme.ts`; ~8 references with `tags` including exactly one of `warm|editorial|playful`; 2 human notes (Maya, Jon). `DIRECTIONS = [{id:'dir-warm', name:'Warm & tactile'}, {id:'dir-editorial', name:'Editorial'}, {id:'dir-playful', name:'Playful modern'}]`.
- Produces: `BEATS: Record<BeatId, { name: string; chip: string; keywords: string[] }>` with chips: 0 "Organize into directions", 1 "What are we missing?", 2 "Ask the team to vote", 3 "Approve Warm & tactile", 4 "Apply this direction to the website", 5 (sheet Approve, no chip), 6 "Show connections".
- Beat semantics: store `beat` = last completed beat; `BEATS[beat].chip` starts the next one. Beat 2 (gaps) is optional: after beat 1 the chips are both "What are we missing?" and "Ask the team to vote"; choosing vote skips gaps.
- Produces: `class ScriptedPlanner implements Planner`; `boardAtBeat(beat: BeatId): Board` = seed + accepted proposals of all earlier beats via `applyOps`; `HELP_REPLY` copy listing what the demo can do; `NOT_IN_DEMO_REPLY` (the Global Constraints approval copy).

- [ ] **Step 1: Write failing tests** — `seed.test.ts`: "ids are unique"; "every reference has exactly one direction tag"; "four artifacts with tools pdf/illustrator/figma/repo"; "beat 0 has no ghosts, no votes, no directions". `scriptedPlanner.test.ts`: "chip text and keyword prompts at beat 0 return a proposal with 3 createFrame ops and moves for every reference"; "organize skips references missing from the board"; "organize places an unknown reference dropped by the driver into a direction"; "unrelated prompt returns HELP_REPLY and the current beat's chip, no proposal"; "approving Editorial returns NOT_IN_DEMO_REPLY, no proposal"; "beat 4 proposal is external, permission 'prepare', has tokenChanges and one fileDiff for website/src/theme.ts"; "boardAtBeat(4) contains the decision shape and dir-warm marked approved".
- [ ] **Step 2:** `npx vitest run src/demo` → FAIL.
- [ ] **Step 3:** Implement seed (positions scattered across ~1600×1000 page units), content and planner. Keyword matching: lowercase, strip punctuation, any keyword hit for the current beat = match; an "approve" prompt naming another direction = not-in-demo reply.
- [ ] **Step 4:** `npx vitest run src/demo` → PASS.
- [ ] **Step 5:** Commit `feat(demo): seed wall and scripted planner`.

### Task 4: Custom shapes and the dot sticker

**Files:**
- Create: `src/canvas/shapes/types.ts` (module augmentation of `TLGlobalShapePropsMap`), `ArtifactShapeUtil.tsx`, `ReferenceShapeUtil.tsx`, `DirectionShapeUtil.tsx` (extends `BaseFrameLikeShapeUtil`), `DecisionShapeUtil.tsx`, `PullRequestShapeUtil.tsx`, `src/canvas/shapes/index.ts` (`customShapeUtils` array), `src/ui/Dot.tsx`, `src/styles/shapes.css`
- Test: `src/canvas/shapes/shapes.test.ts`, `src/ui/Dot.test.tsx`

**Interfaces:**
- Produces: shape types `cc-artifact`, `cc-reference`, `cc-direction`, `cc-decision`, `cc-pr`. Every shape reads `meta.ghost: boolean` and `meta.dot?: DotState` to render ghost style and its dot. `cc-reference` props include `kind: 'photo'|'swatch'|'specimen'|'texture'` (authored specimens/swatches/textures where no licensed photo exists; photos from `public/refs/` with credit in props). `cc-direction` renders name, rationale, vote dots and an **Approve direction** button that calls `window.dispatchEvent(new CustomEvent('cc:approve', {detail:{directionId}}))`. `cc-artifact` shows source strip (tool name + ext tag), title, mono path, status dot; double-click dispatches `cc:open-artifact`.
- Produces: `<Dot state={DotState} size?: 's'|'m' animate?: boolean label: string/>` — renders `role="img"` with `aria-label`, press-and-settle keyframe unless reduced motion.

- [ ] **Step 1: Write failing tests** — "each util's getDefaultProps passes its static props validators" (call `T.object(util.props).validate(defaults)`); "Dot renders aria-label and data-state"; "Dot has no animation class when animate is false".
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement utils and Dot. **Step 4:** Run → PASS; `npm run typecheck` clean.
- [ ] **Step 5:** Commit `feat(canvas): Crit Wall custom shapes and dot sticker`.

### Task 5: Canvas port, tldraw adapter and demo orchestrator

**Files:**
- Create: `src/canvas/port.ts`, `src/canvas/tldrawPort.ts`, `src/canvas/toPartials.ts`, `src/state/demoStore.ts`, `src/state/delay.ts`
- Test: `src/canvas/toPartials.test.ts`, `src/state/demoStore.test.ts`, `src/test/fakePort.ts`

**Interfaces:**
- Produces (`port.ts`): `interface CanvasPort { load(board: Board): void; preview(ops: CanvasOp[], proposalId: string): void; commit(): void; discard(): void; read(): Board; exists(id: string): boolean; onChange(cb: () => void): () => void; focus(ids: string[]): void; highlight(ids: string[] | null): void }`
- Produces (`toPartials.ts`): `boardShapeToPartial(s: BoardShape, ghost: boolean)` → tldraw shape partial with id `createShapeId(s.id)`, `meta.ghost`; `opsToEditorActions(ops, board)` → `{ create: partials[]; update: partials[]; arrows: {...}[] }`.
- `tldrawPort.ts`: `createTldrawPort(editor: Editor): CanvasPort` — preview uses `editor.markHistoryStoppingPoint('proposal:'+id)`, creates ghosts / animates moves; `discard` uses `editor.bailToMark`; `commit` clears `meta.ghost`; relationships render as labeled tldraw arrows bound to both shapes.
- Produces (`demoStore.ts`): `createDemoStore(deps: { planner: Planner; port: CanvasPort; delay: (ms: number, signal: AbortSignal) => Promise<void> })` returning a zustand store with state `{ beat; busy; messages: {id; role:'ai'|'user'|'system'; text; thinking?: string[]}[]; chips: string[]; pending?: ActionProposal; sheetOpen: boolean; run?: ExecutionRun; toasts: {id; text}[] }` and actions `send(prompt)`, `accept()`, `discardPending()`, `approveDirection(id)`, `askVote()`, `approveExternal()`, `restart()`, `jumpTo(beat)`, `openArtifact(id)`, `showConnections()`. `delay.ts` exports the real abortable delay.

- [ ] **Step 1: Write failing tests** (fake port records calls; fake delay resolves immediately unless aborted) — "send at beat 0 previews ops and sets pending"; "accept commits, clears pending, advances beat"; "second send while busy is ignored"; "double accept commits once"; "undo after accept (fake port: created id stops existing + onChange fires) rewinds beat and re-offers the proposal"; "approveDirection('dir-editorial') adds NOT_IN_DEMO reply, no state change"; "askVote adds votes for Maya and Jon on dir-warm only"; "approveDirection('dir-warm') marks it approved, creates the decision shape and previews 3 connect ops (developed-into → logo, developed-into → webUi, implemented-in webUi → theme)"; "showConnections highlights the lineage ids from warm references to the PR"; "approveExternal runs 3 steps to done, creates cc-pr shape, adds toast 'Nothing was merged or deployed.'"; "restart during thinking aborts: no further messages after restart"; "jumpTo(4) loads boardAtBeat(4) and sets beat 4"; `toPartials.test.ts`: "partial ids are prefixed shape:", "ghost flag lands in meta".
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat(state): demo orchestrator over CanvasPort with tldraw adapter`.

### Task 6: Shell UI — top bar, sources rail, AI panel

**Files:**
- Create: `src/ui/TopBar.tsx`, `src/ui/SourcesRail.tsx`, `src/ui/AiPanel.tsx`, `src/ui/Composer.tsx`, `src/ui/Toasts.tsx`, `src/ui/DemoMenu.tsx`
- Modify: `src/App.tsx` (create store on tldraw mount, wire `cc:*` events)
- Test: `src/ui/AiPanel.test.tsx`, `src/ui/TopBar.test.tsx`

**Interfaces:**
- Consumes: `createDemoStore` state/actions; `Dot`.
- Top bar: "Halden Coffee · Brand & Website", "Sample data" tag, three presence avatars (You, Maya, Jon), "Review changes (n)" where n = pending proposal ? 1 : 0, DemoMenu (Restart demo, Jump to beat… listing `BEATS` names). During `askVote`, Maya's and Jon's presence cursors (an overlay above the canvas, positioned from page coordinates) glide to the Warm & tactile frame before each dot lands. Sources rail: groups Figma / Illustrator / Repository / Docs / References with counts; click → `port.focus([id])`. AI panel: message list (thinking steps appear one by one, then the message streams), proposal card (summary, Preview / Accept / Discard; external proposals show "Review change" which opens the sheet), chips, Composer (Send disabled when trimmed input is empty; Enter sends, Shift+Enter newline).

- [ ] **Step 1: Write failing tests** — "Send is disabled for empty and whitespace input"; "clicking a chip calls send with the chip text"; "pending proposal shows Accept and Discard"; "Review changes shows 1 when a proposal is pending, 0 otherwise"; "DemoMenu Restart calls restart".
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat(ui): top bar, sources rail and AI panel`.

### Task 7: Proposal sheet, execution run and artifact popover

**Files:**
- Create: `src/ui/ProposalSheet.tsx`, `src/ui/DiffView.tsx`, `src/ui/TokenDiff.tsx`, `src/ui/ExecutionSteps.tsx`, `src/ui/ArtifactPopover.tsx`
- Test: `src/ui/ProposalSheet.test.tsx`, `src/ui/DiffView.test.tsx`

**Interfaces:**
- Consumes: `pending.tokenChanges`, `pending.fileDiffs`, `run`, `approveExternal`, `openArtifact`.
- Sheet: title, "Reads: Approved decision · Halden — Web UI.fig (read only) · website/src/theme.ts", token swatches before → after, diff of `theme.ts`, affected files list, permission line "Prepare — executing needs your approval", buttons Approve / Cancel; during run it shows `ExecutionSteps` with "Simulated in demo" label. `DiffView` renders unified diff lines with `+`/`-`/context classes and line numbers. Popover: Open original (toast "Opens in Illustrator in the desktop app — simulated" for `.ai`; tool name varies by `tool`), Reveal in folder (toast, simulated), Show connections.

- [ ] **Step 1: Write failing tests** — "DiffView marks added, removed and context lines"; "sheet lists theme.ts as the only affected file and shows the permission line"; "Approve is disabled while a run is in progress"; "steps render in order with their states".
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat(ui): proposal sheet, execution steps, artifact popover`.

### Task 8: End-to-end journey, visual verification and docs

**Files:**
- Create: `e2e/journey.spec.ts`, `README.md`
- Modify: styles as needed from the visual pass

**Interfaces:**
- Consumes: the whole app. Playwright config uses `launchOptions.executablePath: '/usr/bin/google-chrome'` and `webServer: npm run dev`.

- [ ] **Step 1: Write the e2e test** `journey.spec.ts` › "full journey by chips": load → "Review changes (0)" → click each chip/Accept/Approve through to PR → expect a `cc-pr` card containing "#42" and toast "Nothing was merged or deployed."; collect `page.on('console')` errors and assert none. › "restart returns to a clean wall": after journey, Restart → "Review changes (0)" and no PR card.
- [ ] **Step 2:** `npm run e2e` → fix until PASS.
- [ ] **Step 3:** Capture `.impeccable/review/desktop.png` (1440×900) and `mobile.png` (390×844) at beat 0, plus desktop captures of the beat-1 ghost preview and the proposal sheet; review against the direction contract; batch fixes; re-capture once.
- [ ] **Step 4:** Write README: what it is, `npm install && npm run dev`, running tests, recording tips (Restart / Jump to beat), tldraw license note (dev needs no key; deployed link needs a free hobby key in `VITE_TLDRAW_LICENSE_KEY`; commercial product needs a commercial license), sample-data note and image credits.
- [ ] **Step 5:** `npm test && npm run typecheck && npm run build && npm run e2e` → all pass. Commit `test: e2e journey; docs: README`.
- [ ] **Step 6:** Finish per the direction contract's FINISH line: run the design detector, the finish review, write DESIGN.md, record image provenance; push to the GitHub repo.
