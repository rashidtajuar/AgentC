# AgentC: first usable workspace

The existing React/Vite/tldraw app is a polished, scripted sample. Preserve it at `?demo=1` and retain its tests, cards, design tokens, canvas adapter and proposal semantics. The default entry becomes a local project list. This follows the user's instruction to implement autonomously and ask only blocking questions.

## Scope and approach

Extend the existing stack, rather than rewrite it or add an unauthenticated cloud backend. Local browser persistence makes a complete single-user workflow possible without inventing connected accounts. Cloud collaboration and real model/MCP execution require separate authenticated server boundaries and remain deferred.

Journey: create a named project with a brief → open a blank infinite canvas → add source cards with validated web links → draw notes, shapes and arrows → preview an organization proposal → accept or discard → reopen the saved project. Multiple projects remain isolated. Source cards open their original links; they never claim the source was read or synced.

Use tldraw snapshots, not the lossy domain board projection, to preserve native notes, drawing, arrows, assets and camera state. Store a versioned project index and separate snapshots locally. Show storage failures and prevent overwriting an unrecognized/corrupt store. Detect conflicting snapshot revisions and require reload. No cloud or team claims.

The proposal scaffold is explicitly a deterministic local layout planner, not live AI. It arranges current source cards only, requires a review, locks document editing during preview, and never performs external writes. Save committed content before preview; do not persist ghosts. Accept is one undo step; discard restores the original. Reload abandons unaccepted proposals.

Reuse the Crit Wall design. The workspace omits sample people, fake tool permissions, approval stickers and simulated PR execution. Source links are HTTP(S) only, without embedded credentials; render user text through React. No remote fetching or arbitrary tool execution.

## Acceptance

- Create, reopen and switch between isolated projects; blank/long names rejected.
- Add a real source link; invalid or executable URL schemes rejected; open original safely.
- Pan, zoom, drag, draw, connect; retain the full document after reload.
- Preview only existing source cards; accept/discard safely; reload never commits pending changes.
- Clearly identify local storage, unverified sources and non-live AI.
- Existing sample journey still passes, plus new workspace unit and browser journeys.
- Reviewable feature branch/PR and preview deployment; production remains unchanged.
