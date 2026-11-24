import type { ActionProposal, Board, BoardShape, ToolKind } from '../core/types'

export interface Project { id: string; name: string; brief: string; createdAt: string }
export interface SavedDocument { version: 1; revision: string; snapshot: unknown }
export const PROJECTS_KEY = 'agentc:projects:v1'
export const documentKey = (id: string) => `agentc:document:${id}`

const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)

export function canvasDocument(value: unknown): value is { schema: Record<string, unknown>; store: Record<string, unknown> } {
	if (!object(value) || !object(value.schema) || typeof value.schema.schemaVersion !== 'number' || !object(value.store)) return false
	const records = Object.values(value.store)
	return records.some((r) => object(r) && r.typeName === 'document') && records.some((r) => object(r) && r.typeName === 'page')
}

function isCanvasSnapshot(value: unknown): boolean {
	if (!object(value) || !canvasDocument(value.document) || !object(value.session)) return false
	const { session } = value
	return session.version === 0 && typeof session.currentPageId === 'string' && Array.isArray(session.pageStates)
}

export function createProject(name: string, brief: string): Project {
	if (!name.trim() || name.trim().length > 100) throw new Error('Give your project a name of 1–100 characters.')
	if (brief.length > 2000) throw new Error('Keep the brief under 2,000 characters.')
	return { id: crypto.randomUUID(), name: name.trim(), brief: brief.trim(), createdAt: new Date().toISOString() }
}

export function sourceUrl(value: string): string {
	let url: URL
	try { url = new URL(value.trim()) } catch { throw new Error('Enter a complete http or https source URL.') }
	if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || value.length > 2048) {
		throw new Error('Use an http or https URL without embedded credentials (up to 2,048 characters).')
	}
	return url.href
}

export const SOURCE_TYPES: Partial<Record<ToolKind, string>> = {
	doc: 'Document / web link',
	figma: 'Figma design',
	repo: 'Repository / code',
	image: 'Image reference',
	folder: 'Folder link',
	pdf: 'PDF',
	file: 'File link',
	link: 'Inspiration link',
}

export function sourceShape(name: string, url: string, tool: ToolKind, index: number): BoardShape {
	if (!name.trim() || name.trim().length > 120) throw new Error('Give the source a name of 1–120 characters.')
	if (!Object.hasOwn(SOURCE_TYPES, tool)) throw new Error('Choose a supported source type.')
	return {
		id: crypto.randomUUID(), type: 'artifact', x: 80 + (index % 3) * 320, y: 80 + Math.floor(index / 3) * 220, w: 280, h: 176,
		props: { name: name.trim(), location: sourceUrl(url), tool, ext: tool === 'pdf' ? 'PDF' : 'LINK', status: 'unverified', summary: 'Link only · source not read or synced', preview: 'link', capabilities: ['open'] },
	}
}

export function readProjects(storage: Storage): Project[] {
	try {
		const raw = storage.getItem(PROJECTS_KEY)
		if (!raw) return []
		const data = JSON.parse(raw)
		if (data.version !== 1 || !Array.isArray(data.projects) || !data.projects.every((p: Project) =>
			p && typeof p.id === 'string' && /^[\w-]+$/.test(p.id) && typeof p.name === 'string' && typeof p.brief === 'string' && typeof p.createdAt === 'string')) throw new Error()
		return data.projects
	} catch { throw new Error('Could not read saved projects. Existing browser data has been kept. Export or recover it before continuing.') }
}

export function writeProjects(storage: Storage, projects: Project[]) {
	// Verify existing data before replacing it; creation callers merge the latest index.
	readProjects(storage)
	storage.setItem(PROJECTS_KEY, JSON.stringify({ version: 1, projects }))
}

export function readDocument(storage: Storage, id: string): SavedDocument | null {
	try {
		const raw = storage.getItem(documentKey(id))
		if (!raw) return null
		const data = JSON.parse(raw)
		if (data.version !== 1 || typeof data.revision !== 'string' || !isCanvasSnapshot(data.snapshot)) throw new Error()
		return data
	} catch { throw new Error('Could not read this saved canvas. Existing browser data has been kept. Return to projects or recover the saved data.') }
}

export function writeDocument(storage: Storage, id: string, snapshot: unknown, expectedRevision: string | null): string {
	if (!isCanvasSnapshot(snapshot)) throw new Error('The canvas snapshot is incomplete. Existing saved data has been kept.')
	const current = readDocument(storage, id)
	if ((current?.revision ?? null) !== expectedRevision) throw new Error('This project changed in another tab. Reload to open the latest saved canvas; this tab will not overwrite it.')
	const revision = crypto.randomUUID()
	storage.setItem(documentKey(id), JSON.stringify({ version: 1, revision, snapshot }))
	return revision
}

/** Deliberately local: only positions and source-type metadata, no file content or tool access. */
export function planOrganization(board: Board): ActionProposal {
	const sources = board.shapes.filter((s) => s.type === 'artifact').sort((a, b) => String(a.props.tool).localeCompare(String(b.props.tool)) || a.id.localeCompare(b.id))
	if (!sources.length) throw new Error('Add a source before requesting an organization proposal.')
	return {
		id: crypto.randomUUID(), beat: 0, summary: `Arrange ${sources.length} source ${sources.length === 1 ? 'card' : 'cards'} by type`, permission: 'suggest', external: false,
		ops: [{ op: 'moveShapes', moves: sources.map((s, i) => ({ id: s.id, x: 80 + (i % 3) * 320, y: 80 + Math.floor(i / 3) * 220, rotation: 0, parentId: '' })) }],
	}
}
