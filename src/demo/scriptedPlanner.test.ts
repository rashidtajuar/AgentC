import { describe, expect, it } from 'vitest'
import { applyOps } from '../core/board'
import type { Board, CanvasOp } from '../core/types'
import { COPY } from './content'
import { BEATS } from './scenario'
import { boardAtBeat, chipsFor, ScriptedPlanner } from './scriptedPlanner'
import { seedBoard } from './seed'

const planner = new ScriptedPlanner()
const ctx = (board: Board, beat: 0 | 1 | 2 | 3 | 4 | 5 | 6) => ({ board, beat, selection: [] })
const moves = (ops: CanvasOp[]) => ops.flatMap((o) => (o.op === 'moveShapes' ? o.moves : []))

describe('ScriptedPlanner', () => {
	it('organizes by chip text or keywords into 3 frames, moving every reference', () => {
		for (const prompt of [BEATS[0].chip!, 'can you group these please?']) {
			const r = planner.plan(prompt, ctx(seedBoard(), 0))
			expect(r.intent).toBe('propose')
			const ops = r.proposal!.ops
			expect(ops.filter((o) => o.op === 'createFrame')).toHaveLength(3)
			const moved = moves(ops).filter((m) => m.parentId)
			expect(moved.map((m) => m.id).sort()).toEqual(
				seedBoard().shapes.filter((s) => s.type === 'reference').map((s) => s.id).sort()
			)
			expect(r.thinking.length).toBeGreaterThan(0)
		}
	})

	it('organize skips references missing from the board', () => {
		const board = seedBoard()
		board.shapes = board.shapes.filter((s) => s.id !== 'ref-cup')
		const r = planner.plan('organize', ctx(board, 0))
		expect(moves(r.proposal!.ops).some((m) => m.id === 'ref-cup')).toBe(false)
	})

	it('organize places an unknown reference dropped by the driver into a direction', () => {
		const board = seedBoard()
		board.shapes = [...board.shapes, { id: 'dropped-1', type: 'reference', x: 0, y: 0, props: {} }]
		const r = planner.plan('organize', ctx(board, 0))
		const m = moves(r.proposal!.ops).find((m) => m.id === 'dropped-1')
		expect(m?.parentId).toMatch(/^dir-/)
	})

	it('unrelated prompt returns the help reply and the current chips, no proposal', () => {
		const r = planner.plan('what is the weather like', ctx(seedBoard(), 0))
		expect(r.intent).toBe('help')
		expect(r.message).toBe(COPY.help)
		expect(r.proposal).toBeUndefined()
		expect(r.chips).toEqual([BEATS[0].chip])
	})

	it('approving Editorial returns the not-in-demo reply and changes nothing', () => {
		const r = planner.plan('approve editorial', ctx(boardAtBeat(2), 2))
		expect(r.intent).toBe('not-in-demo')
		expect(r.message).toBe(COPY.notInDemo)
		expect(r.proposal).toBeUndefined()
		expect(r.commitOps).toBeUndefined()
	})

	it('only a plain, affirmative "approve" approves', () => {
		for (const prompt of [
			"Don't approve anything yet, what are we missing?",
			'Which direction should we pick?',
			'Can you select the references with red in them?',
			'should we approve warm?',
			'please address the brief',
		]) {
			const r = planner.plan(prompt, ctx(boardAtBeat(2), 2))
			expect(r.intent, prompt).not.toBe('approve')
			expect(r.commitOps, prompt).toBeUndefined()
		}
		expect(planner.plan('approve warm', ctx(boardAtBeat(2), 2)).intent).toBe('approve')
		expect(planner.plan("Don't approve, what's missing?", ctx(boardAtBeat(1), 1)).proposal?.id).toBe('prop-gaps')
	})

	it('approving Editorial after Warm is approved still gets the not-in-demo reply', () => {
		const r = planner.plan('approve editorial', ctx(boardAtBeat(3), 3))
		expect(r.message).toBe(COPY.notInDemo)
	})

	it('approving Warm & tactile commits the decision and proposes 3 links', () => {
		const r = planner.plan('Approve Warm & tactile', ctx(boardAtBeat(2), 2))
		expect(r.intent).toBe('approve')
		const after = applyOps(boardAtBeat(2), r.commitOps!)
		expect(after.dots['dir-warm']).toBe('approved')
		expect(after.shapes.some((s) => s.type === 'decision')).toBe(true)
		const links = r.proposal!.ops.filter((o) => o.op === 'connect')
		expect(links.map((l) => (l.op === 'connect' ? `${l.from}>${l.to}:${l.kind}` : ''))).toEqual([
			'decision-warm>art-logo:developed-into',
			'decision-warm>art-webui:developed-into',
			'art-webui>art-theme:implemented-in',
		])
	})

	it('beat 3 apply proposal is external, prepare-level, with tokens and one theme.ts diff', () => {
		const r = planner.plan(BEATS[3].chip!, ctx(boardAtBeat(3), 3))
		const p = r.proposal!
		expect(p.external).toBe(true)
		expect(p.permission).toBe('prepare')
		expect(p.tokenChanges!.length).toBeGreaterThan(0)
		expect(p.fileDiffs!.map((f) => f.path)).toEqual(['website/src/theme.ts'])
	})

	it('boardAtBeat(4) contains the decision and dir-warm approved', () => {
		const b = boardAtBeat(4)
		expect(b.shapes.some((s) => s.id === 'decision-warm')).toBe(true)
		expect(b.dots['dir-warm']).toBe('approved')
		expect(b.votes['dir-warm']).toEqual(['Maya', 'Jon'])
	})

	it('boardAtBeat(5) has the pull request linked from the decision', () => {
		const b = boardAtBeat(5)
		expect(b.shapes.some((s) => s.type === 'pull-request')).toBe(true)
		expect(b.relationships.some((r) => r.from === 'decision-warm' && r.kind === 'implemented-in')).toBe(true)
	})

	it('chips follow the story', () => {
		expect(chipsFor(boardAtBeat(1), 1)).toEqual([BEATS[1].chip, BEATS[2].chip])
		expect(chipsFor(boardAtBeat(2), 2)).toEqual([BEATS[2].chip])
		const voted = applyOps(boardAtBeat(2), [
			{ op: 'addVote', directionId: 'dir-warm', voter: 'Maya' },
		])
		expect(chipsFor(voted, 2)).toEqual(['Approve Warm & tactile'])
		expect(chipsFor(boardAtBeat(3), 3)).toEqual([BEATS[3].chip])
		expect(chipsFor(boardAtBeat(5), 5)).toEqual(['Show connections'])
	})

	it('show connections highlights the lineage from warm references to the PR', () => {
		const r = planner.plan('Show connections', ctx(boardAtBeat(5), 5))
		expect(r.intent).toBe('show-connections')
		expect(r.highlightIds).toEqual(
			expect.arrayContaining(['ref-cup', 'dir-warm', 'decision-warm', 'art-logo', 'art-webui', 'art-theme', 'pr-42'])
		)
		expect(r.highlightIds).not.toContain('ref-book')
	})
})
