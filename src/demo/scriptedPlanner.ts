// Scripted planner: emits the same structured plans a live model will emit later.
import { applyOps } from '../core/board'
import type { PlanContext, Planner, PlanResult } from '../core/planner'
import type { ActionProposal, BeatId, Board, BoardShape, CanvasOp } from '../core/types'
import { COPY, DIRECTIONS, PEOPLE, PROJECT, THEME_PATCH, TOKEN_CHANGES, type DirectionId } from './content'
import { APPROVE_CHIP, APPROVE_KEYWORDS, BEATS, hasAny, normalize, VOTE_CHIP } from './scenario'
import { ARTIFACT_IDS, LAYOUT, SIZES, seedBoard } from './seed'

export const DECISION_ID = 'decision-warm'
export const PR_ID = 'pr-42'
const GAP_NOTE = { editorial: 'note-gap-editorial', playful: 'note-gap-playful' }

const has = (b: Board, id: string) => b.shapes.some((s) => s.id === id)
const hasFrames = (b: Board) => b.shapes.some((s) => s.type === 'direction')
const isApproved = (b: Board) => b.dots['dir-warm'] === 'approved'
const votesIn = (b: Board) => (b.votes['dir-warm']?.length ?? 0) > 0
const prOpen = (b: Board) => b.shapes.some((s) => s.type === 'pull-request')

export function chipsFor(board: Board, beat: BeatId): string[] {
	if (!hasFrames(board)) return [BEATS[0].chip!]
	if (prOpen(board)) return [BEATS[5].chip!]
	if (isApproved(board)) return [BEATS[3].chip!]
	if (votesIn(board)) return [APPROVE_CHIP]
	const gapsDone = has(board, GAP_NOTE.editorial) || has(board, GAP_NOTE.playful)
	return beat <= 1 && !gapsDone ? [BEATS[1].chip!, VOTE_CHIP] : [VOTE_CHIP]
}

function directionNamed(text: string): DirectionId | null {
	const t = normalize(text)
	if (t.includes('editorial')) return 'dir-editorial'
	if (t.includes('playful')) return 'dir-playful'
	if (t.includes('warm') || t.includes('tactile')) return 'dir-warm'
	return null
}

function tagToDirection(tag: string | undefined): DirectionId | null {
	const d = DIRECTIONS.find((d) => d.id === `dir-${tag}`)
	return d ? d.id : null
}

function organizeOps(board: Board): CanvasOp[] {
	const ops: CanvasOp[] = DIRECTIONS.map((d) => ({
		op: 'createFrame' as const,
		id: d.id,
		name: d.name,
		rationale: d.rationale,
		x: LAYOUT.frameX[d.id],
		y: LAYOUT.frameY,
		...SIZES.frame,
	}))
	const counts: Record<DirectionId, number> = { 'dir-warm': 0, 'dir-editorial': 0, 'dir-playful': 0 }
	const refs = board.shapes.filter((s) => s.type === 'reference')
	const known = refs.filter((r) => tagToDirection(r.tags?.[0]))
	const unknown = refs.filter((r) => !tagToDirection(r.tags?.[0]))
	const moves: { id: string; x: number; y: number; rotation: number; parentId: string }[] = []
	const place = (r: BoardShape, dir: DirectionId) => {
		const slot = LAYOUT.slot(counts[dir]++)
		moves.push({ id: r.id, ...slot, rotation: 0, parentId: dir })
	}
	known.forEach((r) => place(r, tagToDirection(r.tags?.[0])!))
	unknown.forEach((r) => {
		const dir = (Object.keys(counts) as DirectionId[]).reduce((a, b) => (counts[b] < counts[a] ? b : a))
		place(r, dir)
	})
	for (const id of Object.keys(LAYOUT.files)) {
		if (has(board, id)) moves.push({ id, x: LAYOUT.files[id], y: LAYOUT.rowC, rotation: 0, parentId: '' })
	}
	for (const id of Object.keys(LAYOUT.notes)) {
		if (has(board, id)) moves.push({ id, x: LAYOUT.notes[id], y: LAYOUT.rowB, rotation: 0, parentId: '' })
	}
	ops.push({ op: 'moveShapes', moves })
	return ops
}

function childCount(board: Board, dir: string) {
	return board.shapes.filter((s) => s.parentId === dir).length
}

function gapOps(board: Board): CanvasOp[] {
	const ops: CanvasOp[] = []
	if (has(board, 'dir-editorial'))
		ops.push({ op: 'createNote', id: GAP_NOTE.editorial, text: COPY.gaps.notes.editorial, author: 'ai', parentId: 'dir-editorial', ...LAYOUT.slot(childCount(board, 'dir-editorial')) })
	if (has(board, 'dir-playful'))
		ops.push({ op: 'createNote', id: GAP_NOTE.playful, text: COPY.gaps.notes.playful, author: 'ai', parentId: 'dir-playful', ...LAYOUT.slot(childCount(board, 'dir-playful')) })
	return ops
}

function approveCommitOps(board: Board): CanvasOp[] {
	return [
		{ op: 'setStatus', id: 'dir-warm', dot: 'approved' },
		{
			op: 'createShape',
			shape: {
				id: DECISION_ID,
				type: 'decision',
				...LAYOUT.decision,
				...SIZES.decision,
				props: {
					title: 'Warm & tactile',
					rationale: DIRECTIONS[0].rationale,
					approvedBy: PEOPLE.you.name,
					time: '2:14 PM',
					votes: board.votes['dir-warm']?.length ?? 0,
				},
			},
		},
	]
}

function linkOps(board: Board): CanvasOp[] {
	const candidates: CanvasOp[] = [
		{ op: 'connect', id: 'rel-dec-logo', from: DECISION_ID, to: ARTIFACT_IDS.logo, kind: 'developed-into' },
		{ op: 'connect', id: 'rel-dec-webui', from: DECISION_ID, to: ARTIFACT_IDS.webUi, kind: 'developed-into' },
		{ op: 'connect', id: 'rel-webui-theme', from: ARTIFACT_IDS.webUi, to: ARTIFACT_IDS.theme, kind: 'implemented-in' },
	]
	return candidates.filter((o) => o.op === 'connect' && has(board, o.from) && has(board, o.to))
}

function applyChangeOps(): CanvasOp[] {
	return [
		{
			op: 'createShape',
			shape: {
				id: PR_ID,
				type: 'pull-request',
				...LAYOUT.pr,
				...SIZES.pr,
				props: {
					number: 42,
					title: 'Apply Warm & tactile tokens to theme.ts',
					branch: 'direction/warm-tactile',
					repo: PROJECT.repo,
					files: 1,
					additions: 6,
					deletions: 6,
					status: 'Open · review requested',
				},
			},
		},
		{ op: 'connect', id: 'rel-dec-pr', from: DECISION_ID, to: PR_ID, kind: 'implemented-in' },
		{ op: 'setStatus', id: PR_ID, dot: 'synced' },
	]
}

export const PROPOSAL_IDS = { organize: 'prop-organize', gaps: 'prop-gaps', links: 'prop-links', apply: 'prop-apply' }

export class ScriptedPlanner implements Planner {
	plan(prompt: string, ctx: PlanContext): PlanResult {
		const { board, beat } = ctx
		const help = (): PlanResult => ({ intent: 'help', thinking: [], message: COPY.help, chips: chipsFor(board, beat) })
		if (!normalize(prompt)) return help()

		if (hasFrames(board) && !isApproved(board) && hasAny(prompt, APPROVE_KEYWORDS)) {
			const target = directionNamed(prompt) ?? 'dir-warm'
			if (target !== 'dir-warm') return this.notInDemo(board, beat)
			return this.approve(target, ctx)
		}
		if (!hasFrames(board) && hasAny(prompt, BEATS[0].keywords)) return this.organize(board)
		if (hasFrames(board) && !isApproved(board) && !votesIn(board) && hasAny(prompt, BEATS[2].keywords)) {
			return { intent: 'vote', thinking: [], message: COPY.voteAsk, chips: [] }
		}
		if (hasFrames(board) && !isApproved(board) && !has(board, GAP_NOTE.editorial) && !has(board, GAP_NOTE.playful) && hasAny(prompt, BEATS[1].keywords)) {
			return this.gaps(board)
		}
		if (isApproved(board) && !prOpen(board) && hasAny(prompt, BEATS[3].keywords)) return this.apply(board)
		if (prOpen(board) && hasAny(prompt, BEATS[5].keywords)) return this.connections(board)
		return help()
	}

	/** Called for a direct Approve click on a direction frame as well as typed approvals. */
	approve(directionId: string, ctx: PlanContext): PlanResult {
		const { board, beat } = ctx
		if (directionId !== 'dir-warm') return this.notInDemo(board, beat)
		const commitOps = approveCommitOps(board)
		const after = applyOps(board, commitOps)
		const proposal: ActionProposal = {
			id: PROPOSAL_IDS.links,
			beat: 3,
			summary: COPY.approve.summary,
			ops: linkOps(after),
			permission: 'suggest',
			external: false,
		}
		return { intent: 'approve', thinking: [], message: COPY.approve.message, commitOps, proposal, chips: [] }
	}

	private notInDemo(board: Board, beat: BeatId): PlanResult {
		return { intent: 'not-in-demo', thinking: [], message: COPY.notInDemo, chips: chipsFor(board, beat) }
	}

	private organize(board: Board): PlanResult {
		return {
			intent: 'propose',
			thinking: COPY.organize.thinking,
			message: COPY.organize.message,
			chips: [],
			proposal: {
				id: PROPOSAL_IDS.organize,
				beat: 1,
				summary: COPY.organize.summary,
				ops: organizeOps(board),
				permission: 'suggest',
				external: false,
			},
		}
	}

	private gaps(board: Board): PlanResult {
		return {
			intent: 'propose',
			thinking: COPY.gaps.thinking,
			message: COPY.gaps.message,
			chips: [],
			proposal: { id: PROPOSAL_IDS.gaps, beat: 2, summary: COPY.gaps.summary, ops: gapOps(board), permission: 'suggest', external: false },
		}
	}

	private apply(_board: Board): PlanResult {
		return {
			intent: 'propose',
			thinking: COPY.apply.thinking,
			message: COPY.apply.message,
			chips: [],
			proposal: {
				id: PROPOSAL_IDS.apply,
				beat: 4,
				summary: COPY.apply.summary,
				ops: applyChangeOps(),
				tokenChanges: TOKEN_CHANGES,
				fileDiffs: [{ path: 'website/src/theme.ts', patch: THEME_PATCH }],
				permission: 'prepare',
				external: true,
			},
		}
	}

	private connections(board: Board): PlanResult {
		const warmRefs = board.shapes.filter((s) => s.parentId === 'dir-warm' && s.type === 'reference').map((s) => s.id)
		const ids = [...warmRefs, 'dir-warm', DECISION_ID, ARTIFACT_IDS.logo, ARTIFACT_IDS.webUi, ARTIFACT_IDS.theme, PR_ID]
		return {
			intent: 'show-connections',
			thinking: [],
			message: COPY.connections,
			highlightIds: ids.filter((id) => has(board, id)),
			chips: chipsFor(board, 6),
		}
	}
}

/** Deterministic board for any beat: the seed plus every accepted step before it. */
export function boardAtBeat(beat: BeatId): Board {
	const planner = new ScriptedPlanner()
	let board = seedBoard()
	if (beat >= 1) board = applyOps(board, planner.plan(BEATS[0].chip!, { board, beat: 0, selection: [] }).proposal!.ops)
	if (beat >= 2) board = applyOps(board, planner.plan(BEATS[1].chip!, { board, beat: 1, selection: [] }).proposal!.ops)
	if (beat >= 3) {
		board = applyOps(board, [
			{ op: 'addVote', directionId: 'dir-warm', voter: PEOPLE.maya.name },
			{ op: 'addVote', directionId: 'dir-warm', voter: PEOPLE.jon.name },
		])
		const r = planner.approve('dir-warm', { board, beat: 2, selection: [] })
		board = applyOps(applyOps(board, r.commitOps!), r.proposal!.ops)
	}
	if (beat >= 5) board = applyOps(board, applyChangeOps())
	return board
}

