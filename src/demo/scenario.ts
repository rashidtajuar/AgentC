import type { BeatId } from '../core/types'

export interface BeatInfo {
	name: string
	/** Suggestion chip that starts the next beat from here */
	chip: string | null
	keywords: string[]
}

/** `beat` in the demo store is the last completed beat; BEATS[beat].chip starts the next one. */
export const BEATS: Record<BeatId, BeatInfo> = {
	0: { name: 'Wall at rest', chip: 'Organize into directions', keywords: ['organize', 'organise', 'group', 'groups', 'sort', 'cluster', 'arrange', 'directions', 'tidy'] },
	1: { name: 'Organized', chip: 'What are we missing?', keywords: ['missing', 'gap', 'gaps', 'expand', 'ideas', 'suggest', 'add'] },
	2: { name: 'Gaps noted', chip: 'Ask the team to vote', keywords: ['vote', 'team', 'decide', 'poll'] },
	3: { name: 'Direction approved', chip: 'Apply this direction to the website', keywords: ['apply', 'website', 'site', 'code', 'implement', 'theme', 'build', 'change'] },
	4: { name: 'Change proposed', chip: null, keywords: [] },
	5: { name: 'Pull request open', chip: 'Show connections', keywords: ['connection', 'connections', 'lineage', 'trace', 'show', 'history', 'why'] },
	6: { name: 'Connections shown', chip: 'Show connections', keywords: ['connection', 'connections', 'lineage', 'trace', 'show', 'history', 'why'] },
}

export const VOTE_CHIP = 'Ask the team to vote'
export const APPROVE_CHIP = 'Approve Warm & tactile'
export const CLEAR_HIGHLIGHT_CHIP = 'Clear highlight'
export const VOTE_KEYWORDS = BEATS[2].keywords
/** Approval must be explicit: "approve" itself, never pick/select/choose. */
export const APPROVE_KEYWORDS = ['approve', 'approved', 'approving', 'approval']
const NEGATIONS = ['don', 'dont', 'do not', 'not', 'no', 'never', 'without', 'wait', 'hold', 'stop', 'yet', 'doesn', 'shouldn', 'won', 'isn']
const QUESTION_STARTS = ['which', 'what', 'should', 'can', 'could', 'would', 'do', 'does', 'how', 'why', 'is', 'are', 'who', 'when']

export function normalize(prompt: string): string {
	return prompt
		.toLowerCase()
		.replace(/[^a-z0-9&\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
}

function words(text: string) {
	return normalize(text).split(' ').filter(Boolean)
}

/** Whole-word match; longer keywords (5+ letters) also match their inflections ("organizing"). */
export function hasAny(text: string, keywords: string[]): boolean {
	const t = ` ${normalize(text)} `
	const ws = words(text)
	return keywords.some((k) =>
		k.includes(' ') ? t.includes(` ${k} `) : ws.some((w) => w === k || (k.length >= 5 && w.startsWith(k)))
	)
}

export function isNegated(text: string): boolean {
	return hasAny(text, NEGATIONS)
}

export function isQuestion(text: string): boolean {
	return text.trim().endsWith('?') || QUESTION_STARTS.includes(words(text)[0] ?? '')
}

/** A plain, affirmative "approve …" (the chip text qualifies). */
export function isApproval(text: string): boolean {
	return hasAny(text, APPROVE_KEYWORDS) && !isNegated(text) && !isQuestion(text)
}
