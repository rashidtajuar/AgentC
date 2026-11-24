# AgentC — Connected Canvas

An AI-native infinite canvas for small design-and-development studios. Ideas, references, real working files and decisions live on one wall, stay linked to their originals, and AI turns approved decisions into real work — with people approving every change.

The default entry is a **usable local workspace**. Create a project with a brief, pin real source URLs, arrange cards on an infinite canvas, and draw notes, shapes and arrows. Project documents and camera positions persist in this browser. Multiple projects are isolated. Source links open their originals; they are not read or synced. No account or cloud backend is connected yet.

**Propose organization** uses an explicitly labeled local rule-based planner. Review the ghost layout, then accept it as one undo step or discard it. Editing pauses during review. Pending proposals are never saved; reload returns to committed work. There are no external writes or live model calls in the workspace.

The original **clickable sample demo** is preserved at `/?demo=1` (also reachable through **Explore the sample**). It walks through one journey end to end:

> wall of references → AI sorts them into directions → team votes with dot stickers → approve a direction → AI reads the Figma design and proposes a code change → approve → a GitHub pull request appears, linked back to the decision.

Everything in that sample journey is **sample data** (Northbound Studio × Halden Coffee are fictional). Its AI is scripted, and GitHub/Illustrator actions are simulated. These actions are never used on your real project sources.

## Run it

```bash
npm ci
npm run dev        # http://localhost:5173
```

No license key is needed in development.

## Local workspace data

`src/workspace/model.ts` owns validation, the versioned project index (`agentc:projects:v1`), separate native tldraw snapshots (`agentc:document:<project-id>`) and the canvas-only planner. Full snapshots retain drawing, assets, bindings and camera state. Snapshot revisions detect stale writes and storage events pause a tab when another tab changes its canvas. Corrupt or unrecognized data is preserved and blocks editing. Save failures are visible and stop further edits.

Storage is local to a browser origin: different Vercel preview URLs have separate projects. Clearing browser data removes these projects. Large dropped media may exceed browser storage limits. There is no cross-device sync, account security, multiplayer, source authentication, automatic source updates, or backend yet. Avoid using this first slice as the only copy of important work.

## Driving the demo

- **Suggestion chips** in the AI panel always offer the next step. Typing works too: "group these", "what's missing?", "ask the team to vote", "approve warm", "apply this to the website", "show connections".
- AI changes appear as **ghosts** (dashed blue outline, blue dot). **Accept** keeps them; **Discard** throws them away. **⌘Z / Ctrl+Z** after accepting puts the suggestion back on offer.
- **Double-click a file card** for Open original / Reveal in folder / Show connections.
- **Demo menu → Restart demo** resets to a clean wall. **Jump to step** loads a saved board for retakes.
- **Escape** clears the "Show connections" highlight.

Dot stickers always mean state: blue = AI suggestion waiting, green = linked and in sync, amber = source changed or missing, red = approved.

## Tests

```bash
npm test           # unit + component tests (Vitest)
npm run typecheck
npm run lint
npx playwright install chromium
npm run e2e        # original sample journey + real workspace persistence/safety checks
```

To use an existing Chrome, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable. On macOS: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`. Keyboard test timing varies with browser focus; the sample regression uses the visible native Undo control.

## Architecture — the parts to reuse

```
src/core/          domain model: Artifact, Relationship, Decision, ActionProposal, CanvasOp, Planner interface, pure board reducer
src/demo/          sample content, the beat-0 wall, the ScriptedPlanner (swap for a live model later)
src/canvas/        CanvasPort interface, tldraw adapter (preview → commit/discard as one undo step), custom shapes
src/state/         demo engine (zustand) — talks to the canvas only through CanvasPort
src/ui/            app shell: top bar, sources rail, AI panel, review sheet, pop-ups
src/workspace/     real local project entry, full snapshot persistence, validated source cards, proposal scaffold
```

- **Planner interface** (`src/core/planner.ts`): `plan(prompt, context) → { thinking, message, proposal?, commitOps?, intent, chips }`. A live model implements the same interface; nothing else changes.
- **Canvas operations** (`CanvasOp`): `createFrame`, `moveShapes`, `createNote`, `createShape`, `connect`, `setStatus`, `addVote`. Always previewed as ghosts, applied on accept.
- **CanvasPort** keeps the engine independent of tldraw, so it's unit-tested with an in-memory fake (`src/test/fakePort.ts`).

## Preview deployment

Reuse the Vercel Git-linked `agentc` project for `rashidtajuar/AgentC`. `main` is the production branch; feature branches deploy as previews. Set `VITE_TLDRAW_LICENSE_KEY` for Preview before building a deployed canvas. This is a browser-side license and is bundled into the app; never substitute an API credential. Keep it out of Git. Without a valid deployment license tldraw hides its editor after five seconds on HTTPS sites. Leave the watermark intact. Evaluation keys expire and must be replaced before their expiry date.

## Licenses and credits

- **tldraw SDK** — free in development. Any deployed link needs a license key in `VITE_TLDRAW_LICENSE_KEY` (see `.env.example`): a free [hobby key](https://tldraw.dev/get-a-license/hobby) covers this prototype and keeps the "made with tldraw" watermark; the commercial product will need a paid commercial license. Never hide the watermark.
- `@tldraw/assets` 5.6.2 ships without its translations folder; `vite.config.ts` stubs those imports (English is built into tldraw).
- Fonts (all SIL OFL): Geist, Geist Mono, Gloock, Bricolage Grotesque, Young Serif, plus tldraw's bundled fonts.
- Icons: [Lucide](https://lucide.dev) (ISC).
- Reference photos from [Unsplash](https://unsplash.com) (Unsplash License), hotlinked with credit on each card: Adam Rasheed, Brunno Tozzo, Isabella Fischer, Brands&People. They need an internet connection; offline they show a placeholder.

### Replace before showing real clients

All copy, people, files, the repository name, PR #42 and the token values are invented. Swap them in `src/demo/content.ts` and `src/demo/seed.ts`.
