import { useCallback, useEffect, useRef, useState } from 'react'
import { getSnapshot, loadSnapshot, type Editor } from 'tldraw'
import { CC_EVENTS } from '../canvas/canvasUi'
import { ccMeta, SHAPE, type ArtifactShape } from '../canvas/shapes/types'
import { createTldrawPort } from '../canvas/tldrawPort'
import type { ActionProposal } from '../core/types'
import { message } from './message'
import { documentKey, planOrganization, readDocument, sourceUrl, writeDocument } from './model'

export type CanvasRuntime = { editor: Editor; port: ReturnType<typeof createTldrawPort> }

export interface CanvasStorage {
	read(): { revision: string; snapshot: unknown }
	write(snapshot: unknown, expectedRevision: string | null): Promise<string>
}

export function useProjectCanvas(projectId: string, cloud?: CanvasStorage) {
	const [runtime, setRuntime] = useState<CanvasRuntime | null>(null)
	const [sources, setSources] = useState<ArtifactShape[]>([])
	const [pending, setPending] = useState<ActionProposal | null>(null)
	const pendingRef = useRef<ActionProposal | null>(null)
	const [saveStatus, setSaveStatus] = useState('Opening canvas…')
	const [error, setError] = useState('')
	const [blocked, setBlocked] = useState(false)
	const [notice, setNotice] = useState('')
	const revision = useRef<string | null>(null)
	const flushRef = useRef<() => boolean | Promise<boolean>>(() => true)
	const reloadRequested = useRef(false)
	const persist = useRef<() => boolean | Promise<boolean>>(() => false)
	const retry = useRef<() => void>(() => {})
	const savedLabel = cloud ? 'Saved to cloud' : 'Saved on this browser'

	const onMount = useCallback((editor: Editor) => {
		editor.user.updateUserPreferences({ colorScheme: 'light' })
		let initial: ReturnType<typeof getSnapshot> | undefined
		try {
			const saved = cloud ? cloud.read() : readDocument(localStorage, projectId)
			if (saved?.snapshot) {
				initial = getSnapshot(editor.store)
				loadSnapshot(editor.store, saved.snapshot as Parameters<typeof loadSnapshot>[1])
				if (cloud) editor.zoomToFit()
			}
			editor.updateInstanceState({ isGridMode: false })
			revision.current = saved?.revision ?? null
			setRuntime({ editor, port: createTldrawPort(editor, { animateMoves: false }) })
			setSaveStatus(savedLabel)
		} catch (e) {
			if (initial) loadSnapshot(editor.store, initial)
			editor.updateInstanceState({ isReadonly: true })
			setBlocked(true)
			setError(message(e))
			setSaveStatus('Could not open saved canvas')
		}
	}, [projectId, cloud, savedLabel])

	useEffect(() => {
		if (!runtime) return
		const { editor, port } = runtime
		let timer: ReturnType<typeof setTimeout> | undefined
		let dirty = false
		let failed = false
		let saving: Promise<boolean> | null = null

		function fail(e: unknown) {
			clearTimeout(timer)
			failed = true
			setError(`Canvas not saved. ${message(e)}`)
			setSaveStatus('Not saved')
			setBlocked(true)
			editor.updateInstanceState({ isReadonly: true })
		}
		function saved(nextRevision: string) {
			revision.current = nextRevision
			if (!dirty) setSaveStatus(savedLabel)
			return true
		}
		function failedWrite(e: unknown) {
			dirty = true
			fail(e)
			return false
		}
		function save(): boolean | Promise<boolean> {
			clearTimeout(timer)
			if (failed) return false
			if (saving) return saving.then((ok) => ok && save())
			if (!dirty || pendingRef.current) return true
			dirty = false
			try {
				const snapshot = getSnapshot(editor.store)
				if (!cloud) return saved(writeDocument(localStorage, projectId, snapshot, revision.current))
				saving = cloud.write(snapshot, revision.current).then(saved, failedWrite).finally(() => { saving = null })
				return saving
			} catch (e) {
				return failedWrite(e)
			}
		}
		function scheduleSave() {
			if (pendingRef.current || failed) return
			dirty = true
			setSaveStatus('Saving…')
			clearTimeout(timer)
			timer = setTimeout(save, 250)
		}

		flushRef.current = save
		persist.current = () => {
			scheduleSave()
			return save()
		}
		retry.current = () => {
			if (!failed || !cloud) return
			failed = false
			setSaveStatus('Saving…')
			void Promise.resolve(save()).then((ok) => {
				if (!ok) return
				setError('')
				setBlocked(false)
				editor.updateInstanceState({ isReadonly: false })
			})
		}
		const updateSources = () => setSources(editor.getCurrentPageShapes().filter((shape): shape is ArtifactShape => shape.type === SHAPE.artifact))
		updateSources()
		const stopDocument = editor.store.listen(({ changes }) => {
			// Only changes to source content or membership affect the rail. Dragging still saves the full document.
			if (Object.values(changes.added).some(isSource) || Object.values(changes.removed).some(isSource) ||
				Object.values(changes.updated).some(([before, after]) => isSource(before) && isSource(after) && before.props !== after.props)) {
				updateSources()
			}
			scheduleSave()
		}, { scope: 'document', source: 'all' })
		const stopSession = editor.store.listen(({ changes }) => {
			for (const [before, after] of Object.values(changes.updated)) {
				if (!cloud && after.typeName === 'camera') scheduleSave()
				if (after.typeName === 'instance' && before.typeName === 'instance' && after.currentPageId !== before.currentPageId) {
					updateSources()
					if (!cloud) scheduleSave()
				}
			}
		}, { scope: 'session', source: 'all' })
		const storage = (e: StorageEvent) => {
			if (cloud || (e.key !== documentKey(projectId) && e.key !== null)) return
			fail(new Error('The saved canvas changed in another tab. Reload to use that version.'))
		}
		const visibility = () => { if (document.visibilityState === 'hidden') save() }
		const beforeUnload = (e: BeforeUnloadEvent) => {
			if (reloadRequested.current || save() === true) return
			e.preventDefault()
			e.returnValue = ''
		}
		const openSource = (e: Event) => {
			const id = (e as CustomEvent<{ shapeId?: ArtifactShape['id'] }>).detail?.shapeId
			const shape = id && editor.getShape(id)
			if (!isSource(shape)) return
			try { window.open(sourceUrl(shape.props.location), '_blank', 'noopener,noreferrer') }
			catch (err) { setError(message(err)) }
		}
		window.addEventListener('storage', storage)
		window.addEventListener('beforeunload', beforeUnload)
		document.addEventListener('visibilitychange', visibility)
		window.addEventListener(CC_EVENTS.openArtifact, openSource)
		return () => {
			stopSession()
			stopDocument()
			if (pendingRef.current) {
				editor.updateInstanceState({ isReadonly: false })
				port.discard()
			}
			save()
			clearTimeout(timer)
			window.removeEventListener('storage', storage)
			window.removeEventListener('beforeunload', beforeUnload)
			document.removeEventListener('visibilitychange', visibility)
			window.removeEventListener(CC_EVENTS.openArtifact, openSource)
		}
	}, [runtime, projectId, cloud, savedLabel])

	async function propose() {
		if (!runtime || blocked || pendingRef.current || !(await flushRef.current()) || pendingRef.current) return
		try {
			const movable = sources.filter((source) => !runtime.editor.isShapeOrAncestorLocked(source.id))
			if (!movable.length) throw new Error('Unlock a source to include it in a layout proposal.')
			const movableIds = new Set(movable.map((source) => ccMeta(source).boardId ?? source.id))
			const board = runtime.port.read()
			const proposal = planOrganization({ ...board, shapes: board.shapes.filter((shape) => movableIds.has(shape.id)) })
			pendingRef.current = proposal
			runtime.port.preview(proposal.ops, proposal.id)
			runtime.editor.updateInstanceState({ isReadonly: true })
			runtime.port.focus(movable.map((source) => source.id))
			setPending(proposal)
			setNotice('')
		} catch (err) {
			runtime.port.discard()
			pendingRef.current = null
			setError(message(err))
		}
	}

	async function finish(accept: boolean) {
		if (!runtime || !pendingRef.current || blocked) return
		runtime.editor.updateInstanceState({ isReadonly: false })
		if (accept) runtime.port.commit()
		else runtime.port.discard()
		pendingRef.current = null
		setPending(null)
		if (!accept || await persist.current()) {
			setNotice(accept ? 'Layout accepted. Use Undo on the canvas to reverse it.' : 'Proposal discarded.')
		}
	}

	function reload() {
		reloadRequested.current = true
		location.reload()
	}

	function download() {
		if (!runtime) return
		const body = JSON.stringify(getSnapshot(runtime.editor.store))
		const url = URL.createObjectURL(new Blob([body], { type: 'application/json' }))
		const link = document.createElement('a')
		link.href = url
		link.download = `${projectId}-canvas.json`
		link.click()
		setTimeout(() => URL.revokeObjectURL(url), 1000)
	}

	return { runtime, sources, pending, saveStatus, error, blocked, notice, onMount, propose, finish, reload, setError,
		recovery: cloud && runtime ? { retry: () => retry.current(), download } : null,
		flush: () => flushRef.current() }

}

function isSource(record: unknown): record is ArtifactShape {
	return !!record && typeof record === 'object' && 'type' in record && record.type === SHAPE.artifact
}
