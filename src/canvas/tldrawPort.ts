import { Box, renderPlaintextFromRichText, type Editor, type RecordsDiff, type TLRecord, type TLRichText, type TLShape, type TLShapeId, type TLShapePartial } from 'tldraw'
import type { Board, BoardShape, CanvasOp, DotState, Relationship } from '../core/types'
import { useCanvasUi } from './canvasUi'
import type { CanvasPort } from './port'
import { arrowPartial, BOARD_TYPE, boardShapeToPartial, opsToEditorActions, toTlId } from './toPartials'

const TWEEN_MS = 620
const TAU = Math.PI * 2
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))
/** Signed shortest turn from a to b, so -2° → 0° never spins through 358°. */
const shortestTurn = (a: number, b: number) => ((((b - a) % TAU) + 1.5 * TAU) % TAU) - TAU / 2

function prefersReducedMotion() {
	return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

interface Tween {
	id: TLShapeId
	type: string
	from: { x: number; y: number; rotation: number }
	to: { x: number; y: number; rotation: number }
}

export function createTldrawPort(editor: Editor, { animateMoves = true } = {}): CanvasPort {
	let mark: string | null = null
	let markProposal: string | null = null
	let raf = 0
	let tweens: Tween[] = []
	// a preview the person undid, kept so a redo can hand it back
	let undone: { mark: string; tweens: Tween[]; proposalId: string } | null = null

	// tldraw's history, read only: entries are diffs and named stops, newest first
	type HistoryEntry = { type: 'diff'; diff: RecordsDiff<TLRecord> } | { type: 'stop'; id: string }
	type HistoryStack = { head: HistoryEntry | null; tail: HistoryStack }
	const history = () =>
		(editor as unknown as { history: { stacks: { get(): { undos: HistoryStack } }; pendingDiff: { diff: RecordsDiff<TLRecord> } } }).history
	// a change to the board itself, as opposed to selection, camera or other session state
	const touchesBoard = (d: RecordsDiff<TLRecord>) =>
		[d.added, d.updated, d.removed].some((o) => Object.keys(o).some((k) => k.startsWith('shape:') || k.startsWith('binding:')))
	// tldraw keeps undo stops on its history stack; a stop still there means its step is applied
	const markOnUndoStack = (id: string) =>
		(editor as unknown as { getMarkIdMatching(s: string): string | null }).getMarkIdMatching(id) === id

	const meta = (s: TLShape) => (s.meta ?? {}) as Record<string, unknown>
	const getById = (id: string) => editor.getShape(toTlId(id))

	function stopTween() {
		if (raf) cancelAnimationFrame(raf)
		raf = 0
		tweens = []
	}

	function tweenAt(t: number) {
		const k = easeOutExpo(t)
		editor.updateShapes(
			tweens
				.filter((tw) => editor.getShape(tw.id))
				.map(
					(tw) =>
						({
							id: tw.id,
							type: tw.type,
							x: tw.from.x + (tw.to.x - tw.from.x) * k,
							y: tw.from.y + (tw.to.y - tw.from.y) * k,
							rotation: tw.from.rotation + shortestTurn(tw.from.rotation, tw.to.rotation) * k,
						}) as TLShapePartial
				)
		)
	}

	/** Land every moving card at its destination now (used when a preview is accepted mid-move). */
	function finishTween() {
		if (tweens.length) tweenAt(1)
		stopTween()
	}

	function runTweens(next: Tween[]) {
		stopTween()
		if (!next.length) return
		tweens = next
		if (!animateMoves || prefersReducedMotion()) return finishTween()
		const start = performance.now()
		const tick = (now: number) => {
			// the preview was undone between frames: stop moving cards, keep the targets for a redo
			if (mark && !markOnUndoStack(mark)) {
				raf = 0
				return
			}
			const t = Math.min(1, Math.max(0, (now - start) / TWEEN_MS))
			tweenAt(t)
			if (t < 1) raf = requestAnimationFrame(tick)
			else stopTween()
		}
		raf = requestAnimationFrame(tick)
	}

	function createShapes(shapes: BoardShape[], board: Pick<Board, 'dots' | 'votes'>, ghost: boolean) {
		// parents before children
		const ordered = [...shapes].sort((a, b) => Number(!!a.parentId) - Number(!!b.parentId))
		const partials = ordered
			.filter((s) => !getById(s.id))
			.filter((s) => !s.parentId || getById(s.parentId) || shapes.some((p) => p.id === s.parentId))
			.map((s) =>
				boardShapeToPartial(s, {
					ghost,
					dot: board.dots[s.id],
					votes: s.type === 'direction' ? (board.votes[s.id] ?? []) : undefined,
				})
			)
		if (partials.length) editor.createShapes(partials)
	}

	function createArrows(rels: Relationship[], ghost: boolean) {
		for (const rel of rels) {
			const from = getById(rel.from)
			const to = getById(rel.to)
			if (!from || !to || getById(rel.id)) continue
			const arrowId = toTlId(rel.id)
			editor.createShape(arrowPartial(rel, ghost))
			editor.createBindings(
				(['start', 'end'] as const).map((terminal) => ({
					type: 'arrow' as const,
					fromId: arrowId,
					toId: terminal === 'start' ? from.id : to.id,
					props: { terminal, normalizedAnchor: { x: 0.5, y: 0.5 }, isExact: false, isPrecise: false, snap: 'none' as const },
				}))
			)
		}
	}

	function setDot(id: string, dot: DotState, ghost: boolean) {
		const s = getById(id)
		if (!s) return
		editor.updateShape({ id: s.id, type: s.type, meta: { ...meta(s), dot, ...(ghost ? { ghostDot: true } : {}) } } as TLShapePartial)
	}

	function addVote(directionId: string, voter: string) {
		const s = getById(directionId)
		if (!s) return
		const votes = (meta(s).votes as string[] | undefined) ?? []
		if (votes.includes(voter)) return
		editor.updateShape({ id: s.id, type: s.type, meta: { ...meta(s), votes: [...votes, voter] } } as TLShapePartial)
	}

	function moveShapes(moves: { id: string; x: number; y: number; rotation?: number; parentId?: string }[], ghost: boolean) {
		const next: Tween[] = []
		for (const m of moves) {
			const s = getById(m.id)
			if (!s) continue
			if (m.parentId !== undefined) {
				const parent = m.parentId ? getById(m.parentId) : undefined
				const target = parent ? parent.id : editor.getCurrentPageId()
				if (s.parentId !== target) editor.reparentShapes([s.id], target)
			}
			const now = editor.getShape(s.id)!
			// a person's dropped image gets scaled to fit a slot
			if (now.type === 'image') {
				const p = now.props as { w: number; h: number }
				const k = Math.min(220 / p.w, 232 / p.h)
				editor.updateShape({ id: now.id, type: 'image', props: { w: p.w * k, h: p.h * k } } as TLShapePartial)
			}
			if (ghost) {
				// tldraw's own shapes (e.g. a dropped image) can't draw our ghost style, so fade them instead
				const native = !now.type.startsWith('cc-')
				editor.updateShape({ id: now.id, type: now.type, ...(native ? { opacity: 0.5 } : {}), meta: { ...meta(now), ghost: true } } as TLShapePartial)
			}
			next.push({
				id: now.id,
				type: now.type,
				from: { x: now.x, y: now.y, rotation: now.rotation },
				to: { x: m.x, y: m.y, rotation: m.rotation ?? now.rotation },
			})
		}
		runTweens(next)
	}

	function applyActions(ops: CanvasOp[], ghost: boolean) {
		const a = opsToEditorActions(ops)
		const board = read()
		createShapes(a.create, { dots: Object.fromEntries(a.dots.map((d) => [d.id, d.dot])), votes: board.votes }, ghost)
		moveShapes(a.moves, ghost)
		createArrows(a.arrows, ghost)
		a.dots.forEach((d) => setDot(d.id, d.dot, ghost))
		a.votes.forEach((v) => addVote(v.directionId, v.voter))
	}

	function read(): Board {
		const shapes: BoardShape[] = []
		const relationships: Relationship[] = []
		const dots: Board['dots'] = {}
		const votes: Board['votes'] = {}
		for (const s of editor.getCurrentPageShapes()) {
			const m = meta(s)
			const boardId = (m.boardId as string | undefined) ?? s.id
			if (s.type === 'arrow') {
				if (m.rel) relationships.push({ id: boardId, from: String(m.from), to: String(m.to), kind: m.rel as Relationship['kind'] })
				continue
			}
			const type = BOARD_TYPE[s.type]
			if (!type) continue
			const parent = editor.getShape(s.parentId as TLShapeId)
			const p = s.props as Record<string, unknown>
			const props =
				s.type === 'note'
					? {
							text: renderPlaintextFromRichText(editor, p.richText as TLRichText),
							author: (m.author as string | undefined) ?? (p.color === 'light-blue' ? 'ai' : ''),
						}
					: p
			shapes.push({
				id: boardId,
				type,
				x: s.x,
				y: s.y,
				rotation: s.rotation,
				...(typeof p.w === 'number' && typeof p.h === 'number' && s.type !== 'note' ? { w: p.w, h: p.h } : {}),
				...(parent ? { parentId: (meta(parent).boardId as string | undefined) ?? parent.id } : {}),
				...(m.tags ? { tags: m.tags as string[] } : {}),
				props,
			})
			if (m.dot) dots[boardId] = m.dot as DotState
			if (m.votes) votes[boardId] = m.votes as string[]
		}
		return { shapes, relationships, dots, votes }
	}

	/**
	 * Fit shapes into the canvas area that is actually free: a margin on three sides and a taller
	 * reserve at the bottom for tldraw's toolbar and action bar. Wide groups sit at the top.
	 */
	function focus(ids: string[], opts: { immediate?: boolean } = {}) {
		const boxes = ids.map((id) => editor.getShapePageBounds(toTlId(id))).filter((b): b is Box => !!b)
		if (!boxes.length) return
		const bounds = Box.Common(boxes)
		const vp = editor.getViewportScreenBounds()
		const SIDE = 36
		const TOP = 32
		const BOTTOM = 118
		const availW = Math.max(100, vp.w - SIDE * 2)
		const availH = Math.max(100, vp.h - TOP - BOTTOM)
		const z = Math.max(0.2, Math.min(1, availW / bounds.w, availH / bounds.h))
		const padX = (availW - bounds.w * z) / 2
		// centre in the area left between the top inset and the toolbar, so spare height splits evenly
		const padY = (availH - bounds.h * z) / 2
		const camera = { x: (SIDE + padX) / z - bounds.x, y: (TOP + padY) / z - bounds.y, z }
		editor.setCamera(camera, opts.immediate || prefersReducedMotion() ? { immediate: true } : { animation: { duration: 560 } })
	}

	const port: CanvasPort = {
		load(board) {
			stopTween()
			mark = null
			undone = null
			useCanvasUi.getState().setHighlight(null)
			editor.run(
				() => {
					const ids = [...editor.getCurrentPageShapeIds()]
					if (ids.length) editor.deleteShapes(ids)
					createShapes(board.shapes, board, false)
					createArrows(board.relationships, false)
				},
				{ history: 'ignore' }
			)
			editor.clearHistory()
			editor.selectNone()
			focus(
				board.shapes.filter((s) => !s.parentId).map((s) => s.id),
				{ immediate: true }
			)
		},
		preview(ops, proposalId) {
			undone = null
			if (mark) port.discard()
			mark = editor.markHistoryStoppingPoint(`proposal:${proposalId}`)
			markProposal = proposalId
			applyActions(ops, true)
		},
		commit() {
			if (!mark) return null
			finishTween()
			const ghosts = editor.getCurrentPageShapes().filter((s) => meta(s).ghost || meta(s).ghostDot)
			editor.updateShapes(
				ghosts.map((s) => {
					// tldraw merges meta on update, so flags are cleared explicitly
					const partial: Record<string, unknown> = { id: s.id, type: s.type, meta: { ...meta(s), ghost: false, ghostDot: false }, opacity: 1 }
					if (s.type === 'arrow') partial.props = { color: 'black', labelColor: 'black', dash: 'solid' }
					return partial as TLShapePartial
				})
			)
			// the preview's stop mark now heads this step. Clicks during the preview add stops of their own,
			// so fold everything after the mark into one entry: one undo takes the whole proposal back
			const step = mark
			mark = null
			if (markOnUndoStack(step)) editor.squashToMark(step)
			return step
		},
		discard() {
			stopTween()
			if (mark && markOnUndoStack(mark)) editor.bailToMark(mark)
			mark = null
		},
		apply(ops) {
			// a direct action is never folded into an open preview or into the previous step
			undone = null
			if (mark) port.discard()
			const step = editor.markHistoryStoppingPoint('apply')
			applyActions(ops, false)
			return step
		},
		isStepActive(step) {
			return markOnUndoStack(step)
		},
		previewWasUndone() {
			if (!mark || markOnUndoStack(mark)) return false
			undone = { mark, tweens, proposalId: markProposal ?? '' }
			stopTween()
			mark = null
			return true
		},
		previewWasRedone() {
			if (!undone || !markOnUndoStack(undone.mark)) return null
			const { proposalId } = undone
			mark = undone.mark
			markProposal = proposalId
			tweens = undone.tweens
			undone = null
			// cards caught mid-move by the undo land in their slots
			finishTween()
			return proposalId
		},
		isLatestStep(step) {
			// walk back from the newest entry: the diffs right above the step's stop are its own;
			// a board change behind any later stop (a vote, a note, a drag) means someone has moved on
			const h = history()
			let changedSinceStop = touchesBoard(h.pendingDiff.diff)
			let laterChange = false
			for (let top = h.stacks.get().undos; top.head; top = top.tail) {
				const e = top.head
				if (e.type === 'stop') {
					if (e.id === step) return !laterChange
					if (changedSinceStop) laterChange = true
					changedSinceStop = false
				} else if (touchesBoard(e.diff)) changedSinceStop = true
			}
			return false
		},
		undo() {
			editor.undo()
		},
		read,
		exists(id) {
			return !!getById(id)
		},
		onChange(cb) {
			// tldraw notifies before it updates its undo stack, so report once the change has settled
			let queued = false
			return editor.store.listen(
				() => {
					if (queued) return
					queued = true
					queueMicrotask(() => {
						queued = false
						cb()
					})
				},
				{ scope: 'document', source: 'all' }
			)
		},
		focus(ids) {
			focus(ids)
		},
		highlight(ids) {
			useCanvasUi.getState().setHighlight(ids)
		},
		screenRect(id) {
			const b = editor.getShapePageBounds(toTlId(id))
			if (!b) return null
			const tl = editor.pageToViewport({ x: b.x, y: b.y })
			const z = editor.getZoomLevel()
			return { x: tl.x, y: tl.y, w: b.w * z, h: b.h * z }
		},
	}
	return port
}

