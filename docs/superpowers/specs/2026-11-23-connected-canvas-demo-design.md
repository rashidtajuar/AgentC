# Connected Canvas — clickable demo: design

Date: 2026-11-23 · Owner: Rashid · Status: draft for approval

## 1. Intent and why

Connected Canvas is an AI-native infinite canvas for small design-and-development studios. Every card is a **Living Artifact**: a link to a real working file (Figma, Illustrator, a repo file, a brief) that knows what it relates to and what AI may do with it. AI organizes and proposes changes; people approve; approved decisions turn into real work in connected tools.

This demo exists to **show studios one journey end to end** so they understand the value in under a minute and agree to paid pilots. It is recorded as a ~30-second video and driven live on calls. It is also the **first real code of the product**: canvas setup, custom shapes, the data model and the AI-operation format must be reusable, not throwaway.

The journey it must prove:

> moodboard → AI sorts references into directions → team votes → approve a direction → AI reads the linked Figma design and proposes a code change → approve → a GitHub pull request appears, linked back to the decision on the wall.

Figma is **read-only** in the demo (context only), matching the first real MVP, where the only external write is the GitHub pull request.

## 2. Goals, non-goals, anti-goals

**Goals**
- A fast, beautiful browser app that runs the journey reliably, every time, from a clean start.
- Feels like a real product at today's best-in-class AI interface quality, not a slideshow.
- Reusable foundation: tldraw custom shapes, typed data model, AI operation format.
- One-click "Restart demo" for repeated recordings.

**Non-goals (demo)**
- Real AI model calls, real Figma/GitHub/Adobe integrations, real file access.
- Accounts, persistence across reloads, billing, real multiplayer.
- Mobile layout beyond "doesn't break" (desktop 1280–1920 is the target).
- Desktop (Tauri) app.

**Anti-goals (would be failure even if it works)**
- Looks like a generic AI dashboard (purple gradients, glowing sparkles, glass panels).
- AI that silently changes the board: every AI change must be previewed and accepted.
- Claims that read as real: fake customers, real-looking metrics, or brand logos implying partnerships. All sample content is labeled sample data.
- A demo that can break mid-recording (dead ends, typed input that does nothing).

## 3. Constraints

- **Stack (decided):** React 19 + TypeScript + Vite; **tldraw SDK 5.x** for the canvas; open-source fonts and icons only.
- **tldraw license:** free in development; any deployed link needs a license key. A free **hobby key** (keeps the "made with tldraw" watermark) covers this prototype; the paid product needs a commercial license. The watermark must not be hidden.
- **Code home (decided):** a GitHub repository.
- **No brand logos** of Figma, Adobe, GitHub etc. Tools are shown as typographic file-type tags (`.fig`, `.ai`, `.tsx`, `.pdf`) and plain-text tool names.
- External actions are simulated and clearly worded as such in the UI where a viewer could mistake them for real ("Simulated in demo").

## 4. Approaches considered

**Canvas engine** — Rashid chose **tldraw** over React Flow + custom pen (MIT, rich React nodes, weaker freeform drawing) and Excalidraw (MIT, hand-drawn look, hard to fit rich cards). Why: the most Figma-like canvas feel and built-in drawing, shapes, arrows, undo and selection. Trade-off accepted: commercial license cost later.

**Demo AI** — Rashid chose **scripted AI that looks real** over a live model (needs key, unpredictable on camera) and a hybrid switch (more work). The script emits the same structured operations a real model will emit later, so swapping in a live model replaces only the "planner".

**Visual direction** — Rashid chose **"Crit Wall"** over "Route Map" (subway-line connections) and the category-standard FigJam/Linear look. (The design catalog was unreachable this session, so only these grounded options were compared.)

## 5. Visual direction: Crit Wall

The studio pin-up wall where teams review work and choose a direction, rendered as a crisp, modern, light-mode product.

- **Shell:** graphite (felt) top bar and side rails; text and icons in light neutrals on graphite.
- **Canvas:** pale, cool-grey pinboard ground. No dot grid by default.
- **Artifacts:** white "prints" with a soft paper shadow, a thin top source strip (tool name + file-type tag) and a status dot.
- **Human notes:** tldraw sticky notes / text in tldraw's hand-drawn font = marker on sticky stock.
- **Dot stickers = the only saturated colour, always meaning state:**
  - cobalt — AI proposal waiting for you
  - green — linked and in sync
  - amber — source changed or missing
  - vermilion — approved / chosen
  - Team votes are dots stuck onto a direction.
- **Signature interaction:** sticking a dot (press-and-settle motion). AI proposals render as **ghost prints** (reduced opacity, cobalt dashed outline, cobalt dot) until accepted.
- **Type:** Geist (UI) + Geist Mono (file paths, tags, code), both OFL. Hand font only for human notes.
- **Scene:** daytime studio and screen-shared calls → light canvas, graphite shell.
- **Layout follows standard app conventions;** the world lends only type, palette, density and the dot move.

```
┌ Halden Coffee · Brand & Website  [SAMPLE DATA] ── ●●● 3 online · Review changes (0) ┐
│ SOURCES       │                                              │ AI               │
│ Figma      3  │   ▢ ▢ ▢  ▢     ▢   (scattered references)    │ Hi — want me to  │
│ Illustrator 2 │      ▢ logo_v3.ai     ▢ Halden_Brief.pdf     │ sort these into  │
│ Repository 4  │   [marker note]   ▢ Web UI .fig   ▢ theme.ts │ directions?      │
│ Docs       2  │                                              │ [Organize ▸]     │
│               │                  ── drawing tools ──         │ [ Ask… ]         │
└───────────────┴──────────────────────────────────────────────┴──────────────────┘
```

## 6. The demo script (beats)

Sample project (synthetic): studio **"Northbound Studio"** designing the brand + website for **"Halden Coffee"**. Teammates: Maya (designer), Jon (developer), You (creative lead).

The AI panel always offers the next step as a **suggestion chip**. Typed prompts are matched to the current beat by keywords; anything unmatched gets a short, honest reply listing what the demo can do plus the chip. No dead ends.

| # | Beat | What happens |
|---|---|---|
| 0 | Wall at rest | ~8 references (photos/specimens/swatches), 4 Living Artifacts (`Halden_Brief.pdf`, `Logo_explorations_v3.ai`, `Halden — Web UI.fig`, `website/src/theme.ts`), 2 marker notes. AI greets. |
| 1 | Organize | "Group these into three directions…" → visible thinking steps ("Reading 8 references…") → ghost proposal: 3 labeled frames (Warm & tactile / Editorial / Playful modern), cards moved in, one rationale note each. Preview / Accept / Discard. Accept animates cards into place; one undo restores. |
| 2 | Gaps (short) | "What are we missing?" → 2 cobalt gap notes added as ghosts (e.g. "No packaging reference for Warm & tactile"). Accept or skip. |
| 3 | Vote & decide | Simulated teammates stick dots (Maya, Jon) with small presence cursors, always on Warm & tactile; You click **Approve direction** on Warm & tactile → vermilion dot, a **Decision** print ("Approved by You · 2:14 PM · 2 votes") and AI-suggested links ("developed into" → logo, Figma file; "implemented in" Figma → theme.ts) as ghost arrows to accept. **Only Warm & tactile can be approved:** Approve on the other two frames opens the AI panel with a friendly reply ("In this demo the team has voted for Warm & tactile — in the real product any direction can be approved.") and no state change. |
| 4 | Propose change | "Apply the approved direction to the website. Don't change anything until I approve." → thinking steps (reading the decision, reading Figma colour and type variables — read only, reading `theme.ts`) → **Proposal sheet**: the direction's design tokens from Figma vs. the current code values (swatches before → after), a code diff of `theme.ts`, affected files, permission level ("Prepare — executing needs your approval"). |
| 5 | Execute | Approve → GitHub-only step list: create branch `direction/warm-tactile`, commit 1 file, open pull request #42 — each ticks green, labeled "Simulated in demo". Figma is not changed. A **PR print** pins to the wall linked from the Decision ("implemented in"), green dot. Toast: "Nothing was merged or deployed." |
| 6 | Open original | Double-click `Logo_explorations_v3.ai` → popover: Open original (toast: "Opens in Illustrator in the desktop app — simulated"), Reveal in folder, Show connections (highlights the lineage path from references → decision → logo → PR). |

Top-bar overflow menu: **Restart demo** (resets to beat 0), **Jump to beat…** (for recording retakes).

**Pace:** one natural pace tuned for live calls (thinking steps ~0.4–0.8 s each). The ~30-second video is edited down afterwards; no autoplay or recording mode is built.

**Opening frame (builder's call, recorded):** beat 0 is a clean wall — no ghosts, "Review changes" shows 0, the AI panel greets with the Organize chip. The cobalt ghost-print signature first appears seconds later in beat 1.

**When the board changes mid-demo (builder's call, recorded):** the script is anchored to the seeded shapes but reads the real board and tolerates edits:
- Beats look up their shapes by stable seeded ids; a deleted shape is skipped, never an error.
- Organize also picks up any image or reference the driver dropped in, placing it in the direction it best fits (by a simple tag/round-robin rule) so the proposal reflects the actual board.
- Freeform drawing, notes and moves are always allowed and never block a beat.
- Undoing an accepted proposal (Ctrl/Cmd+Z or the proposal's Undo) returns the demo to that beat: the AI panel re-offers the same proposal.
- **Jump to beat…** loads a saved board snapshot for that beat, so retakes always start from a known state.

## 7. Components (reusable)

- **App shell:** top bar, Sources rail (grouped by tool, click → zoom to item), AI panel, Review-changes count (pending AI proposals).
- **tldraw custom shapes:** `artifact` (Living Artifact print: title, tool, path, preview, status dot, capability list), `reference` (image/specimen print), `direction` (frame with name, rationale, vote dots, approve action), `decision`, `pull-request`. Semantic connections use tldraw arrows with labels.
- **AI panel:** message list with streamed text, thinking-step list, suggestion chips, proposal cards (Preview / Accept / Discard).
- **Proposal sheet:** token diff + code diff + affected files + permission level + Approve / Cancel.
- **Execution run:** step list with states (pending, running, done, failed).
- **Dot sticker:** one component, four states, press-and-settle animation.

## 8. Data model and AI operation format (the reusable core)

TypeScript types, independent of the UI, matching the product plan:

- `Artifact` — id, name, tool (`figma | illustrator | repo | doc | image`), location (url/path/provider ref), status (`linked | changed | missing | inaccessible`), capabilities (`open | preview | read | propose-edit`).
- `Relationship` — from, to, kind (`inspired | constrains | developed-into | implemented-in | included-in`).
- `Decision` — id, title, rationale, artifacts, approvedBy, time, votes.
- `ActionProposal` — id, summary, operations, external changes (token diffs, file diffs), permission level (`read | suggest | prepare | execute`), status.
- `ExecutionRun` — proposal id, steps, results.
- **Canvas operations** emitted by the planner: `createShape`, `moveShapes`, `createFrame`, `createNote`, `connect`, `setStatus`, `addVote`. Applied as a preview (ghost) first, committed on accept, undoable as one step.
- **Planner interface:** `plan(prompt, context) → { thinking[], message, proposal? }`. The demo ships a `ScriptedPlanner`; a live model later implements the same interface.

## 9. Content and imagery

- Reference images: free-licensed photos (e.g. Unsplash) if they can be sourced; otherwise authored specimen cards (type specimens, colour swatches, textures), which are legitimate moodboard items. Rashid can drop his own images into `public/refs/`.
- Every image keeps a recorded source/credit.
- All names, files and teammates are fictional and the top bar carries a "Sample data" tag.

## 10. Quality bar

- Smooth pan/zoom with ~40 objects on a normal laptop.
- Every beat reachable by chip and by typing; Restart works from any beat.
- Keyboard focus visible on all shell controls; text contrast WCAG AA in the shell and panels.
- Reduced-motion setting removes dot and card animations.
- No console errors during a full run.

## 11. Delivery

- GitHub repo with README (run locally, record the demo, tldraw license note).
- Local: `npm install && npm run dev` (no license key needed).
- Shareable link: static build on a free host, using Rashid's free tldraw hobby key for that domain.

## 12. Left to the builder

File/folder structure, state management, exact colour values and spacing scale, animation timing, the precise sample copy and image choices, diff rendering approach, and how keyword matching works — within this document.
