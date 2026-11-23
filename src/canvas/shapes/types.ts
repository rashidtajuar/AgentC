import type { TLShape } from 'tldraw'

export const SHAPE = {
	artifact: 'cc-artifact',
	reference: 'cc-reference',
	direction: 'cc-direction',
	decision: 'cc-decision',
	pr: 'cc-pr',
} as const

export type ReferenceKind = 'photo' | 'swatch' | 'specimen' | 'texture'

declare module 'tldraw' {
	export interface TLGlobalShapePropsMap {
		'cc-artifact': {
			w: number
			h: number
			name: string
			tool: string
			ext: string
			location: string
			status: string
			summary: string
			preview: string
			capabilities: string[]
		}
		'cc-reference': { w: number; h: number; kind: ReferenceKind; title: string; asset: string }
		'cc-direction': { w: number; h: number; name: string; rationale: string }
		'cc-decision': { w: number; h: number; title: string; rationale: string; approvedBy: string; time: string; votes: number }
		'cc-pr': {
			w: number
			h: number
			number: number
			title: string
			branch: string
			repo: string
			files: number
			additions: number
			deletions: number
			status: string
		}
	}
}

export type ArtifactShape = TLShape<'cc-artifact'>
export type ReferenceShape = TLShape<'cc-reference'>
export type DirectionShape = TLShape<'cc-direction'>
export type DecisionShape = TLShape<'cc-decision'>
export type PullRequestShape = TLShape<'cc-pr'>

/** What every Crit Wall shape may carry in `meta`. */
export interface CcMeta {
	ghost?: boolean
	proposalId?: string
	dot?: 'proposal' | 'synced' | 'changed' | 'approved'
	votes?: string[]
	boardId?: string
}

export function ccMeta(shape: { meta: unknown }): CcMeta {
	return (shape.meta ?? {}) as CcMeta
}
