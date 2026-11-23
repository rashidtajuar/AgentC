# Connected Canvas — clickable demo

An AI-native infinite canvas for small design-and-development studios. Ideas, references, real working files and decisions live on one wall, stay linked to their originals, and AI turns approved decisions into real work — with people approving every change.

This repo is the **clickable demo**. It walks through one journey end to end:

> wall of references → AI sorts them into directions → team votes with dot stickers → approve a direction → AI reads the Figma design and proposes a code change → approve → a GitHub pull request appears, linked back to the decision.

Everything on screen is **sample data** (Northbound Studio × Halden Coffee are fictional). The AI is scripted for reliability on camera, and the GitHub/Illustrator actions are simulated — the UI says so wherever it matters.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

No license key is needed in development.

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
npm run e2e        # full journey in Chrome (Playwright; uses /usr/bin/google-chrome, edit playwright.config.ts if yours lives elsewhere)
```

## Architecture — the parts to reuse

```
src/core/          domain model: Artifact, Relationship, Decision, ActionProposal, CanvasOp, Planner interface, pure board reducer
src/demo/          sample content, the beat-0 wall, the ScriptedPlanner (swap for a live model later)
src/canvas/        CanvasPort interface, tldraw adapter (preview → commit/discard as one undo step), custom shapes
src/state/         demo engine (zustand) — talks to the canvas only through CanvasPort
src/ui/            app shell: top bar, sources rail, AI panel, review sheet, pop-ups
```

- **Planner interface** (`src/core/planner.ts`): `plan(prompt, context) → { thinking, message, proposal?, commitOps?, intent, chips }`. A live model implements the same interface; nothing else changes.
- **Canvas operations** (`CanvasOp`): `createFrame`, `moveShapes`, `createNote`, `createShape`, `connect`, `setStatus`, `addVote`. Always previewed as ghosts, applied on accept.
- **CanvasPort** keeps the engine independent of tldraw, so it's unit-tested with an in-memory fake (`src/test/fakePort.ts`).

## Licenses and credits

- **tldraw SDK** — free in development. Any deployed link needs a license key in `VITE_TLDRAW_LICENSE_KEY` (see `.env.example`): a free [hobby key](https://tldraw.dev/get-a-license/hobby) covers this prototype and keeps the "made with tldraw" watermark; the commercial product will need a paid commercial license. Never hide the watermark.
- `@tldraw/assets` 5.6.2 ships without its translations folder; `vite.config.ts` stubs those imports (English is built into tldraw).
- Fonts (all SIL OFL): Geist, Geist Mono, Gloock, Bricolage Grotesque, Young Serif, plus tldraw's bundled fonts.
- Icons: [Lucide](https://lucide.dev) (ISC).
- Reference photos from [Unsplash](https://unsplash.com) (Unsplash License), hotlinked with credit on each card: Adam Rasheed, Brunno Tozzo, Isabella Fischer, Brands&People. They need an internet connection; offline they show a placeholder.

### Replace before showing real clients

All copy, people, files, the repository name, PR #42 and the token values are invented. Swap them in `src/demo/content.ts` and `src/demo/seed.ts`.
