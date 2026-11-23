// The beat-0 wall: references and files pinned up loosely, before any AI help.
import { emptyBoard } from '../core/board'
import type { Artifact, Board, BoardShape } from '../core/types'
import type { DirectionId } from './content'

export const ARTIFACT_IDS = {
	brief: 'art-brief',
	logo: 'art-logo',
	webUi: 'art-webui',
	theme: 'art-theme',
} as const

export const NOTE_IDS = { maya: 'note-maya', jon: 'note-jon' } as const

export const SIZES = {
	reference: { w: 220, h: 232 },
	artifact: { w: 280, h: 176 },
	note: { w: 200, h: 200 },
	frame: { w: 520, h: 648 },
	decision: { w: 520, h: 150 },
	pr: { w: 300, h: 150 },
}

/** Layout of the organized wall (used by the organize proposal and later beats). */
export const LAYOUT = {
	frameX: { 'dir-warm': 0, 'dir-editorial': 580, 'dir-playful': 1160 } as Record<DirectionId, number>,
	frameY: 0,
	slot: (index: number) => ({ x: 24 + (index % 2) * 248, y: 140 + Math.floor(index / 2) * 246 }),
	rowB: 724,
	rowC: 964,
	files: { 'art-logo': 0, 'art-webui': 400, 'art-theme': 800, 'art-brief': 1200 } as Record<string, number>,
	notes: { 'note-maya': 1160, 'note-jon': 1400 } as Record<string, number>,
	decision: { x: 0, y: 724 },
	pr: { x: 600, y: 724 },
}

interface ReferenceSeed {
	id: string
	direction: DirectionId
	kind: 'photo' | 'swatch' | 'specimen' | 'texture'
	title: string
	/** key into PHOTOS for photos, or a variant name for authored references */
	asset: string
	x: number
	y: number
	rotation: number
}

const deg = (d: number) => (d * Math.PI) / 180

export const REFERENCES: ReferenceSeed[] = [
	{ id: 'ref-cup', direction: 'dir-warm', kind: 'photo', title: 'Hand-thrown cup', asset: 'cup', x: 20, y: 30, rotation: deg(-2) },
	{ id: 'ref-glaze', direction: 'dir-warm', kind: 'photo', title: 'Kiln-red glaze', asset: 'glaze', x: 560, y: 306, rotation: deg(1.5) },
	{ id: 'ref-beans', direction: 'dir-warm', kind: 'photo', title: 'Dark roast', asset: 'beans', x: 1062, y: 40, rotation: deg(-1) },
	{ id: 'ref-kiln', direction: 'dir-warm', kind: 'swatch', title: 'Kiln palette', asset: 'kiln', x: 300, y: 336, rotation: deg(2.5) },
	{ id: 'ref-book', direction: 'dir-editorial', kind: 'photo', title: 'Grid book spread', asset: 'book', x: 280, y: 8, rotation: deg(1) },
	{ id: 'ref-mag', direction: 'dir-editorial', kind: 'photo', title: 'Quiet layout', asset: 'magazine', x: 822, y: 334, rotation: deg(-2.5) },
	{ id: 'ref-serif', direction: 'dir-editorial', kind: 'specimen', title: 'Sharp serif', asset: 'serif', x: 36, y: 318, rotation: deg(-1.5) },
	{ id: 'ref-fizz', direction: 'dir-playful', kind: 'swatch', title: 'Fizz palette', asset: 'fizz', x: 800, y: 16, rotation: deg(2) },
	{ id: 'ref-round', direction: 'dir-playful', kind: 'specimen', title: 'Chunky rounded', asset: 'rounded', x: 540, y: 44, rotation: deg(-1) },
	{ id: 'ref-pattern', direction: 'dir-playful', kind: 'texture', title: 'Bubble pattern', asset: 'bubbles', x: 1082, y: 300, rotation: deg(1.5) },
]

export const ARTIFACTS: (Artifact & { x: number; y: number; rotation: number; preview: string })[] = [
	{
		id: ARTIFACT_IDS.brief,
		name: 'Halden_Brief.pdf',
		tool: 'doc',
		ext: '.pdf',
		location: 'Drive / Halden / 01 Brief',
		status: 'linked',
		capabilities: ['open', 'preview', 'read'],
		summary: 'Client brief · 6 pages',
		preview: 'doc',
		x: 250,
		y: 640,
		rotation: deg(-1),
	},
	{
		id: ARTIFACT_IDS.logo,
		name: 'Logo_explorations_v3.ai',
		tool: 'illustrator',
		ext: '.ai',
		location: '~/Studio/Halden/Brand/Logo_explorations_v3.ai',
		status: 'linked',
		capabilities: ['open', 'preview'],
		summary: '12 artboards · edited by Maya',
		preview: 'logo',
		x: 572,
		y: 618,
		rotation: deg(1.5),
	},
	{
		id: ARTIFACT_IDS.webUi,
		name: 'Halden — Web UI.fig',
		tool: 'figma',
		ext: '.fig',
		location: 'Figma / Northbound / Halden — Web UI',
		status: 'linked',
		capabilities: ['open', 'preview', 'read'],
		summary: '8 frames · 24 variables',
		preview: 'ui',
		x: 892,
		y: 642,
		rotation: deg(-2),
	},
	{
		id: ARTIFACT_IDS.theme,
		name: 'theme.ts',
		tool: 'repo',
		ext: '.ts',
		location: 'northbound/halden-website · website/src/theme.ts',
		status: 'linked',
		capabilities: ['open', 'preview', 'read', 'propose-edit'],
		summary: 'main · updated 3 days ago',
		preview: 'code',
		x: 1210,
		y: 616,
		rotation: deg(1),
	},
]

const NOTES = [
	{ id: NOTE_IDS.maya, author: 'Maya', text: 'Client kept pointing at the handmade cups in the kickoff.', x: 20, y: 622, rotation: deg(-3) },
	{ id: NOTE_IDS.jon, author: 'Jon', text: 'Site ships before the spring menu. Keep the tokens simple.', x: 1340, y: 312, rotation: deg(2) },
]

export function seedBoard(): Board {
	const shapes: BoardShape[] = [
		...REFERENCES.map(
			(r): BoardShape => ({
				id: r.id,
				type: 'reference',
				x: r.x,
				y: r.y,
				rotation: r.rotation,
				...SIZES.reference,
				tags: [r.direction.replace('dir-', '')],
				props: { kind: r.kind, title: r.title, asset: r.asset },
			})
		),
		...ARTIFACTS.map(
			({ x, y, rotation, preview, ...a }): BoardShape => ({
				id: a.id,
				type: 'artifact',
				x,
				y,
				rotation,
				...SIZES.artifact,
				props: { ...a, preview },
			})
		),
		...NOTES.map(
			(n): BoardShape => ({
				id: n.id,
				type: 'note',
				x: n.x,
				y: n.y,
				rotation: n.rotation,
				props: { text: n.text, author: n.author },
			})
		),
	]
	const dots = Object.fromEntries(ARTIFACTS.map((a) => [a.id, 'synced' as const]))
	return { ...emptyBoard(), shapes, dots }
}
