import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { LoadingRows, WorkspaceLoading } from '../workspace/WorkspaceLoading'
import { ProjectHome } from '../workspace/ProjectHome'
import { message } from '../workspace/message'
import { createProject, readDocument, readProjects, type Project } from '../workspace/model'
import { createCloudProject, getCloudClient, listCloudProjects, openCloudProject } from './client'

const ProjectCanvas = lazy(() => import('../workspace/ProjectCanvas'))

export default function CloudWorkspace() {
	const [client] = useState(getCloudClient)
	const [session, setSession] = useState<Session | null>()
	useEffect(() => {
		if (!client) return
		const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => setSession(session))
		return () => subscription.unsubscribe()
	}, [client])

	if (!client) return <CloudEntry><p>Cloud projects are unavailable on this deployment.</p></CloudEntry>
	if (session === undefined) return <CloudEntry><LoadingRows label="Checking your session…" /></CloudEntry>
	if (!session) return <SignIn client={client} />
	return <CloudProjects key={session.user.id} client={client} userId={session.user.id} />
}

function CloudEntry({ children }: { children: React.ReactNode }) {
	return <main className="cc-projects">
		<header className="cc-projects__header">
			<span className="cc-workspace-brand">AgentC <span>Connected Canvas</span></span>
			<a className="cc-btn cc-btn--shell" href={location.pathname}>Browser projects</a>
		</header>
		<div className="cc-projects__intro"><h1>Cloud workspace</h1><p>Open your projects on any device.</p></div>
		<section className="cc-cloud-entry">{children}</section>
	</main>
}

function SignIn({ client }: { client: SupabaseClient }) {
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState('')
	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const values = new FormData(event.currentTarget)
		setBusy(true)
		setError('')
		try {
			const { error } = await client.auth.signInWithPassword({
				email: String(values.get('email')).trim(), password: String(values.get('password')),
			})
			if (error) setError('Could not sign in. Check your email, password, and connection.')
		} catch {
			setError('Could not reach the sign-in service. Try again.')
		} finally { setBusy(false) }
	}

	return <CloudEntry>
		<h2>Sign in</h2>
		<form onSubmit={submit}>
			<label htmlFor="cloud-email">Email</label>
			<input id="cloud-email" name="email" type="email" autoComplete="username" required />
			<label htmlFor="cloud-password">Password</label>
			<input id="cloud-password" name="password" type="password" autoComplete="current-password" required />
			{error && <p role="alert" className="cc-workspace-error">{error}</p>}
			<button className="cc-btn cc-btn--primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
		</form>
	</CloudEntry>
}

function CloudProjects({ client, userId }: { client: SupabaseClient; userId: string }) {
	const [projectId, setProjectId] = useState(() => new URLSearchParams(location.search).get('project'))
	const [opened, setOpened] = useState<Awaited<ReturnType<typeof openCloudProject>> | null>(null)
	const [projects, setProjects] = useState<Project[]>([])
	const [error, setError] = useState('')
	const [openError, setOpenError] = useState('')
	const [actionError, setActionError] = useState('')
	const [importing, setImporting] = useState(false)
	const [loading, setLoading] = useState(true)
	const [refresh, setRefresh] = useState(0)
	const [local] = useState(() => {
		try { return { projects: readProjects(localStorage), error: '' } }
		catch (err) { return { projects: [], error: message(err) } }
	})

	useEffect(() => {
		let active = true
		void listCloudProjects(client).then(
			(list) => { if (active) { setProjects(list); setLoading(false) } },
			(err) => { if (active) { setError(message(err)); setLoading(false) } },
		)
		return () => { active = false }
	}, [client, refresh])

	useEffect(() => {
		if (!projectId) return
		let active = true
		void openCloudProject(client, userId, projectId).then(
			(result) => { if (active) setOpened(result) },
			(err) => { if (active) setOpenError(message(err)) },
		)
		return () => { active = false }
	}, [client, userId, projectId])

	function open(id: string | null) {
		setOpened(null)
		setOpenError('')
		setProjectId(id)
		history.replaceState(null, '', id ? `?cloud=1&project=${encodeURIComponent(id)}` : '?cloud=1')
	}

	async function saveProject(project: Project, snapshot: unknown) {
		const saved = await createCloudProject(client, userId, project, snapshot)
		setProjects((previous) => previous.some((item) => item.id === saved.id) ? previous : [saved, ...previous])
		open(saved.id)
	}

	async function importLocal(project: Project) {
		setImporting(true)
		setActionError('')
		try {
			await saveProject(project, readDocument(localStorage, project.id)?.snapshot ?? null)
		} catch (err) { setActionError(message(err)) }
		finally { setImporting(false) }
	}

	async function signOut() {
		setActionError('')
		try {
			const { error } = await client.auth.signOut({ scope: 'local' })
			if (error) throw error
		} catch { setActionError('Could not sign out. Try again.') }
	}

	if (projectId) {
		if (openError) return <CloudEntry>
			<p role="alert" className="cc-workspace-error">{openError}</p>
			<button className="cc-btn cc-btn--shell" onClick={() => open(null)}>Back to cloud projects</button>
		</CloudEntry>
		if (!opened) return <WorkspaceLoading canvas label="Loading project…" />
		return <Suspense fallback={<WorkspaceLoading canvas label="Opening canvas…" />}>
			<ProjectCanvas key={opened.project.id} {...opened} onBack={() => open(null)} />
		</Suspense>
	}

	return <ProjectHome projects={projects} loading={loading} error={error} onOpen={(project) => open(project.id)}
		onCreate={async (name, brief) => saveProject(createProject(name, brief), null)}
		footer="Cloud projects are private to your account."
		actions={<>
			<a className="cc-btn cc-btn--shell" href={location.pathname}>Browser projects</a>
			<button className="cc-btn cc-btn--shell" onClick={signOut}>Sign out</button>
		</>}>
		{error && <button className="cc-btn cc-btn--shell" onClick={() => { setError(''); setLoading(true); setRefresh(refresh + 1) }}>
			Retry loading projects
		</button>}
		{(actionError || local.error) && <p role="alert" className="cc-workspace-error">{actionError || local.error}</p>}
		{local.projects.length > 0 && <section className="cc-projects__imports">
			<h2>Import a browser project</h2>
			<p>Import copies the canvas and its media. Your browser copy stays available.</p>
			<ul>{local.projects.map((project) => <li key={project.id}>
				<button className="cc-btn cc-btn--shell" disabled={importing} onClick={() => importLocal(project)}>
					{projects.some((item) => item.id === project.id) ? 'Open cloud copy of' : 'Import'} {project.name}
				</button>
			</li>)}</ul>
			{importing && <p role="status">Importing project…</p>}
		</section>}
	</ProjectHome>
}
