# AgentC Workspace Implementation Plan

**Goal:** A persistent single-user connected canvas alongside the preserved sample demo.

**Architecture:** Reuse tldraw shapes, CanvasPort and Crit Wall styling. Keep project metadata and versioned native snapshots separate from demo state. A local planner returns canvas-only proposals.

**Tech Stack:** Existing React, TypeScript, Vite, tldraw, Vitest and Playwright; no new runtime dependency.

**Spec:** `docs/superpowers/specs/2026-11-23-workspace-design.md`

## Global constraints

Preserve existing demo, never execute external actions, never claim live AI or source sync, never persist ghosts, surface storage failures, leave production unchanged.

## Review focus

Corrupt storage, concurrent edits, unsafe URLs, native canvas persistence, pending previews during navigation/reload.

## Tasks

- [ ] Add model/storage/planner tests, observe missing-feature failures, implement validation, revision checks and deterministic proposals.
- [ ] Add project entry and workspace UI using existing cards and native snapshots; preserve demo via query route; add browser tests for source links, isolation, persistence and proposal safety.
- [ ] Run unit, lint, typecheck, production build and complete browser suite. Review the branch, resolve findings and document limits.
- [ ] Push feature branch, create PR, reuse/verify Git-linked Vercel project, deploy exact branch preview and smoke-test its primary flow.
