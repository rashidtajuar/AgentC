import { describe, expect, it } from 'vitest'
import { applyOps, emptyBoard } from './board'
import type { Board } from './types'

function base(): Board {
	return {
		...emptyBoard(),
		shapes: [
			{ id: 'a', type: 'reference', x: 0, y: 0, props: {} },
			{ id: 'b', type: 'artifact', x: 100, y: 0, props: {} },
		],
	}
}

describe('applyOps', () => {
	it('createFrame adds a direction shape', () => {
		const next = applyOps(base(), [
			{ op: 'createFrame', id: 'd1', name: 'Warm', rationale: 'r', x: 10, y: 20, w: 300, h: 200 },
		])
		const frame = next.shapes.find((s) => s.id === 'd1')
		expect(frame).toMatchObject({ type: 'direction', x: 10, y: 20, w: 300, h: 200 })
		expect(frame?.props).toMatchObject({ name: 'Warm', rationale: 'r' })
	})

	it('moveShapes updates x/y/parentId', () => {
		const next = applyOps(base(), [{ op: 'moveShapes', moves: [{ id: 'a', x: 5, y: 6, parentId: 'd1' }] }])
		expect(next.shapes.find((s) => s.id === 'a')).toMatchObject({ x: 5, y: 6, parentId: 'd1' })
	})

	it('moveShapes skips ids not on the board', () => {
		const board = base()
		const next = applyOps(board, [{ op: 'moveShapes', moves: [{ id: 'ghost', x: 1, y: 1 }] }])
		expect(next.shapes).toEqual(board.shapes)
	})

	it('connect adds a relationship only when both ends exist', () => {
		const next = applyOps(base(), [
			{ op: 'connect', id: 'r1', from: 'a', to: 'b', kind: 'inspired' },
			{ op: 'connect', id: 'r2', from: 'a', to: 'missing', kind: 'inspired' },
		])
		expect(next.relationships.map((r) => r.id)).toEqual(['r1'])
	})

	it('addVote is idempotent per voter', () => {
		const next = applyOps(base(), [
			{ op: 'addVote', directionId: 'd1', voter: 'Maya' },
			{ op: 'addVote', directionId: 'd1', voter: 'Maya' },
			{ op: 'addVote', directionId: 'd1', voter: 'Jon' },
		])
		expect(next.votes.d1).toEqual(['Maya', 'Jon'])
	})

	it('setStatus records the dot', () => {
		const next = applyOps(base(), [{ op: 'setStatus', id: 'b', dot: 'approved' }])
		expect(next.dots.b).toBe('approved')
	})

	it('createNote and createShape add shapes; duplicates are ignored', () => {
		const next = applyOps(base(), [
			{ op: 'createNote', id: 'n1', text: 'hi', x: 0, y: 0, author: 'ai' },
			{ op: 'createShape', shape: { id: 'p1', type: 'pull-request', x: 0, y: 0, props: {} } },
			{ op: 'createShape', shape: { id: 'a', type: 'reference', x: 9, y: 9, props: {} } },
		])
		expect(next.shapes.map((s) => s.id)).toEqual(['a', 'b', 'n1', 'p1'])
		expect(next.shapes.find((s) => s.id === 'n1')?.props).toMatchObject({ text: 'hi', author: 'ai' })
	})

	it('applyOps does not mutate its input', () => {
		const board = base()
		const snapshot = structuredClone(board)
		applyOps(board, [
			{ op: 'moveShapes', moves: [{ id: 'a', x: 50, y: 50 }] },
			{ op: 'addVote', directionId: 'd1', voter: 'Maya' },
			{ op: 'setStatus', id: 'a', dot: 'synced' },
		])
		expect(board).toEqual(snapshot)
	})
})
