import { useEffect, useRef, useState } from 'react'
import { ExternalLink, FolderOpen, Network, X } from 'lucide-react'
import { TOOL_NAME } from '../canvas/shapes/ArtifactShapeUtil'
import { useBoard, useDemo, useDemoCtx } from '../state/DemoContext'
import { Dot } from './Dot'

const OPEN_COPY: Record<string, string> = {
	illustrator: 'Opens in Illustrator in the desktop app — simulated',
	figma: 'Opens the file in Figma — simulated',
	repo: 'Opens theme.ts on GitHub — simulated',
	doc: 'Opens the brief in Drive — simulated',
}
const REVEAL_COPY: Record<string, string> = {
	illustrator: 'Reveals the file in Finder — simulated',
	figma: 'Shows the file in its Figma project — simulated',
	repo: 'Shows website/src in the repository — simulated',
	doc: 'Shows the folder in Drive — simulated',
}

export function ArtifactPopover() {
	const ctx = useDemoCtx()
	const popover = useDemo((s) => s.popover, null)
	const board = useBoard()
	const ref = useRef<HTMLDivElement>(null)
	const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

	useEffect(() => {
		if (!popover || !ctx) return setPos(null)
		const r = ctx.port.screenRect(popover.boardId)
		const host = document.querySelector('.cc-canvas') as HTMLElement | null
		const maxX = (host?.clientWidth ?? 900) - 300
		const hostH = host?.clientHeight ?? 700
		const POP_H = 196
		const below = r ? r.y + r.h + 10 : 24
		const y = r && below + POP_H > hostH - 12 ? Math.max(12, r.y - POP_H - 10) : below
		setPos(r ? { x: Math.max(12, Math.min(maxX, r.x)), y } : { x: 24, y: 24 })
		const close = (e: PointerEvent | KeyboardEvent) => {
			if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) ctx.store.getState().closePopover()
		}
		const t = setTimeout(() => {
			window.addEventListener('pointerdown', close)
			window.addEventListener('keydown', close)
		}, 0)
		return () => {
			clearTimeout(t)
			window.removeEventListener('pointerdown', close)
			window.removeEventListener('keydown', close)
		}
	}, [popover, ctx])

	if (!popover || !pos || !ctx) return null
	const shape = board?.shapes.find((s) => s.id === popover.boardId)
	if (!shape) return null
	const tool = String(shape.props.tool ?? 'doc')
	const s = ctx.store.getState()
	const links = board?.relationships.filter((r) => r.from === shape.id || r.to === shape.id) ?? []

	const act = (fn: () => void) => () => {
		fn()
		s.closePopover()
	}

	return (
		<div ref={ref} className="cc-pop" role="dialog" aria-label={`${shape.props.name}`} style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}>
			<div className="cc-pop__head">
				<Dot state={board?.dots[shape.id] ?? 'synced'} size="s" />
				<span className="cc-pop__name">{String(shape.props.name)}</span>
				<button type="button" className="cc-icon-btn cc-icon-btn--light" aria-label="Close" onClick={() => s.closePopover()}>
					<X size={14} aria-hidden="true" />
				</button>
			</div>
			<p className="cc-pop__where">
				{TOOL_NAME[tool] ?? tool} · <code>{String(shape.props.location)}</code>
			</p>
			<div className="cc-pop__actions">
				<button type="button" className="cc-pop__btn" onClick={act(() => s.toast(OPEN_COPY[tool] ?? 'Opens the original — simulated'))}>
					<ExternalLink size={14} aria-hidden="true" />
					Open original
				</button>
				<button type="button" className="cc-pop__btn" onClick={act(() => s.toast(REVEAL_COPY[tool] ?? 'Reveals the original — simulated'))}>
					<FolderOpen size={14} aria-hidden="true" />
					Reveal in folder
				</button>
				<button
					type="button"
					className="cc-pop__btn"
					onClick={act(() => {
						if (board?.shapes.some((x) => x.type === 'pull-request')) return void s.showConnections()
						if (!links.length) return s.toast('No connections yet')
						const ids = [shape.id, ...links.flatMap((l) => [l.from, l.to])]
						ctx.port.highlight(ids)
						ctx.port.focus(ids)
					})}
				>
					<Network size={14} aria-hidden="true" />
					Show connections
					{links.length ? <span className="cc-pop__count">{links.length}</span> : null}
				</button>
			</div>
		</div>
	)
}
