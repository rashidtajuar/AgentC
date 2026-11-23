import { describe, expect, it } from 'vitest'
import { ARTIFACT_IDS, seedBoard } from './seed'

describe('seedBoard', () => {
	const board = seedBoard()

	it('ids are unique', () => {
		const ids = board.shapes.map((s) => s.id)
		expect(new Set(ids).size).toBe(ids.length)
	})

	it('every reference has exactly one direction tag', () => {
		const refs = board.shapes.filter((s) => s.type === 'reference')
		expect(refs).toHaveLength(10)
		for (const r of refs) {
			const dirTags = (r.tags ?? []).filter((t) => ['warm', 'editorial', 'playful'].includes(t))
			expect(dirTags, r.id).toHaveLength(1)
		}
	})

	it('has four artifacts: pdf, illustrator, figma and repo', () => {
		const arts = board.shapes.filter((s) => s.type === 'artifact')
		expect(arts.map((a) => a.id).sort()).toEqual(Object.values(ARTIFACT_IDS).sort())
		expect(arts.map((a) => a.props.tool).sort()).toEqual(['doc', 'figma', 'illustrator', 'repo'])
	})

	it('beat 0 has no directions, no votes and only in-sync dots', () => {
		expect(board.shapes.some((s) => s.type === 'direction')).toBe(false)
		expect(board.votes).toEqual({})
		expect(Object.values(board.dots).every((d) => d === 'synced')).toBe(true)
	})
})
