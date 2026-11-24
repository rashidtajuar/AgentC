import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowLeft, CircleHelp, Network, X } from 'lucide-react'
import { atom, useValue, type Editor, type TLShape, type TLAssetStore, type TldrawProps } from 'tldraw'
import { Canvas } from '../canvas/Canvas'
import { CanvasAppearance, CanvasToolbar } from './CanvasToolbar'
import { BOARD_COLORS, hasConnection, isConnection, readView, viewKey, type BoardView } from './boardView'
import { PanelSizeControls } from './PanelSizeControls'
import { ProjectTools, SourceList } from './ProjectPanels'
import { LayersPanel } from './LayersPanel'
import { CanvasGuide, useCanvasGuide } from './CanvasGuide'
import { LoadingRows } from './WorkspaceLoading'
import { useProjectCanvas, type CanvasStorage } from './useProjectCanvas'
import type { Project } from './model'
import './projectCanvas.css'

const compactQuery = '(max-width: 900px), (hover: none) and (pointer: coarse)'
type Panels = { left: boolean; right: 'add' | 'assistant' | null }
const closed: Panels = { left: false, right: null }

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
	const [compact, setCompact] = useState(() => matchMedia(compactQuery).matches)
	const [panels, setPanels] = useState<Panels>(() => compact ? closed : { left: true, right: 'add' })
	const [leftTab, setLeftTab] = useState<'layers' | 'sources'>('sources')
	const [expanded, setExpanded] = useState(false)
	const lastPanels = useRef<Panels>({ left: true, right: 'add' })
	const guide = useCanvasGuide()
	useEffect(() => {
		const media = matchMedia(compactQuery)
		const change = () => {
			setCompact(media.matches)
			setExpanded(false)
			if (media.matches) setPanels(closed)
		}
		media.addEventListener('change', change)
		return () => media.removeEventListener('change', change)
	}, [])
	const [connectionNotice, setConnectionNotice] = useState('')
	useEffect(() => {
		if (!connectionNotice) return
		const timer = setTimeout(() => setConnectionNotice(''), 3500)
		return () => clearTimeout(timer)
	}, [connectionNotice])
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

	function toggleLayers() {
		if (panels.left && leftTab === 'sources') {
			setLeftTab('layers')
			return
		}
		setLeftTab('layers')
		setExpanded(false)
		setPanels((current) => ({ left: !current.left, right: compact && !current.left ? null : current.right }))
	}

	function toggleRight(panel: 'add' | 'assistant') {
		setExpanded(false)
		setPanels((current) => ({
			left: compact ? false : current.left,
			right: current.right === panel ? null : panel,
		}))
	}

	function toggleFocus() {
		if (panels.left || panels.right) {
			lastPanels.current = panels
			setPanels(closed)
		} else {
			setPanels(lastPanels.current)
		}
	}

	function locate(id: TLShape['id'], connection = false) {
		if (!editor) return
		if (connection && view.mode !== 'map') changeView({ ...view, mode: 'map' })
		if (compact) setPanels(closed)
		const select = () => {
			const bounds = editor.getShapePageBounds(id)
			if (!bounds) return
			editor.select(id)
			editor.zoomToBounds(bounds, { targetZoom: 1 })
		}
		if (compact) requestAnimationFrame(select)
		else select()
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
		<div className="cc-app cc-workspace" data-sources={panels.left} data-tools={panels.right !== null} data-expanded={expanded}>
			<header className="cc-topbar cc-projectbar">
				<div className="cc-projectbar__identity">
					<button type="button" className="cc-btn cc-btn--ghost cc-projectbar__back" aria-label="Projects" onClick={async () => { if (await canvas.flush()) onBack() }}>
						<ArrowLeft size={17} /><span>Projects</span>
					</button>
					<strong className="cc-workspace-title" title={project.name}>{project.name}</strong>
				</div>
				<CanvasToolbar view={view} onView={changeView} leftPanel={panels.left ? leftTab : null} toolsOpen={panels.right === 'add'} assistantOpen={panels.right === 'assistant'}
					onLayers={toggleLayers} onTools={() => toggleRight('add')} onAssistant={() => toggleRight('assistant')} onFocus={toggleFocus}
					canConnect={canConnect} onConnect={connect} />
				<div className="cc-projectbar__utilities">
					<span role="status" aria-label="Save status" className="cc-workspace-save">{canvas.saveStatus}</span>
					<CanvasAppearance view={view} onView={changeView} />
					<button type="button" className="cc-board-icon" id="canvas-guide-trigger" aria-label="Canvas guide" title="Canvas guide" onClick={guide.show}><CircleHelp size={18} /></button>
				</div>
			</header>
			<aside className="cc-sources cc-sidebar" id="project-layers" aria-label={leftTab === 'layers' ? 'Layers' : 'Sources'} hidden={!panels.left}>
				<div className="cc-workspace-panel-head">
					<div className="cc-panel-views" role="group" aria-label="Browse canvas">
						<button type="button" className="cc-btn" aria-pressed={leftTab === 'layers'} onClick={() => setLeftTab('layers')}>Layers</button>
						<button type="button" className="cc-btn" aria-pressed={leftTab === 'sources'} onClick={() => setLeftTab('sources')}>Sources</button>
					</div>
					<PanelSizeControls expanded={expanded} onResize={() => setExpanded(!expanded)} onClose={() => { setPanels({ ...panels, left: false }); setExpanded(false) }} name="layers and sources" />
				</div>
				{panels.left && (leftTab === 'layers'
					? editor ? <LayersPanel editor={editor} canEdit={!blocked && !pending} onLocate={locate} />
						: !blocked && <LoadingRows label="Loading layers" />
					: <SourceList sources={canvas.sources} onFocus={locate} />)}
			</aside>
			<main className="cc-canvas cc-project-canvas" aria-label="Canvas" data-view={view.mode}
				data-dotted={view.dotted} style={boardStyle}>
				<Canvas onMount={canvas.onMount} getShapeVisibility={getShapeVisibility} assets={assets} />
				{!count && runtime ? (
					<div className="cc-workspace-empty">
						<h2>Room to think.</h2>
						<p>Pin a source, add an image, or draw on the canvas.</p>
						{guide.hint && <div className="cc-workspace-empty__help">
							<button type="button" className="cc-board-tip" onClick={guide.show}><CircleHelp size={16} /> Take a quick tour</button>
							<button type="button" className="cc-board-tip" aria-label="Dismiss tour suggestion" onClick={guide.dismissHint}><X size={16} /></button>
						</div>}
					</div>
				) : null}
				{view.mode === 'map' && count > 0 && !pending ? (
					<p className="cc-map-hint">
						<Network size={14} />
						<span className="cc-map-hint__desktop">Shift-click two items, then connect them.</span>
						<span className="cc-map-hint__touch">Use the Arrow tool to connect items.</span>
					</p>
				) : null}
				{(pending ? panels.right !== 'assistant' : !panels.right && canvas.error && blocked) ? (
					<button type="button" className="cc-btn cc-btn--shell cc-canvas-recovery" onClick={() => toggleRight(pending ? 'assistant' : 'add')}>
						{pending ? 'Review pending layout' : 'See save details'}
					</button>
				) : null}
				<div className="cc-board-notice" role="status">{connectionNotice}</div>
			</main>
			<ProjectTools hidden={!panels.right} assistant={panels.right === 'assistant'} brief={project.brief} canvas={canvas} onAdd={() => toggleRight('add')}
				controls={<PanelSizeControls expanded={expanded} onResize={() => setExpanded(!expanded)}
					onClose={() => { if (panels.right) toggleRight(panels.right) }} name={panels.right === 'assistant' ? 'Assistant' : 'project tools'} />} />
			{guide.open && <CanvasGuide onClose={guide.close} />}
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
