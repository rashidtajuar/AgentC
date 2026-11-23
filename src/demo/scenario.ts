import type { BeatId } from '../core/types'

export interface BeatInfo {
	name: string
	/** Suggestion chip that starts the next beat from here */
	chip: string | null
	keywords: string[]
}

/** `beat` in the demo store is the last completed beat; BEATS[beat].chip starts the next one. */
export const BEATS: Record<BeatId, BeatInfo> = {
	0: { name: 'Wall at rest', chip: 'Organize into directions', keywords: ['organize', 'organise', 'group', 'sort', 'cluster', 'arrange', 'directions', 'tidy'] },
	1: { name: 'Organized', chip: 'What are we missing?', keywords: ['missing', 'gap', 'gaps', 'expand', 'ideas', 'suggest', 'add'] },
	2: { name: 'Gaps noted', chip: 'Ask the team to vote', keywords: ['vote', 'team', 'decide', 'poll'] },
	3: { name: 'Direction approved', chip: 'Apply this direction to the website', keywords: ['apply', 'website', 'site', 'code', 'implement', 'theme', 'build', 'change'] },
	4: { name: 'Change proposed', chip: null, keywords: [] },
	5: { name: 'Pull request open', chip: 'Show connections', keywords: ['connection', 'connections', 'lineage', 'trace', 'show', 'history', 'why'] },
	6: { name: 'Connections shown', chip: 'Show connections', keywords: ['connection', 'connections', 'lineage', 'trace', 'show', 'history', 'why'] },
}

export const VOTE_CHIP = 'Ask the team to vote'
export const APPROVE_CHIP = 'Approve Warm & tactile'
export const VOTE_KEYWORDS = BEATS[2].keywords
export const APPROVE_KEYWORDS = ['approve', 'approved', 'choose', 'pick', 'select', 'go with', 'lock', 'decide on']

export function normalize(prompt: string): string {
	return prompt
		.toLowerCase()
		.replace(/[^a-z0-9&\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
}

export function hasAny(text: string, keywords: string[]): boolean {
	const t = ` ${normalize(text)} `
	return keywords.some((k) => t.includes(` ${k} `) || t.includes(` ${k}`))
}
