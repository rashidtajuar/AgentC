import { useState, type FormEvent } from 'react'
import { ArrowUpRight, Plus } from 'lucide-react'
import type { ArtifactShape } from '../canvas/shapes/types'
import type { ToolKind } from '../core/types'
import { SourceIcon } from '../ui/SourceIcon'
import { message } from './message'
import { SOURCE_TYPES, sourceShape, sourceUrl } from './model'
import type { useProjectCanvas } from './useProjectCanvas'

export function SourcesPanel({ hidden, sources, onFocus }: {
	hidden: boolean
	sources: ArtifactShape[]
	onFocus: (id: string) => void
}) {
	return (
		<aside className="cc-sources" id="project-sources" aria-label="Sources" hidden={hidden}>
			<div className="cc-panel-head">
				<h2 className="cc-panel-title">Sources</h2>
				<span className="cc-panel-count">{sources.length}</span>
			</div>
			<div className="cc-sources__scroll">
				{sources.length ? (
					<ul className="cc-workspace-sources">
						{sources.map(({ id, props }) => {
							const href = safeSourceHref(props.location)
							return (
								<li key={id}>
									<button type="button" onClick={() => onFocus(id)} title={props.name}>
										<SourceIcon tool={props.tool} location={props.location} />
										<span>{props.name}</span>
									</button>
									{href ? <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${props.name}`}><ArrowUpRight size={15} /></a> : null}
									<small>{SOURCE_TYPES[props.tool as ToolKind] ?? 'Source'} · {href ? 'Link only' : 'Invalid link'}</small>
								</li>
							)
						})}
					</ul>
				) : <p className="cc-workspace-hint">Pin a source to find it here.</p>}
			</div>
		</aside>
	)
}

function safeSourceHref(location: string) {
	try { return sourceUrl(location) } catch { return undefined }
}

export function ProjectTools({ hidden, brief, canvas }: {
	hidden: boolean
	brief: string
	canvas: ReturnType<typeof useProjectCanvas>
}) {
	const { runtime, sources, pending, blocked, error, notice, setError, finish, propose, reload } = canvas
	const [name, setName] = useState('')
	const [url, setUrl] = useState('')
	const [tool, setTool] = useState<ToolKind>('doc')

	function addSource(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		if (!runtime || pending || blocked) return
		try {
			const shape = sourceShape(name, url, tool, sources.length)
			const viewport = runtime.editor.getViewportPageBounds()
			const existing = runtime.editor.getCurrentPageShapes()
				.filter((item) => item.type !== 'arrow')
				.map((item) => runtime.editor.getShapePageBounds(item))
			shape.x = viewport.midX - 140
			shape.y = viewport.midY - 88
			while (existing.some((box) => box && box.maxX + 16 > shape.x && box.minX - 16 < shape.x + 280 &&
				box.maxY + 16 > shape.y && box.minY - 16 < shape.y + 176)) shape.y += 200
			runtime.port.apply([{ op: 'createShape', shape }, { op: 'setStatus', id: shape.id, dot: 'changed' }])
			if (!runtime.port.exists(shape.id)) throw new Error('This canvas is full. Remove an item before adding another.')
			runtime.port.focus([shape.id])
			setName('')
			setUrl('')
			setError('')
		} catch (err) { setError(message(err)) }
	}

	return (
		<aside className="cc-ai" id="project-tools" aria-label="Project tools" hidden={hidden}>
			<div className="cc-panel-head"><h2 className="cc-panel-title">Project tools</h2></div>
			<div className="cc-workspace-panel">
				{error ? (
					<div className="cc-workspace-error" role="alert">
						{error}
						{blocked ? <button type="button" className="cc-btn cc-btn--shell" onClick={reload}>Reload saved version</button> : null}
					</div>
				) : null}
				{brief ? <section><h3>The brief</h3><p className="cc-workspace-brief">{brief}</p></section> : null}
				<section>
					<h3>Pin a source</h3>
					<form onSubmit={addSource}>
						<fieldset disabled={!runtime || !!pending || blocked}>
							<label htmlFor="source-name">Source name</label>
							<input id="source-name" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Website research" required />
							<label htmlFor="source-url">Source URL</label>
							<input id="source-url" type="url" maxLength={2048} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" required />
							<label htmlFor="source-type">Source type</label>
							<select id="source-type" value={tool} onChange={(e) => setTool(e.target.value as ToolKind)}>
								{Object.entries(SOURCE_TYPES).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
							</select>
							<button className="cc-btn cc-btn--shell"><Plus size={15} /> Add source</button>
						</fieldset>
					</form>
				</section>
				<section className="cc-workspace-planner">
					<h3>Organize sources</h3>
					<p>Preview a layout grouped by source type.</p>
					{pending ? (
						<section className="cc-proposal" aria-label="Proposal review">
							<strong>{pending.summary}</strong>
							<p className="cc-proposal__note">Moves cards on this canvas. Editing is paused during review.</p>
							<div className="cc-proposal__actions">
								<button type="button" className="cc-btn cc-btn--primary" disabled={blocked} onClick={() => finish(true)}>Accept layout</button>
								<button type="button" className="cc-btn cc-btn--ghost" disabled={blocked} onClick={() => finish(false)}>Discard</button>
							</div>
						</section>
					) : <button type="button" className="cc-btn cc-btn--shell" disabled={!runtime || !sources.length || blocked} onClick={propose}>Propose organization</button>}
					{notice ? <p className="cc-workspace-hint" aria-live="polite">{notice}</p> : null}
				</section>
				<p className="cc-workspace-hint">Saved in this browser. Layout suggestions use a local rule.</p>
			</div>
		</aside>
	)
}
