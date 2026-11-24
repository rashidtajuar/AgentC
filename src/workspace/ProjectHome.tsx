import { useState, type ReactNode } from 'react'
import { ArrowUpRight, LayoutGrid, Plus } from 'lucide-react'
import type { Project } from './model'
import { LoadingRows } from './WorkspaceLoading'
import { message } from './message'

export function ProjectHome({ projects, error, onOpen, onCreate, actions, footer, children, loading }: {
	projects: Project[]
	error: string
	onOpen: (p: Project) => void
	onCreate: (name: string, brief: string) => void | Promise<void>
	actions?: ReactNode
	footer?: string
	loading?: boolean
	children?: ReactNode
}) {
	const [name, setName] = useState('')
	const [brief, setBrief] = useState('')
	const [formError, setFormError] = useState('')
	const [creating, setCreating] = useState(false)
	return (
		<main className="cc-projects">
			<header className="cc-projects__header"><span className="cc-workspace-brand">AgentC <span>Connected Canvas</span></span><div className="cc-projects__actions">{actions}<a className="cc-btn cc-btn--shell" href="?demo=1">Explore the sample <ArrowUpRight size={14} /></a></div></header>
			<div className="cc-projects__intro"><h1>Your work, connected.</h1><p>A place for the brief, the references, and what comes next.<br />Start with a canvas. Keep the originals in reach.</p></div>
			{error ? <p role="alert" className="cc-workspace-error">{error}</p> : null}
			<div className="cc-projects__body">
				<section className="cc-projects__new" aria-labelledby="new-project"><h2 id="new-project">Start a project</h2><form onSubmit={async (e) => {
					e.preventDefault()
					setFormError('')
					setCreating(true)
					try { await onCreate(name, brief) }
					catch (err) { setFormError(message(err)) }
					finally { setCreating(false) }
				}}>
					<label htmlFor="project-name">Project name</label><input id="project-name" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder="e.g. Studio website" required />
					<label htmlFor="project-brief">Project brief <span>Optional</span></label><textarea id="project-brief" value={brief} maxLength={2000} onChange={(e) => setBrief(e.target.value)} placeholder="What are you making, and who is it for?" rows={4} />
					{formError ? <p role="alert" className="cc-workspace-error">{formError}</p> : null}
					<button className="cc-btn cc-btn--primary" disabled={creating || !!error}><Plus size={16} /> {creating ? 'Creating…' : 'Create project'}</button>
				</form></section>
				<section className="cc-projects__list" aria-labelledby="your-projects"><h2 id="your-projects">Your projects {!loading && <span>{projects.length}</span>}</h2>
					{loading ? <LoadingRows label="Loading projects…" /> : projects.length ? <ul>{projects.map((p) => <li key={p.id}><button onClick={() => onOpen(p)} aria-label={`Open ${p.name}`}><LayoutGrid size={20} /><span><strong>{p.name}</strong><small>{p.brief || 'An open canvas, ready for your ideas.'}</small></span><ArrowUpRight size={16} /></button></li>)}</ul> : <div className="cc-projects__empty"><LayoutGrid size={28} /><p>A fresh wall for your next idea.</p><span>Your projects will appear here.</span></div>}
				</section>
			</div>
			{children}
			<footer className="cc-projects__footer">{footer ?? 'Projects here are saved in this browser.'}</footer>
		</main>
	)
}
