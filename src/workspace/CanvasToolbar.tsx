import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Blend, BotMessageSquare, ChevronDown, CircleHelp, Ellipsis, LayoutGrid, Layers, Link2, Maximize, Minimize, Network, Plus } from 'lucide-react'
import { BOARD_COLORS, type BoardView } from './boardView'

interface Props {
	compact: boolean
	view: BoardView
	onView: (view: BoardView) => void
	leftPanel: 'layers' | 'sources' | null
	toolsOpen: boolean
	onLayers: () => void
	assistantOpen: boolean
	onAssistant: () => void
	onTools: () => void
	onFocus: () => void
	canConnect: boolean
	onConnect: () => void
}

export function CanvasToolbar({ compact, view, onView, leftPanel, toolsOpen, assistantOpen, onLayers, onTools, onAssistant, onFocus, canConnect, onConnect }: Props) {
	const focused = !leftPanel && !toolsOpen && !assistantOpen
	const FocusIcon = focused ? Minimize : Maximize
	const panels = <>
		<PanelToggle label="Layers" id="project-layers" open={leftPanel === 'layers'} onClick={onLayers} caption="Layers"><Layers size={18} /></PanelToggle>
		<PanelToggle label="Project tools" id="project-tools" open={toolsOpen} onClick={onTools} caption="Add"><Plus size={19} /></PanelToggle>
		<PanelToggle label="Assistant" id="project-tools" open={assistantOpen} onClick={onAssistant} caption="Assist"><BotMessageSquare size={18} /></PanelToggle>
	</>

	if (compact) {
		const name = view.mode === 'map' ? 'Node map' : 'Moodboard'
		const ViewIcon = view.mode === 'map' ? Network : LayoutGrid
		return <div className="cc-mobile-dock cc-board-dock" role="group" aria-label="Canvas controls">
			<ToolbarPopover label={`Canvas view: ${name}`} buttonClass="cc-dock-picker" placement="above"
				trigger={<><span><ViewIcon size={17} />{name}</span><ChevronDown size={14} /></>}>
				{(close) => <div className="cc-toolbar-choices" role="group" aria-label="Canvas view">
					<button type="button" className="cc-toolbar-choice" aria-pressed={view.mode === 'moodboard'} onClick={() => { onView({ ...view, mode: 'moodboard' }); close() }}>
						<LayoutGrid size={17} /> Moodboard
					</button>
					<button type="button" className="cc-toolbar-choice" aria-pressed={view.mode === 'map'} onClick={() => { onView({ ...view, mode: 'map' }); close() }}>
						<Network size={17} /> Node map
					</button>
				</div>}
			</ToolbarPopover>
			{panels}
		</div>
	}

	return <div className="cc-board-controls" aria-label="Canvas controls">
		<div className="cc-view-switch" role="group" aria-label="Canvas view">
			<button type="button" aria-pressed={view.mode === 'moodboard'} onClick={() => onView({ ...view, mode: 'moodboard' })}>
				<LayoutGrid size={15} /> Moodboard
			</button>
			<button type="button" aria-pressed={view.mode === 'map'} onClick={() => onView({ ...view, mode: 'map' })}>
				<Network size={15} /> Node map
			</button>
		</div>
		<div className="cc-board-actions" role="group" aria-label="Canvas layout">
			{view.mode === 'map' && <button type="button" className="cc-board-icon" aria-label="Connect selected items"
				title="Connect selected items · Shift-click two items" disabled={!canConnect} onClick={onConnect}>
				<Link2 size={17} />
			</button>}
			{panels}
			<button type="button" className="cc-board-icon" aria-label={focused ? 'Restore panels' : 'Focus canvas'}
				title={focused ? 'Restore panels' : 'Focus canvas'} onClick={onFocus}><FocusIcon size={16} /></button>
		</div>
	</div>
}

export function CanvasAppearance({ view, onView }: Pick<Props, 'view' | 'onView'>) {
	return <ToolbarPopover label="Canvas appearance" buttonClass="cc-board-icon" trigger={<Blend size={16} />}>
		{() => <AppearanceFields view={view} onView={onView} />}
	</ToolbarPopover>
}

export function CanvasOptions({ view, onView, canConnect, onConnect, onGuide }: Pick<Props, 'view' | 'onView' | 'canConnect' | 'onConnect'> & {
	onGuide: () => void
}) {
	return <ToolbarPopover label="Canvas options" buttonClass="cc-board-icon" triggerId="canvas-guide-trigger" trigger={<Ellipsis size={21} />}>
		{(close) => <>
			<AppearanceFields view={view} onView={onView} />
			<div className="cc-toolbar-choices cc-toolbar-choices--separated">
				{view.mode === 'map' && <button type="button" className="cc-toolbar-choice" disabled={!canConnect} onClick={() => { onConnect(); close() }}>
					<Link2 size={17} /> Connect selected items
				</button>}
				<button type="button" className="cc-toolbar-choice" onClick={() => { close(); onGuide() }}>
					<CircleHelp size={17} /> Canvas guide
				</button>
			</div>
		</>}
	</ToolbarPopover>
}

function AppearanceFields({ view, onView }: Pick<Props, 'view' | 'onView'>) {
	return <fieldset className="cc-appearance">
		<legend>Canvas appearance</legend>
		<div className="cc-swatches" role="group" aria-label="Background color">
			{Object.entries(BOARD_COLORS).map(([id, color]) => (
				<button key={id} type="button" aria-label={color.label} title={color.label}
					style={{ background: color.value }} aria-pressed={view.color === id}
					onClick={() => onView({ ...view, color: id as BoardView['color'] })} />
			))}
		</div>
		<label className="cc-appearance__pattern">
			<input type="checkbox" checked={view.dotted} onChange={(e) => onView({ ...view, dotted: e.target.checked })} /> Dotted grid
		</label>
	</fieldset>
}

function ToolbarPopover({ buttonClass, label, placement, trigger, triggerId, children }: {
	buttonClass: string
	label: string
	placement?: 'above'
	trigger: ReactNode
	triggerId?: string
	children: (close: () => void) => ReactNode
}) {
	const [open, setOpen] = useState(false)
	const anchor = useRef<HTMLDivElement>(null)
	const button = useRef<HTMLButtonElement>(null)
	const id = useId()

	useEffect(() => {
		if (!open) return
		const dismiss = (event: PointerEvent) => {
			if (event.target instanceof Node && !anchor.current?.contains(event.target)) setOpen(false)
		}
		document.addEventListener('pointerdown', dismiss)
		return () => document.removeEventListener('pointerdown', dismiss)
	}, [open])

	function close() {
		button.current?.focus()
		setOpen(false)
	}

	return <div className="cc-toolbar-popover" data-placement={placement} ref={anchor}
		onBlur={(event) => {
			if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) setOpen(false)
		}}
		onKeyDown={(event) => {
			if (!open || event.key !== 'Escape') return
			event.stopPropagation()
			event.preventDefault()
			close()
		}}>
		<button type="button" className={buttonClass} id={triggerId} ref={button} title={label} aria-label={label}
			aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>{trigger}</button>
		{open && <div className="cc-toolbar-popover__body" id={id}>{children(close)}</div>}
	</div>
}

function PanelToggle({ label, id, open, onClick, children, caption }: {
	label: string
	id: string
	open: boolean
	onClick: () => void
	children: ReactNode
	caption: string
}) {
	const action = `${open ? 'Hide' : 'Show'} ${label}`
	return <button type="button" className="cc-board-icon cc-panel-toggle" data-open={open} title={action} aria-label={action}
		aria-expanded={open} aria-controls={id} onClick={onClick}>{children}<span aria-hidden="true">{caption}</span></button>
}
