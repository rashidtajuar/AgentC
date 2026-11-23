import { Box, type Editor, type TLShape, type TLShapeId, type TLShapePartial } from 'tldraw'
import type { Board, BoardShape, CanvasOp, DotState, Relationship } from '../core/types'
import { useCanvasUi } from './canvasUi'
import type { CanvasPort } from './port'
import { arrowPartial, BOARD_TYPE, boardShapeToPartial, opsToEditorActions, toTlId } from './toPartials'

const TWEEN_MS = 620
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))

function prefersReducedMotion() {
	return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

interface Tween {
	id: TLShapeId
	type: string
	from: { x: number; y: number; rotation: number }
	to: { x: number; y: number; rotation: number }
}

export function createTldrawPort(editor: Editor): CanvasPort {
	let mark: string | null = null
	let raf = 0

	const meta = (s: TLShape) => (s.meta ?? {}) as Record<string, unknown>
	const getById = (id: string) => editor.getShape(toTlId(id))

	function stopTween() {
		if (raf) cancelAnimationFrame(raf)
		raf = 0
	}

	function runTweens(tweens: Tween[]) {
		stopTween()
		if (!tweens.length) return
		const apply = (t: number) => {
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
								rotation: tw.from.rotation + (tw.to.rotation - tw.from.rotation) * k,
							}) as TLShapePartial
					)
			)
		}
		if (prefersReducedMotion()) return apply(1)
		const start = performance.now()
		const tick = (now: number) => {
			const t = Math.min(1, (now - start) / TWEEN_MS)
			apply(t)
			raf = t < 1 ? requestAnimationFrame(tick) : 0
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
		const tweens: Tween[] = []
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
			if (ghost) editor.updateShape({ id: now.id, type: now.type, meta: { ...meta(now), ghost: true } } as TLShapePartial)
			tweens.push({
				id: now.id,
				type: now.type,
				from: { x: now.x, y: now.y, rotation: now.rotation },
				to: { x: m.x, y: m.y, rotation: m.rotation ?? now.rotation },
			})
		}
		runTweens(tweens)
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
			shapes.push({
				id: boardId,
				type,
				x: s.x,
				y: s.y,
				rotation: s.rotation,
				...(parent ? { parentId: (meta(parent).boardId as string | undefined) ?? parent.id } : {}),
				...(m.tags ? { tags: m.tags as string[] } : {}),
				props: s.props as Record<string, unknown>,
			})
			if (m.dot) dots[boardId] = m.dot as DotState
			if (m.votes) votes[boardId] = m.votes as string[]
		}
		return { shapes, relationships, dots, votes }
	}

	function focus(ids: string[], opts: { immediate?: boolean } = {}) {
		const boxes = ids.map((id) => editor.getShapePageBounds(toTlId(id))).filter((b): b is Box => !!b)
		if (!boxes.length) return
		const bounds = Box.Common(boxes)
		const vp = editor.getViewportScreenBounds()
		const inset = 72
		const zoom = Math.min(1, (vp.w - inset * 2) / bounds.w, (vp.h - inset * 2) / bounds.h)
		editor.zoomToBounds(bounds, {
			inset,
			targetZoom: Math.max(0.2, zoom),
			...(opts.immediate || prefersReducedMotion() ? { immediate: true } : { animation: { duration: 560 } }),
		})
	}

	const port: CanvasPort = {
		load(board) {
			stopTween()
			mark = null
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
			if (mark) port.discard()
			mark = editor.markHistoryStoppingPoint(`proposal:${proposalId}`)
			applyActions(ops, true)
		},
		commit() {
			if (!mark) return
			stopTween()
			const ghosts = editor.getCurrentPageShapes().filter((s) => meta(s).ghost || meta(s).ghostDot)
			editor.updateShapes(
				ghosts.map((s) => {
					const { ghost: _g, ghostDot: _gd, ...rest } = meta(s)
					const partial: Record<string, unknown> = { id: s.id, type: s.type, meta: rest, opacity: 1 }
					if (s.type === 'arrow') partial.props = { color: 'black', labelColor: 'black', dash: 'solid' }
					return partial as TLShapePartial
				})
			)
			editor.squashToMark(mark)
			mark = null
		},
		discard() {
			stopTween()
			if (mark) editor.bailToMark(mark)
			mark = null
		},
		apply(ops) {
			applyActions(ops, false)
		},
		read,
		exists(id) {
			return !!getById(id)
		},
		onChange(cb) {
			return editor.store.listen(() => cb(), { scope: 'document', source: 'all' })
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

