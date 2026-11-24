import { lazy, Suspense, useEffect, useState } from 'react'
import { createProject, PROJECTS_KEY, readProjects, writeProjects, type Project } from './model'
import { ProjectHome } from './ProjectHome'
import { message } from './message'
import './workspace.css'

const ProjectCanvas = lazy(() => import('./ProjectCanvas'))

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

	if (active) return (
		<Suspense fallback={<main className="cc-route-loading" role="status">Opening canvas…</main>}>
			<ProjectCanvas key={active.id} project={active} onBack={() => open(null)} />
		</Suspense>
	)
	const cloudEnabled = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
	return <ProjectHome actions={cloudEnabled && <a className="cc-btn cc-btn--shell" href="?cloud=1">Cloud workspace</a>} projects={projects} error={error} onOpen={open} onCreate={(name, brief) => {
		const project = createProject(name, brief)
		const next = [project, ...readProjects(localStorage)]
		writeProjects(localStorage, next)
		setProjects(next)
		open(project)
	}} />
}
