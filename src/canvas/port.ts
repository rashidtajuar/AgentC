import type { Board, CanvasOp } from '../core/types'

/** Opaque handle to one undoable step in the canvas history. */
export type StepId = string

/** Everything the demo engine needs from a canvas. The tldraw adapter implements it; tests use a fake. */
export interface CanvasPort {
	/** Replace everything with this board (no undo history). */
	load(board: Board): void
	/** Show ops as ghosts on top of the board, reversible with discard(). Discards any earlier preview. */
	preview(ops: CanvasOp[], proposalId: string): void
	/** Keep the previewed ops; returns the undo step they form. */
	commit(): StepId | null
	/** Throw the preview away. */
	discard(): void
	/** Apply ops immediately as their own undo step (a person's action, e.g. a vote or approval). */
	apply(ops: CanvasOp[]): StepId
	/** Is this step still applied (not undone)? */
	isStepActive(step: StepId): boolean
	/** True once if the open preview was undone by the person; the port then forgets it. */
	previewWasUndone(): boolean
	/** Once, after a redo brings back the preview previewWasUndone() reported: its proposal id. The port adopts it again. */
	previewWasRedone(): string | null
	/** True while nothing on the board has changed since this step (selection and camera don't count). */
	isLatestStep(step: StepId): boolean
	/** Undo the latest step, as the person's Cmd+Z would. */
	undo(): void
	read(): Board
	exists(id: string): boolean
	onChange(cb: () => void): () => void
	focus(ids: string[]): void
	highlight(ids: string[] | null): void
	/** Screen rectangle of a board shape relative to the canvas element, for overlays. */
	screenRect(id: string): { x: number; y: number; w: number; h: number } | null
}
