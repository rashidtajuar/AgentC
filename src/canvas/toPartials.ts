import { createShapeId, toRichText, type TLShapeId, type TLShapePartial } from 'tldraw'
import type { BoardShape, BoardShapeType, CanvasOp, DotState, Relationship, RelationshipKind } from '../core/types'
import { SHAPE } from './shapes/types'

export const TL_TYPE: Record<BoardShapeType, string> = {
	artifact: SHAPE.artifact,
	reference: SHAPE.reference,
	direction: SHAPE.direction,
	decision: SHAPE.decision,
	'pull-request': SHAPE.pr,
	note: 'note',
}

export const BOARD_TYPE: Record<string, BoardShapeType> = {
	[SHAPE.artifact]: 'artifact',
	[SHAPE.reference]: 'reference',
	[SHAPE.direction]: 'direction',
	[SHAPE.decision]: 'decision',
	[SHAPE.pr]: 'pull-request',
	note: 'note',
	image: 'reference',
}

export const RELATION_LABEL: Record<RelationshipKind, string> = {
	inspired: 'inspired',
	constrains: 'constrains',
	'developed-into': 'developed into',
	'implemented-in': 'implemented in',
	'included-in': 'included in',
}

/** Board ids are plain strings; shapes a person added on the canvas keep their tldraw id. */
export function toTlId(boardId: string): TLShapeId {
	return (boardId.startsWith('shape:') ? boardId : createShapeId(boardId)) as TLShapeId
}

interface PartialOpts {
	ghost: boolean
	dot?: DotState
	votes?: string[]
}

export function boardShapeToPartial(s: BoardShape, { ghost, dot, votes }: PartialOpts): TLShapePartial {
	const type = TL_TYPE[s.type]
	const base = {
		id: toTlId(s.id),
		type,
		x: s.x,
		y: s.y,
		rotation: s.rotation ?? 0,
		...(s.parentId ? { parentId: toTlId(s.parentId) } : {}),
		meta: {
			boardId: s.id,
			ghost,
			...(s.tags ? { tags: s.tags } : {}),
			...(dot ? { dot } : {}),
			...(votes ? { votes } : {}),
		},
	}
	const p = s.props as Record<string, unknown>
	const box = { w: s.w ?? 200, h: s.h ?? 200 }
	switch (s.type) {
		case 'note':
			return {
				...base,
				meta: { ...base.meta, author: String(p.author ?? '') },
				opacity: ghost ? 0.6 : 1,
				props: {
					richText: toRichText(String(p.text ?? '')),
					color: p.author === 'ai' ? 'light-blue' : 'yellow',
					font: 'draw',
					size: 's',
					align: 'start',
					verticalAlign: 'start',
				},
			} as TLShapePartial
		case 'artifact':
			return {
				...base,
				props: {
					...box,
					name: String(p.name ?? ''),
					tool: String(p.tool ?? 'doc'),
					ext: String(p.ext ?? ''),
					location: String(p.location ?? ''),
					status: String(p.status ?? 'linked'),
					summary: String(p.summary ?? ''),
					preview: String(p.preview ?? 'doc'),
					capabilities: (p.capabilities as string[]) ?? [],
				},
			} as TLShapePartial
		case 'reference':
			return {
				...base,
				props: { ...box, kind: p.kind ?? 'swatch', title: String(p.title ?? ''), asset: String(p.asset ?? '') },
			} as TLShapePartial
		case 'direction':
			return { ...base, props: { ...box, name: String(p.name ?? ''), rationale: String(p.rationale ?? '') } } as TLShapePartial
		case 'decision':
			return {
				...base,
				props: {
					...box,
					title: String(p.title ?? ''),
					rationale: String(p.rationale ?? ''),
					approvedBy: String(p.approvedBy ?? ''),
					time: String(p.time ?? ''),
					votes: Number(p.votes ?? 0),
				},
			} as TLShapePartial
		case 'pull-request':
			return {
				...base,
				props: {
					...box,
					number: Number(p.number ?? 0),
					title: String(p.title ?? ''),
					branch: String(p.branch ?? ''),
					repo: String(p.repo ?? ''),
					files: Number(p.files ?? 0),
					additions: Number(p.additions ?? 0),
					deletions: Number(p.deletions ?? 0),
					status: String(p.status ?? ''),
				},
			} as TLShapePartial
	}
}

export function arrowPartial(rel: Relationship, ghost: boolean): TLShapePartial {
	return {
		id: toTlId(rel.id),
		type: 'arrow',
		x: 0,
		y: 0,
		opacity: ghost ? 0.85 : 1,
		meta: { boardId: rel.id, rel: rel.kind, from: rel.from, to: rel.to, ghost },
		props: {
			richText: toRichText(RELATION_LABEL[rel.kind]),
			color: ghost ? 'blue' : 'black',
			labelColor: ghost ? 'blue' : 'black',
			dash: ghost ? 'dashed' : 'solid',
			size: 's',
			font: 'sans',
			arrowheadEnd: 'arrow',
			bend: 0,
		},
	} as TLShapePartial
}

export interface EditorActions {
	create: BoardShape[]
	moves: { id: string; x: number; y: number; rotation?: number; parentId?: string }[]
	arrows: Relationship[]
	dots: { id: string; dot: DotState }[]
	votes: { directionId: string; voter: string }[]
}

/** Pure translation of canvas ops into the actions an editor must perform. */
export function opsToEditorActions(ops: CanvasOp[]): EditorActions {
	const out: EditorActions = { create: [], moves: [], arrows: [], dots: [], votes: [] }
	for (const op of ops) {
		switch (op.op) {
			case 'createFrame':
				out.create.push({
					id: op.id,
					type: 'direction',
					x: op.x,
					y: op.y,
					w: op.w,
					h: op.h,
					props: { name: op.name, rationale: op.rationale },
				})
				break
			case 'createNote':
				out.create.push({
					id: op.id,
					type: 'note',
					x: op.x,
					y: op.y,
					...(op.parentId ? { parentId: op.parentId } : {}),
					props: { text: op.text, author: op.author },
				})
				break
			case 'createShape':
				out.create.push(op.shape)
				break
			case 'moveShapes':
				out.moves.push(...op.moves)
				break
			case 'connect':
				out.arrows.push({ id: op.id, from: op.from, to: op.to, kind: op.kind })
				break
			case 'setStatus':
				out.dots.push({ id: op.id, dot: op.dot })
				break
			case 'addVote':
				out.votes.push({ directionId: op.directionId, voter: op.voter })
				break
		}
	}
	return out
}
