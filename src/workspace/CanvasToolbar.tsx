import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Blend, LayoutGrid, Link2, Maximize, Minimize, Network, PanelLeft, PanelRight } from 'lucide-react'
import { BOARD_COLORS, type BoardView } from './boardView'

interface Props {
	view: BoardView
	onView: (view: BoardView) => void
	sourcesOpen: boolean
	toolsOpen: boolean
	onSources: () => void
	onTools: () => void
	onFocus: () => void
	canConnect: boolean
	onConnect: () => void
}

export function CanvasToolbar({ view, onView, sourcesOpen, toolsOpen, onSources, onTools, onFocus, canConnect, onConnect }: Props) {
	const [appearanceOpen, setAppearanceOpen] = useState(false)
	const anchor = useRef<HTMLDivElement>(null)
	useEffect(() => {
		if (!appearanceOpen) return
		const close = (e: PointerEvent) => {
			if (e.target instanceof Node && !anchor.current?.contains(e.target)) setAppearanceOpen(false)
		}
		document.addEventListener('pointerdown', close)
		return () => document.removeEventListener('pointerdown', close)
	}, [appearanceOpen])

	const focused = !sourcesOpen && !toolsOpen
	const FocusIcon = focused ? Minimize : Maximize

	return (
		<div className="cc-board-controls" aria-label="Canvas controls">
			<div className="cc-view-switch" role="group" aria-label="Canvas view">
				<button type="button" aria-pressed={view.mode === 'moodboard'} onClick={() => onView({ ...view, mode: 'moodboard' })}>
					<LayoutGrid size={15} /> Moodboard
				</button>
				<button type="button" aria-pressed={view.mode === 'map'} onClick={() => onView({ ...view, mode: 'map' })}>
					<Network size={15} /> Node map
				</button>
			</div>
			<div className="cc-board-actions" role="group" aria-label="Canvas layout">
				{view.mode === 'map' ? (
					<button type="button" className="cc-board-icon" aria-label="Connect selected items"
						title="Connect selected items · Shift-click two items" disabled={!canConnect} onClick={onConnect}>
						<Link2 size={17} />
					</button>
				) : null}
				<div className="cc-appearance-anchor" ref={anchor}>
					<button type="button" className="cc-board-icon" title="Canvas appearance" aria-label="Canvas appearance"
						aria-expanded={appearanceOpen} aria-controls="canvas-appearance" onClick={() => setAppearanceOpen((open) => !open)}>
						<Blend size={16} />
					</button>
					{appearanceOpen ? (
						<fieldset className="cc-appearance" id="canvas-appearance" onKeyDown={(e) => {
							if (e.key === 'Escape') {
								e.currentTarget.parentElement?.querySelector('button')?.focus()
								setAppearanceOpen(false)
							}
						}}>
							<legend>Canvas appearance</legend>
							<span className="cc-appearance__label">Background</span>
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
					) : null}
				</div>
				<PanelToggle label="Sources" id="project-sources" open={sourcesOpen} onClick={onSources}><PanelLeft size={16} /></PanelToggle>
				<PanelToggle label="Project tools" id="project-tools" open={toolsOpen} onClick={onTools}><PanelRight size={16} /></PanelToggle>
				<button type="button" className="cc-board-icon" aria-label={focused ? 'Restore panels' : 'Focus canvas'}
					title={focused ? 'Restore panels' : 'Focus canvas'} onClick={onFocus}><FocusIcon size={16} /></button>
			</div>
		</div>
	)
}

function PanelToggle({ label, id, open, onClick, children }: {
	label: string
	id: string
	open: boolean
	onClick: () => void
	children: ReactNode
}) {
	const action = `${open ? 'Hide' : 'Show'} ${label}`
	return <button type="button" className="cc-board-icon" data-open={open} title={action} aria-label={action}
		aria-expanded={open} aria-controls={id} onClick={onClick}>{children}</button>
}
