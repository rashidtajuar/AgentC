import { applyOps, emptyBoard } from '../core/board'
import type { Board, CanvasOp } from '../core/types'
import type { CanvasPort, StepId } from '../canvas/port'

/**
 * In-memory CanvasPort that mirrors the tldraw adapter's contract: every preview and every apply is
 * one undo step, a new preview discards the previous one, and change notifications arrive a tick later.
 */
export class FakePort implements CanvasPort {
	board: Board = emptyBoard()
	previewing: { ops: CanvasOp[]; id: string; step: StepId } | null = null
	calls: string[] = []
	highlighted: string[] | null = null
	focused: string[] = []
	private history: { step: StepId; before: Board }[] = []
	private seq = 0
	private listeners = new Set<() => void>()

	private notify() {
		setTimeout(() => this.listeners.forEach((l) => l()), 0)
	}
	private push(kind: string) {
		const step = `[${kind}]_${++this.seq}`
		this.history.push({ step, before: this.board })
		return step
	}

	load(board: Board) {
		this.calls.push('load')
		this.board = structuredClone(board)
		this.previewing = null
		this.history = []
	}
	preview(ops: CanvasOp[], proposalId: string) {
		if (this.previewing) this.discard()
		this.calls.push(`preview:${proposalId}`)
		const step = this.push(`proposal:${proposalId}`)
		this.previewing = { ops, id: proposalId, step }
		this.board = applyOps(this.board, ops)
		this.notify()
	}
	commit() {
		if (!this.previewing) return null
		this.calls.push('commit')
		const step = this.previewing.step
		this.previewing = null
		return step
	}
	discard() {
		this.calls.push('discard')
		const p = this.previewing
		this.previewing = null
		if (!p) return
		const i = this.history.findIndex((h) => h.step === p.step)
		if (i < 0) return
		this.board = this.history[i].before
		this.history = this.history.slice(0, i)
		this.notify()
	}
	apply(ops: CanvasOp[]) {
		if (this.previewing) this.discard()
		this.calls.push('apply')
		const step = this.push('apply')
		this.board = applyOps(this.board, ops)
		this.notify()
		return step
	}
	isStepActive(step: StepId) {
		return this.history.some((h) => h.step === step)
	}
	previewWasUndone() {
		if (!this.previewing || this.isStepActive(this.previewing.step)) return false
		this.previewing = null
		return true
	}
	previewWasRedone() {
		return false // the fake keeps no redo stack
	}
	undo() {
		const last = this.history.pop()
		if (!last) return
		this.calls.push('undo')
		this.board = last.before
		this.notify()
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
	/** A person deleting shapes by hand: not an undo. */
	deleteShapes(ids: string[]) {
		this.board = {
			...this.board,
			shapes: this.board.shapes.filter((s) => !ids.includes(s.id)),
			relationships: this.board.relationships.filter((r) => !ids.includes(r.id)),
		}
		this.notify()
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

export const settle = (ms = 5) => new Promise((r) => setTimeout(r, ms))
