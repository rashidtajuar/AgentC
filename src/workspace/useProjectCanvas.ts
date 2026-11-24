import { useCallback, useEffect, useRef, useState } from 'react'
import { getSnapshot, loadSnapshot, type Editor } from 'tldraw'
import { CC_EVENTS } from '../canvas/canvasUi'
import { SHAPE, type ArtifactShape } from '../canvas/shapes/types'
import { createTldrawPort } from '../canvas/tldrawPort'
import type { ActionProposal } from '../core/types'
import { message } from './message'
import { documentKey, planOrganization, readDocument, sourceUrl, writeDocument } from './model'

export type CanvasRuntime = { editor: Editor; port: ReturnType<typeof createTldrawPort> }

export function useProjectCanvas(projectId: string) {
	const [runtime, setRuntime] = useState<CanvasRuntime | null>(null)
	const [sources, setSources] = useState<ArtifactShape[]>([])
	const [pending, setPending] = useState<ActionProposal | null>(null)
	const pendingRef = useRef<ActionProposal | null>(null)
	const [saveStatus, setSaveStatus] = useState('Opening canvas…')
	const [error, setError] = useState('')
	const [blocked, setBlocked] = useState(false)
	const [notice, setNotice] = useState('')
	const revision = useRef<string | null>(null)
	const flushRef = useRef<() => boolean>(() => true)
	const reloadRequested = useRef(false)
	const persist = useRef<() => boolean>(() => false)

	const onMount = useCallback((editor: Editor) => {
		editor.user.updateUserPreferences({ colorScheme: 'light' })
		try {
			const saved = readDocument(localStorage, projectId)
			if (saved) loadSnapshot(editor.store, saved.snapshot as Parameters<typeof loadSnapshot>[1])
			editor.updateInstanceState({ isGridMode: false })
			revision.current = saved?.revision ?? null
			setRuntime({ editor, port: createTldrawPort(editor, { animateMoves: false }) })
			setSaveStatus('Saved on this browser')
		} catch (e) {
			editor.updateInstanceState({ isReadonly: true })
			setBlocked(true)
			setError(message(e))
			setSaveStatus('Could not open saved canvas')
		}
	}, [projectId])

	useEffect(() => {
		if (!runtime) return
		const { editor, port } = runtime
		let timer: ReturnType<typeof setTimeout> | undefined
		let dirty = false
		let failed = false

		function fail(e: unknown) {
			clearTimeout(timer)
			failed = true
			setError(`Canvas not saved. ${message(e)}`)
			setSaveStatus('Not saved')
			setBlocked(true)
			editor.updateInstanceState({ isReadonly: true })
		}
		function saveSnapshot() {
			clearTimeout(timer)
			if (failed) return false
			try {
				revision.current = writeDocument(localStorage, projectId, getSnapshot(editor.store), revision.current)
				dirty = false
				setSaveStatus('Saved on this browser')
				return true
			} catch (e) {
				fail(e)
				return false
			}
		}
		function save() {
			if (failed) return false
			return !dirty || !!pendingRef.current || saveSnapshot()
		}
		function scheduleSave() {
			if (pendingRef.current || failed) return
			dirty = true
			setSaveStatus('Saving…')
			clearTimeout(timer)
			timer = setTimeout(save, 250)
		}

		flushRef.current = save
		persist.current = saveSnapshot
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
				if (after.typeName === 'camera') scheduleSave()
				if (after.typeName === 'instance' && before.typeName === 'instance' && after.currentPageId !== before.currentPageId) {
					updateSources()
					scheduleSave()
				}
			}
		}, { scope: 'session', source: 'all' })
		const storage = (e: StorageEvent) => {
			if (e.key !== documentKey(projectId) && e.key !== null) return
			fail(new Error('The saved canvas changed in another tab. Reload to use that version.'))
		}
		const visibility = () => { if (document.visibilityState === 'hidden') save() }
		const beforeUnload = (e: BeforeUnloadEvent) => {
			if (reloadRequested.current || save()) return
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
	}, [runtime, projectId])

	function propose() {
		if (!runtime || blocked || pendingRef.current || !flushRef.current()) return
		try {
			const proposal = planOrganization(runtime.port.read())
			pendingRef.current = proposal
			runtime.port.preview(proposal.ops, proposal.id)
			runtime.editor.updateInstanceState({ isReadonly: true })
			runtime.port.focus(sources.map((s) => s.id))
			setPending(proposal)
			setNotice('')
		} catch (err) {
			runtime.port.discard()
			pendingRef.current = null
			setError(message(err))
		}
	}

	function finish(accept: boolean) {
		if (!runtime || !pendingRef.current || blocked) return
		runtime.editor.updateInstanceState({ isReadonly: false })
		if (accept) runtime.port.commit()
		else runtime.port.discard()
		pendingRef.current = null
		setPending(null)
		if (!accept || persist.current()) {
			setNotice(accept ? 'Layout accepted. Use Undo on the canvas to reverse it.' : 'Proposal discarded.')
		}
	}

	function reload() {
		reloadRequested.current = true
		location.reload()
	}

	return { runtime, sources, pending, saveStatus, error, blocked, notice, onMount, propose, finish, reload, setError, flush: () => flushRef.current() }
}

function isSource(record: unknown): record is ArtifactShape {
	return !!record && typeof record === 'object' && 'type' in record && record.type === SHAPE.artifact
}
