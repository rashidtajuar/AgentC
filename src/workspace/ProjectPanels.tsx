import { useState, type FormEvent } from 'react'
import { ArrowUpRight, BotMessageSquare, ImagePlus, ListTree, Plus } from 'lucide-react'
import type { ArtifactShape } from '../canvas/shapes/types'
import type { ToolKind } from '../core/types'
import { SourceIcon } from '../ui/SourceIcon'
import { message } from './message'
import { SOURCE_TYPES, sourceShape, sourceUrl } from './model'
import type { useProjectCanvas } from './useProjectCanvas'

export function SourceList({ sources, onFocus }: {
	sources: ArtifactShape[]
	onFocus: (id: ArtifactShape['id']) => void
}) {
	return (
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
	)
}

function safeSourceHref(location: string) {
	try { return sourceUrl(location) } catch { return undefined }
}

export function ProjectTools({ hidden, assistant, brief, canvas, controls, onAdd }: {
	hidden: boolean
	assistant: boolean
	controls: React.ReactNode
	onAdd: () => void
	brief: string
	canvas: ReturnType<typeof useProjectCanvas>
}) {
	const { runtime, sources, pending, blocked, error, notice, setError, finish, propose, reload } = canvas
	const [name, setName] = useState('')
	const [url, setUrl] = useState('')
	const [tool, setTool] = useState<ToolKind>('doc')
	const [addingImages, setAddingImages] = useState(false)

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
			if (matchMedia('(pointer: coarse)').matches && document.activeElement instanceof HTMLInputElement) {
				document.activeElement.blur()
			}
			setName('')
			setUrl('')
			setError('')
		} catch (err) { setError(message(err)) }
	}

	return (
		<aside className="cc-ai" id="project-tools" aria-label={assistant ? 'Assistant' : 'Project tools'} hidden={hidden}>
			<div className="cc-workspace-panel-head">
				<h2>{assistant ? <><BotMessageSquare size={18} /> Assistant</> : 'Add to canvas'}</h2>{controls}
			</div>
			<div className="cc-workspace-panel">
				{error ? (
					<div className="cc-workspace-error" role="alert">
						{error}
						{blocked && canvas.recovery ? (
							<div className="cc-projects__actions">
								<button type="button" className="cc-btn cc-btn--shell" onClick={canvas.recovery.retry}>Retry save</button>
								<button type="button" className="cc-btn cc-btn--shell" onClick={canvas.recovery.download}>Download canvas data</button>
							</div>
						) : null}
						{blocked ? <button type="button" className="cc-btn cc-btn--shell" onClick={reload}>Reload saved version</button> : null}
					</div>
				) : null}
				<div className="cc-panel-stack" hidden={assistant}>
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
					<section>
						<h3>Images</h3>
						<label className="cc-media-picker cc-btn cc-btn--shell">
							<ImagePlus size={15} /> {addingImages ? 'Adding images…' : 'Add images'}
							<input type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/avif,image/bmp" multiple
								disabled={!runtime || !!pending || blocked || addingImages} onChange={async (event) => {
									const files = Array.from(event.currentTarget.files ?? [])
									event.currentTarget.value = ''
									if (!runtime || !files.length) return
									setAddingImages(true)
									setError('')
									try { await runtime.editor.putExternalContent({ type: 'files', files }) }
									catch (err) { setError(message(err)) }
									finally { setAddingImages(false) }
								}} />
						</label>
					</section>
				</div>
				<section className="cc-assistant" hidden={!assistant}>
					<div className="cc-assistant__message">
						<BotMessageSquare size={17} aria-hidden="true" />
						<div><strong>AgentC</strong><p>{sources.length ? 'I can group your sources by type so related references are easier to find.' : 'Pin a source to the canvas and I can suggest how to arrange your references.'}</p></div>
					</div>
					<p className="cc-workspace-hint">Layout suggestions use a local rule.</p>
					{!sources.length && <button type="button" className="cc-btn cc-btn--shell" onClick={onAdd}><Plus size={16} /> Add a source</button>}
					{pending ? (
						<section className="cc-proposal" aria-label="Proposal review">
							<strong>{pending.summary}</strong>
							<p className="cc-proposal__note">Moves cards on this canvas. Editing is paused during review.</p>
							<div className="cc-proposal__actions">
								<button type="button" className="cc-btn cc-btn--primary" disabled={blocked} onClick={() => finish(true)}>Accept layout</button>
								<button type="button" className="cc-btn cc-btn--ghost" disabled={blocked} onClick={() => finish(false)}>Discard</button>
							</div>
						</section>
					) : sources.length > 0 && <button type="button" className="cc-btn cc-btn--shell" disabled={!runtime || blocked} onClick={propose}><ListTree size={16} /> Propose organization</button>}
					{notice ? <p className="cc-workspace-hint" aria-live="polite">{notice}</p> : null}
				</section>
			</div>
		</aside>
	)
}
