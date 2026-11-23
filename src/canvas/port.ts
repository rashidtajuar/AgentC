import type { Board, CanvasOp } from '../core/types'

/** Everything the demo engine needs from a canvas. The tldraw adapter implements it; tests use a fake. */
export interface CanvasPort {
	/** Replace everything with this board (no undo history). */
	load(board: Board): void
	/** Show ops as ghosts on top of the board, reversible with discard(). */
	preview(ops: CanvasOp[], proposalId: string): void
	/** Keep the previewed ops as one undoable step. */
	commit(): void
	/** Throw the preview away. */
	discard(): void
	/** Apply ops immediately (a person's own action, e.g. a vote or approval). */
	apply(ops: CanvasOp[]): void
	read(): Board
	exists(id: string): boolean
	onChange(cb: () => void): () => void
	focus(ids: string[]): void
	highlight(ids: string[] | null): void
	/** Screen rectangle of a board shape relative to the canvas element, for overlays. */
	screenRect(id: string): { x: number; y: number; w: number; h: number } | null
}
