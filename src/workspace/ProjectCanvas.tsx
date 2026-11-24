import { useCallback, useRef, useState, type CSSProperties } from 'react'
import { ArrowLeft, Network } from 'lucide-react'
import { atom, useValue, type Editor, type TLShape, type TLAssetStore, type TldrawProps } from 'tldraw'
import { Canvas } from '../canvas/Canvas'
import { CanvasToolbar } from './CanvasToolbar'
import { BOARD_COLORS, hasConnection, isConnection, readView, viewKey, type BoardView } from './boardView'
import { ProjectTools, SourcesPanel } from './ProjectPanels'
import { useProjectCanvas, type CanvasStorage } from './useProjectCanvas'
import type { Project } from './model'
import './projectCanvas.css'

const narrow = () => matchMedia('(max-width: 900px)').matches

export default function ProjectCanvas({ project, onBack, storage, assets }: {
	project: Project
	onBack: () => void
	storage?: CanvasStorage
	assets?: TLAssetStore
}) {
	const canvas = useProjectCanvas(project.id, storage)
	const { runtime, blocked, pending } = canvas
	const [view, setView] = useState(() => readView(project.id))
	const [mode] = useState(() => atom('project canvas view', view.mode))
	const [panels, setPanels] = useState(() => ({ sources: !narrow(), tools: true }))
	const lastPanels = useRef(panels)
	const [connectionNotice, setConnectionNotice] = useState('')
	const editor = runtime?.editor
	const selected = useValue('connectable selection', () => editor?.getSelectedShapes() ?? [], [editor])
	const count = useValue('canvas shape count', () => editor?.getCurrentPageShapeIds().size ?? 0, [editor])
	const canConnect = !!editor && !blocked && !pending && selected.length === 2 && selected.every((shape) => shape.type !== 'arrow')
	const getShapeVisibility = useCallback<NonNullable<TldrawProps['getShapeVisibility']>>(
		(shape, activeEditor) => mode.get() === 'moodboard' && isConnection(shape, activeEditor) ? 'hidden' : 'inherit',
		[mode]
	)

	function changeView(next: BoardView) {
		if (next.mode === 'moodboard' && editor) {
			const visible = editor.getSelectedShapes().filter((shape) => !isConnection(shape, editor))
			editor.setSelectedShapes(visible.map((shape) => shape.id))
		}
		mode.set(next.mode)
		setView(next)
		try { localStorage.setItem(viewKey(project.id), JSON.stringify(next)) }
		catch { setConnectionNotice('Appearance could not be saved for next time.') }
	}

	function togglePanel(panel: keyof typeof panels) {
		setPanels((current) => {
			const open = !current[panel]
			if (open && narrow()) return { sources: panel === 'sources', tools: panel === 'tools' }
			return { ...current, [panel]: open }
		})
	}

	function toggleFocus() {
		if (panels.sources || panels.tools) {
			lastPanels.current = panels
			setPanels({ sources: false, tools: false })
		} else {
			setPanels(narrow() && lastPanels.current.tools ? { sources: false, tools: true } : lastPanels.current)
		}
	}

	function connect() {
		if (!canConnect || !runtime) return
		const [a, b] = leftToRight(runtime.editor, selected)
		if (hasConnection(runtime.editor, a, b)) {
			setConnectionNotice('These items are already connected.')
			return
		}
		const id = crypto.randomUUID()
		runtime.port.apply([{ op: 'connect', id, from: a.id, to: b.id, kind: 'relates-to' }])
		setConnectionNotice(runtime.port.exists(id) ? 'Connection added.' : 'Could not add a connection to this canvas.')
	}

	const boardStyle = { '--cc-board-surface': BOARD_COLORS[view.color].value } as CSSProperties
	return (
		<div className="cc-app cc-workspace" data-sources={panels.sources} data-tools={panels.tools}>
			<header className="cc-topbar cc-projectbar">
				<div className="cc-projectbar__identity">
					<button type="button" className="cc-btn cc-btn--ghost" onClick={async () => { if (await canvas.flush()) onBack() }}>
						<ArrowLeft size={15} /> Projects
					</button>
					<strong className="cc-workspace-title" title={project.name}>{project.name}</strong>
				</div>
				<CanvasToolbar view={view} onView={changeView} sourcesOpen={panels.sources} toolsOpen={panels.tools}
					onSources={() => togglePanel('sources')} onTools={() => togglePanel('tools')} onFocus={toggleFocus}
					canConnect={canConnect} onConnect={connect} />
				<span role="status" aria-label="Save status" className="cc-workspace-save">{canvas.saveStatus}</span>
			</header>
			<SourcesPanel hidden={!panels.sources} sources={canvas.sources} onFocus={(id) => runtime?.port.focus([id])} />
			<main className="cc-canvas cc-project-canvas" aria-label="Canvas" data-view={view.mode}
				data-dotted={view.dotted} style={boardStyle}>
				<Canvas onMount={canvas.onMount} getShapeVisibility={getShapeVisibility} assets={assets} />
				{!count && runtime ? (
					<div className="cc-workspace-empty">
						<h2>Room to think.</h2>
						<p>Pin a source, add an image, or draw on the canvas.</p>
					</div>
				) : null}
				{view.mode === 'map' && count > 0 && !pending ? (
					<p className="cc-map-hint">
						<Network size={14} />
						<span className="cc-map-hint__desktop">Shift-click two items, then connect them.</span>
						<span className="cc-map-hint__touch">Use the Arrow tool to connect items.</span>
					</p>
				) : null}
				{!panels.tools && (pending || (canvas.error && blocked)) ? (
					<button type="button" className="cc-btn cc-btn--shell cc-canvas-recovery" onClick={() => togglePanel('tools')}>
						{pending ? 'Review pending layout' : 'See save details'}
					</button>
				) : null}
				<span className="cc-sr" aria-live="polite">{connectionNotice}</span>
			</main>
			<ProjectTools hidden={!panels.tools} brief={project.brief} canvas={canvas} cloud={!!storage} />
		</div>
	)
}

function leftToRight(editor: Editor, shapes: TLShape[]) {
	return [...shapes].sort((a, b) => {
		const aBox = editor.getShapePageBounds(a)
		const bBox = editor.getShapePageBounds(b)
		return (aBox?.midX ?? a.x) - (bBox?.midX ?? b.x) || (aBox?.midY ?? a.y) - (bBox?.midY ?? b.y)
	})
}
