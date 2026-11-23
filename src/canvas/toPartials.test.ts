import { describe, expect, it } from 'vitest'
import { arrowPartial, boardShapeToPartial, opsToEditorActions, toTlId } from './toPartials'

describe('toPartials', () => {
	it('partial ids are prefixed shape: and person-made ids are kept', () => {
		expect(toTlId('ref-cup')).toBe('shape:ref-cup')
		expect(toTlId('shape:abc')).toBe('shape:abc')
		const p = boardShapeToPartial(
			{ id: 'ref-cup', type: 'reference', x: 1, y: 2, w: 220, h: 232, parentId: 'dir-warm', props: { kind: 'photo', title: 't', asset: 'cup' } },
			{ ghost: false }
		)
		expect(p.id).toBe('shape:ref-cup')
		expect(p.parentId).toBe('shape:dir-warm')
		expect(p.type).toBe('cc-reference')
	})

	it('ghost flag, board id and dot land in meta', () => {
		const p = boardShapeToPartial(
			{ id: 'art-logo', type: 'artifact', x: 0, y: 0, props: { name: 'Logo' } },
			{ ghost: true, dot: 'synced' }
		)
		expect(p.meta).toMatchObject({ ghost: true, boardId: 'art-logo', dot: 'synced' })
	})

	it('ghost arrows are dashed and blue, committed ones solid', () => {
		const rel = { id: 'r1', from: 'a', to: 'b', kind: 'developed-into' as const }
		expect(arrowPartial(rel, true).props).toMatchObject({ dash: 'dashed', color: 'blue' })
		expect(arrowPartial(rel, false).props).toMatchObject({ dash: 'solid', color: 'black' })
	})

	it('opsToEditorActions sorts ops into creates, moves, arrows, dots and votes', () => {
		const a = opsToEditorActions([
			{ op: 'createFrame', id: 'd', name: 'n', rationale: 'r', x: 0, y: 0, w: 1, h: 1 },
			{ op: 'moveShapes', moves: [{ id: 'x', x: 1, y: 1 }] },
			{ op: 'connect', id: 'r', from: 'a', to: 'b', kind: 'inspired' },
			{ op: 'setStatus', id: 'd', dot: 'approved' },
			{ op: 'addVote', directionId: 'd', voter: 'Maya' },
		])
		expect([a.create.length, a.moves.length, a.arrows.length, a.dots.length, a.votes.length]).toEqual([1, 1, 1, 1, 1])
	})
})
