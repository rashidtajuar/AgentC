import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowUpRight, Plus, LayoutGrid } from 'lucide-react'
import { getSnapshot, loadSnapshot, type Editor } from 'tldraw'
import { Canvas } from '../canvas/Canvas'
import { CC_EVENTS } from '../canvas/canvasUi'
import type { CanvasPort } from '../canvas/port'
import { createTldrawPort } from '../canvas/tldrawPort'
import type { ActionProposal, BoardShape, ToolKind } from '../core/types'
import { createProject, documentKey, planOrganization, PROJECTS_KEY, readDocument, readProjects, sourceShape, sourceUrl, writeDocument, writeProjects, type Project } from './model'
import './workspace.css'

const message = (e: unknown) => e instanceof Error ? e.message : 'Something went wrong. Your saved data has been kept.'

export function Workspace() {
	const [initial] = useState(() => {
		try {
			const projects = readProjects(localStorage)
			const id = new URLSearchParams(location.search).get('project')
			return { projects, active: projects.find((p) => p.id === id) ?? null, error: '' }
		} catch (e) { return { projects: [], active: null, error: message(e) } }
	})
	const [projects, setProjects] = useState<Project[]>(initial.projects)
	const [active, setActive] = useState<Project | null>(initial.active)
	const [error, setError] = useState(initial.error)

	useEffect(() => {
		const refresh = () => {
			try {
				const list = readProjects(localStorage)
				setProjects(list)
				setError('')
				return list
			} catch (e) { setError(message(e)); return [] }
		}
		const storage = (e: StorageEvent) => { if (e.key === PROJECTS_KEY) refresh() }
		window.addEventListener('storage', storage)
		return () => window.removeEventListener('storage', storage)
	}, [])

	function open(project: Project | null) {
		setActive(project)
		// Replace keeps browser back navigation from remounting a stale canvas instance.
		history.replaceState(null, '', project ? `?project=${encodeURIComponent(project.id)}` : location.pathname)
	}

	if (active) return <ProjectCanvas key={active.id} project={active} onBack={() => open(null)} />
	return <ProjectHome projects={projects} error={error} onOpen={open} onCreate={(name, brief) => {
		const project = createProject(name, brief)
		const next = [project, ...readProjects(localStorage)]
		writeProjects(localStorage, next)
		setProjects(next)
		open(project)
	}} />
}

function ProjectHome({ projects, error, onOpen, onCreate }: { projects: Project[]; error: string; onOpen: (p: Project) => void; onCreate: (name: string, brief: string) => void }) {
	const [name, setName] = useState('')
	const [brief, setBrief] = useState('')
	const [formError, setFormError] = useState('')
	return (
		<main className="cc-projects">
			<header className="cc-projects__header"><span className="cc-workspace-brand">AgentC <span>Connected Canvas</span></span><a className="cc-btn cc-btn--shell" href="?demo=1">Explore the sample <ArrowUpRight size={14} /></a></header>
			<div className="cc-projects__intro"><h1>Your work, connected.</h1><p>A place for the brief, the references, and what comes next.<br />Start with a canvas. Keep the originals in reach.</p></div>
			{error ? <p role="alert" className="cc-workspace-error">{error}</p> : null}
			<div className="cc-projects__body">
				<section className="cc-projects__new" aria-labelledby="new-project"><h2 id="new-project">Start a project</h2><form onSubmit={(e) => { e.preventDefault(); try { onCreate(name, brief) } catch (err) { setFormError(message(err)) } }}>
					<label htmlFor="project-name">Project name</label><input id="project-name" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder="e.g. Studio website" required />
					<label htmlFor="project-brief">Project brief <span>Optional</span></label><textarea id="project-brief" value={brief} maxLength={2000} onChange={(e) => setBrief(e.target.value)} placeholder="What are you making, and who is it for?" rows={4} />
					{formError ? <p role="alert" className="cc-workspace-error">{formError}</p> : null}
					<button className="cc-btn cc-btn--primary" disabled={!!error}><Plus size={16} /> Create project</button>
				</form></section>
				<section className="cc-projects__list" aria-labelledby="your-projects"><h2 id="your-projects">Your projects <span>{projects.length}</span></h2>
					{projects.length ? <ul>{projects.map((p) => <li key={p.id}><button onClick={() => onOpen(p)} aria-label={`Open ${p.name}`}><LayoutGrid size={20} /><span><strong>{p.name}</strong><small>{p.brief || 'An open canvas, ready for your ideas.'}</small></span><ArrowUpRight size={16} /></button></li>)}</ul> : <div className="cc-projects__empty"><LayoutGrid size={28} /><p>A fresh wall for your next idea.</p><span>Your projects will appear here.</span></div>}
				</section>
			</div>
			<footer className="cc-projects__footer">Saved in this browser only. No account, cloud sync, or connected tool access yet.</footer>
		</main>
	)
}

function ProjectCanvas({ project, onBack }: { project: Project; onBack: () => void }) {
	const [runtime, setRuntime] = useState<{ editor: Editor; port: CanvasPort } | null>(null)
	const [sources, setSources] = useState<BoardShape[]>([])
	const [pending, setPending] = useState<ActionProposal | null>(null)
	const pendingRef = useRef<ActionProposal | null>(null)
	const [saveStatus, setSaveStatus] = useState('Opening canvas…')
	const [error, setError] = useState('')
	const [blocked, setBlocked] = useState(false)
	const revision = useRef<string | null>(null)
	const flushRef = useRef<() => boolean>(() => true)
	const [name, setName] = useState('')
	const [url, setUrl] = useState('')
	const [tool, setTool] = useState<ToolKind>('doc')
	const [notice, setNotice] = useState('')

	const onMount = useCallback((editor: Editor) => {
		editor.user.updateUserPreferences({ colorScheme: 'light' })
		editor.updateInstanceState({ isGridMode: false })
		try {
			const saved = readDocument(localStorage, project.id)
			if (saved) loadSnapshot(editor.store, saved.snapshot as Parameters<typeof loadSnapshot>[1])
			revision.current = saved?.revision ?? null
			setRuntime({ editor, port: createTldrawPort(editor) })
			setSaveStatus('Saved on this browser')
		} catch (e) { editor.updateInstanceState({ isReadonly: true }); setBlocked(true); setError(message(e)); setSaveStatus('Could not open saved canvas') }
	}, [project.id])

	useEffect(() => {
		if (!runtime) return
		const { editor, port } = runtime
		let timer: ReturnType<typeof setTimeout> | undefined
		let dirty = false
		let failed = false
		function fail(e: unknown) {
			failed = true
			setError(`Canvas not saved. ${message(e)}`)
			setSaveStatus('Not saved')
			setBlocked(true)
			editor.updateInstanceState({ isReadonly: true })
		}
		function save() {
			clearTimeout(timer)
			if (failed) return false
			if (pendingRef.current || !dirty) return true
			try {
				revision.current = writeDocument(localStorage, project.id, getSnapshot(editor.store), revision.current)
				dirty = false
				setSaveStatus('Saved on this browser')
				return true
			} catch (e) { fail(e); return false }
		}
		flushRef.current = save
		const update = () => setSources(port.read().shapes.filter((s) => s.type === 'artifact'))
		update()
		const scheduleSave = () => {
			if (pendingRef.current || failed) return
			dirty = true
			setSaveStatus('Saving…')
			clearTimeout(timer)
			timer = setTimeout(save, 250)
		}
		const stopSources = editor.store.listen(() => { update(); scheduleSave() }, { scope: 'document', source: 'all' })
		const stop = editor.store.listen(({ changes }) => {
			if (Object.values(changes.updated).some(([before, after]) => after.typeName === 'camera' ||
				(after.typeName === 'instance' && before.typeName === 'instance' && after.currentPageId !== before.currentPageId))) scheduleSave()
		}, { scope: 'session', source: 'all' })
		const storage = (e: StorageEvent) => { if (e.key === documentKey(project.id) || e.key === null) fail(new Error('The saved canvas changed in another tab. Reload to use that version.')) }
		const visibility = () => { if (document.visibilityState === 'hidden') save() }
		const beforeUnload = (e: BeforeUnloadEvent) => { if (!save()) { e.preventDefault(); e.returnValue = '' } }
		const openSource = (e: Event) => {
			const id = (e as CustomEvent<{ boardId?: string }>).detail?.boardId
			const shape = port.read().shapes.find((s) => s.id === id && s.type === 'artifact')
			if (shape) { try { window.open(sourceUrl(String(shape.props.location)), '_blank', 'noopener,noreferrer') } catch (err) { setError(message(err)) } }
		}
		window.addEventListener('storage', storage)
		window.addEventListener('beforeunload', beforeUnload)
		document.addEventListener('visibilitychange', visibility)
		window.addEventListener(CC_EVENTS.openArtifact, openSource)
		return () => {
			stop()
			stopSources()
			save()
			clearTimeout(timer)
			window.removeEventListener('storage', storage)
			window.removeEventListener('beforeunload', beforeUnload)
			document.removeEventListener('visibilitychange', visibility)
			window.removeEventListener(CC_EVENTS.openArtifact, openSource)
		}
	}, [runtime, project.id])

	function finish(accept: boolean) {
		if (!runtime || !pendingRef.current || blocked) return
		// Keep preview mutations out of persistence until the entire transaction has settled.
		runtime.editor.updateInstanceState({ isReadonly: false })
		if (accept) runtime.port.commit()
		else runtime.port.discard()
		pendingRef.current = null
		setPending(null)
		// Document listeners observe the commit synchronously while the guard is set.
		try {
			revision.current = writeDocument(localStorage, project.id, getSnapshot(runtime.editor.store), revision.current)
			setSaveStatus('Saved on this browser')
			setNotice(accept ? 'Layout accepted. Use the canvas Undo control to reverse it.' : 'Proposal discarded. Your canvas is unchanged.')
		} catch (e) { setError(message(e)); setSaveStatus('Not saved'); setBlocked(true); runtime.editor.updateInstanceState({ isReadonly: true }) }
	}

	return <div className="cc-app cc-workspace">
		<header className="cc-topbar"><button className="cc-btn cc-btn--ghost" onClick={() => { if (flushRef.current()) onBack() }}><ArrowLeft size={15} /> Projects</button><span className="cc-topbar__sep" /><strong className="cc-workspace-title">{project.name}</strong><div className="cc-topbar__right"><span role="status" aria-label="Save status" className="cc-workspace-save">{saveStatus}</span><span className="cc-tag">Local workspace</span></div></header>
		<aside className="cc-sources" aria-label="Sources"><div className="cc-panel-head"><h2 className="cc-panel-title">Sources</h2><span className="cc-panel-count">{sources.length}</span></div><div className="cc-sources__scroll">
			{sources.length ? <ul className="cc-workspace-sources">{sources.map((s) => <li key={s.id}><button onClick={() => runtime?.port.focus([s.id])}>{String(s.props.name)}</button><a href={sourceUrl(String(s.props.location))} target="_blank" rel="noopener noreferrer" aria-label={`Open ${s.props.name}`}><ArrowUpRight size={15} /></a><small>Link only · not synced</small></li>)}</ul> : <p className="cc-workspace-hint">Pin your first source using the form on the right.</p>}
		</div><div className="cc-tools"><p className="cc-workspace-hint">Originals stay in their tools. Links open in a new tab. No source content is read.</p></div></aside>
		<main className="cc-canvas" aria-label="Canvas"><Canvas onMount={onMount} />{!sources.length && runtime ? <div className="cc-workspace-empty"><h2>Room to think.</h2><p>Add a source, drop an image, or pick a drawing tool below.</p></div> : null}</main>
		<aside className="cc-ai" aria-label="Project tools"><div className="cc-panel-head"><h2 className="cc-panel-title">Make the connections.</h2><span className="cc-ai__scope">A project starts with a little context.</span></div><div className="cc-workspace-panel">
			{error ? <div className="cc-workspace-error" role="alert">{error}{blocked ? <button className="cc-btn cc-btn--shell" onClick={() => location.reload()}>Reload saved version</button> : null}</div> : null}
			{project.brief ? <section><h3>The brief</h3><p className="cc-workspace-brief">{project.brief}</p></section> : null}
			<section><h3>Pin a source</h3><form onSubmit={(e) => {
				e.preventDefault()
				if (!runtime || pendingRef.current || blocked) return
				try {
					const shape = sourceShape(name, url, tool, sources.length)
					runtime.port.apply([{ op: 'createShape', shape }, { op: 'setStatus', id: shape.id, dot: 'changed' }])
					runtime.port.focus([shape.id])
					setName(''); setUrl(''); setError('')
				} catch (err) { setError(message(err)) }
			}}><fieldset disabled={!runtime || !!pending || blocked}>
				<label htmlFor="source-name">Source name</label><input id="source-name" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Website research" required />
				<label htmlFor="source-url">Source URL</label><input id="source-url" type="url" maxLength={2048} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" required />
				<label htmlFor="source-type">Source type</label><select id="source-type" value={tool} onChange={(e) => setTool(e.target.value as ToolKind)}><option value="doc">Document / web link</option><option value="figma">Figma</option><option value="repo">Repository / code</option><option value="image">Image reference</option></select>
				<button className="cc-btn cc-btn--shell"><Plus size={15} /> Add source</button>
			</fieldset></form></section>
			<section className="cc-workspace-planner"><h3>Organize together</h3><p>Preview a layout grouped by source type. You decide what stays.</p><p className="cc-workspace-hint">Suggestions use a local layout rule. Live AI and external actions aren’t connected yet.</p>
				{pending ? <section className="cc-proposal" aria-label="Proposal review"><strong>{pending.summary}</strong><p className="cc-proposal__note">Canvas positions only. Source files stay untouched. Editing is paused during review.</p><div className="cc-proposal__actions"><button className="cc-btn cc-btn--primary" disabled={blocked} onClick={() => finish(true)}>Accept layout</button><button className="cc-btn cc-btn--ghost" disabled={blocked} onClick={() => finish(false)}>Discard</button></div></section> : <button className="cc-btn cc-btn--shell" disabled={!runtime || !sources.length || blocked} onClick={() => {
					if (!runtime || !flushRef.current()) return
					try {
						const proposal = planOrganization(runtime.port.read())
						pendingRef.current = proposal
						setPending(proposal)
						runtime.port.preview(proposal.ops, proposal.id)
						runtime.editor.updateInstanceState({ isReadonly: true })
						runtime.port.focus(sources.map((s) => s.id))
						setNotice('')
					} catch (err) { pendingRef.current = null; setPending(null); setError(message(err)) }
				}}>Propose organization</button>}
				{notice ? <p className="cc-workspace-hint" aria-live="polite">{notice}</p> : null}
			</section>
			<p className="cc-workspace-hint">Stored on this browser and device. Team collaboration and live AI aren’t connected yet.</p>
		</div></aside>
	</div>
}
