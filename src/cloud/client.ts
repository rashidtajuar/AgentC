import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { TLAssetStore } from 'tldraw'
import { canvasDocument, type Project } from '../workspace/model'
import type { CanvasStorage } from '../workspace/useProjectCanvas'
import { cloudDocument, importDocument } from './document'

const projectFields = 'id, name, brief, created_at'
const bucket = 'agentc-board-media'
// tldraw validates this reference as a URL. The asset resolver replaces it with a signed URL.
const mediaPrefix = 'https://agentc-media.invalid/'
let cloudClient: SupabaseClient | undefined

interface CloudRow { id: string; name: string; brief: string; created_at: string }

function asProject(row: CloudRow): Project {
	return { id: row.id, name: row.name, brief: row.brief, createdAt: row.created_at }
}

export function getCloudClient() {
	const url = import.meta.env.VITE_SUPABASE_URL
	const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
	return url && key ? (cloudClient ??= createClient(url, key)) : null
}

export async function listCloudProjects(client: SupabaseClient) {
	const { data, error } = await client.from('agentc_projects').select(projectFields).order('created_at', { ascending: false })
	if (error) throw new Error('Cloud projects could not be loaded.')
	return data.map(asProject)
}

export async function createCloudProject(client: SupabaseClient, userId: string, project: Project, snapshot: unknown = null) {
	const existing = await client.from('agentc_projects').select(projectFields).eq('id', project.id).maybeSingle()
	if (existing.error) throw new Error('Could not check for an existing cloud project.')
	if (existing.data) return asProject(existing.data)

	const upload = mediaStore(client, userId, project.id)
	const document = await importDocument(snapshot, async (source) => upload.put(await (await fetch(source)).blob()))
	const { error } = await client.from('agentc_projects').upsert({
		id: project.id, name: project.name, brief: project.brief, document,
	}, { onConflict: 'owner_id,id', ignoreDuplicates: true })
	if (error) throw new Error('Could not save this project to the cloud. Try again.')
	return project
}

export async function openCloudProject(client: SupabaseClient, userId: string, projectId: string) {
	const { data, error } = await client.from('agentc_projects')
		.select(`${projectFields}, document, revision`).eq('id', projectId).maybeSingle()
	if (error) throw new Error('Could not load the saved canvas. Try again.')
	if (!data) throw new Error('This cloud project is unavailable to your account.')
	if (data.document !== null && !canvasDocument(data.document)) throw new Error('The saved cloud canvas could not be read.')
	const project = asProject(data)
	const storage: CanvasStorage = {
		read: () => ({ revision: data.revision, snapshot: data.document ? { document: data.document } : null }),
		async write(snapshot, expectedRevision) {
			const { data: revision, error } = await client.rpc('agentc_save_document', {
				project_id: projectId, expected_revision: expectedRevision, next_document: cloudDocument(snapshot),
			})
			if (error) throw new Error(error.code === '23514' ? 'This board exceeds the cloud canvas size limit.' : 'Check your connection and try saving again.')
			if (typeof revision !== 'string') throw new Error('This project changed on another device. Download your edits before reloading.')
			return revision
		},
	}
	return { project, storage, assets: mediaStore(client, userId, projectId).assets }
}

function mediaStore(client: SupabaseClient, userId: string, projectId: string) {
	const storage = client.storage.from(bucket)
	const folder = `${userId}/${projectId}`
	const resolved = new Map<string, { url: string; refreshAt: number }>()
	async function put(file: Blob) {
		if (file.size > 10 * 1024 * 1024) throw new Error('Each cloud image or video must be 10 MB or smaller.')
		const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
		const path = `${folder}/${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')}`
		const { error } = await storage.upload(path, file, { contentType: file.type, upsert: true })
		if (error) throw new Error('Could not upload this media. Check the file type and your connection.')
		return mediaPrefix + path
	}
	const assets: TLAssetStore = {
		async upload(_asset, file) { return { src: await put(file) } },
		async resolve(asset) {
			const source = asset.props.src
			if (!source?.startsWith(mediaPrefix)) return source
			const path = source.slice(mediaPrefix.length)
			if (!path.startsWith(folder + '/')) return null
			const cached = resolved.get(path)
			if (cached && cached.refreshAt > Date.now()) return cached.url
			const { data, error } = await storage.createSignedUrl(path, 3600)
			if (error) return null
			resolved.set(path, { url: data.signedUrl, refreshAt: Date.now() + 50 * 60 * 1000 })
			return data.signedUrl
		},
	}
	return { put, assets }
}
