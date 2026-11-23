import { applyOps, emptyBoard } from '../core/board'
import type { Board, CanvasOp } from '../core/types'
import type { CanvasPort } from '../canvas/port'

/** In-memory CanvasPort that records calls; good enough to drive the demo engine in tests. */
export class FakePort implements CanvasPort {
	board: Board = emptyBoard()
	previewing: { ops: CanvasOp[]; base: Board; id: string } | null = null
	calls: string[] = []
	highlighted: string[] | null = null
	focused: string[] = []
	private listeners = new Set<() => void>()

	load(board: Board) {
		this.calls.push('load')
		this.board = structuredClone(board)
		this.previewing = null
	}
	preview(ops: CanvasOp[], proposalId: string) {
		this.calls.push(`preview:${proposalId}`)
		this.previewing = { ops, base: this.board, id: proposalId }
		this.board = applyOps(this.board, ops)
	}
	commit() {
		this.calls.push('commit')
		this.previewing = null
	}
	discard() {
		this.calls.push('discard')
		if (this.previewing) this.board = this.previewing.base
		this.previewing = null
	}
	apply(ops: CanvasOp[]) {
		this.calls.push('apply')
		this.board = applyOps(this.board, ops)
	}
	read() {
		return this.board
	}
	exists(id: string) {
		return this.board.shapes.some((s) => s.id === id) || this.board.relationships.some((r) => r.id === id)
	}
	onChange(cb: () => void) {
		this.listeners.add(cb)
		return () => this.listeners.delete(cb)
	}
	focus(ids: string[]) {
		this.focused = ids
	}
	highlight(ids: string[] | null) {
		this.highlighted = ids
	}
	screenRect() {
		return { x: 0, y: 0, w: 100, h: 100 }
	}
	/** Simulate Cmd+Z removing shapes and relationships. */
	simulateUndo(board: Board) {
		this.board = structuredClone(board)
		this.listeners.forEach((l) => l())
	}
}

/** Delay that resolves on the next microtask, or rejects if aborted. */
export const instantDelay = (_ms: number, signal: AbortSignal) =>
	signal.aborted ? Promise.reject(new DOMException('Aborted', 'AbortError')) : Promise.resolve()

/** Delay that waits until release() is called; aborts reject. */
export function manualDelay() {
	const waiting: { resolve: () => void; signal: AbortSignal }[] = []
	const delay = (_ms: number, signal: AbortSignal) =>
		new Promise<void>((resolve, reject) => {
			if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'))
			signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
			waiting.push({ resolve, signal })
		})
	const releaseAll = async () => {
		for (let i = 0; i < 50; i++) {
			const batch = waiting.splice(0)
			batch.forEach((w) => w.resolve())
			await Promise.resolve()
			await new Promise((r) => setTimeout(r, 0))
			if (!waiting.length) break
		}
	}
	return { delay, releaseAll, pending: () => waiting.length }
}

export const settle = () => new Promise((r) => setTimeout(r, 0))
