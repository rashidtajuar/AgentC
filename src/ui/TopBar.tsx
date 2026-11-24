import { useEffect, useRef, useState } from 'react'
import { ChevronDown, RotateCcw, ListOrdered } from 'lucide-react'
import type { BeatId } from '../core/types'
import { PEOPLE, PROJECT } from '../demo/content'
import { BEATS } from '../demo/scenario'
import { useDemo, useDemoCtx } from '../state/DemoContext'

export function TopBar() {
	const ctx = useDemoCtx()
	const pending = useDemo((s) => s.pending, undefined)
	const count = pending ? 1 : 0

	const review = () => {
		if (!ctx || !pending) return
		if (pending.external) return ctx.store.getState().openSheet()
		const ids = pending.ops.flatMap((o) =>
			o.op === 'createFrame' || o.op === 'createNote' || o.op === 'connect' ? [o.id] : o.op === 'moveShapes' ? o.moves.map((m) => m.id) : []
		)
		ctx.port.focus(ids)
	}

	return (
		<header className="cc-topbar">
			<div className="cc-brand" aria-label="Connected Canvas">
				<svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
					<rect x="5" y="6" width="15" height="19" rx="2.5" fill="#fff" transform="rotate(-4 12 15)" />
					<circle cx="22.5" cy="21.5" r="5" fill="var(--cc-shell-muted)" />
				</svg>
				<span className="cc-brand__name">Connected Canvas</span>
			</div>
			<span className="cc-topbar__sep" aria-hidden="true" />
			<nav className="cc-crumbs" aria-label="Project">
				<span className="cc-crumbs__studio">{PROJECT.studio}</span>
				<span className="cc-crumbs__slash" aria-hidden="true">
					/
				</span>
				<span className="cc-topbar__project">
					{PROJECT.client} · {PROJECT.project}
				</span>
			</nav>
			<span className="cc-tag">Sample data</span>

			<div className="cc-topbar__right">
				<div className="cc-faces" aria-label="3 people on this board">
					{Object.values(PEOPLE).map((p) => (
						<span key={p.name} className="cc-face" title={`${p.name} · ${p.role}`}>
							{p.initials}
						</span>
					))}
				</div>
				<button type="button" className="cc-btn cc-btn--shell" onClick={review} disabled={count === 0} data-active={count > 0 || undefined}>
					{count > 0 ? <span className="cc-review-dot" aria-hidden="true" /> : null}
					Review changes ({count})
				</button>
				<a className="cc-btn cc-btn--ghost" href="/">Your projects</a>
				<DemoMenu />
			</div>
		</header>
	)
}

export function DemoMenu() {
	const ctx = useDemoCtx()
	const [open, setOpen] = useState(false)
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!open) return
		const close = (e: PointerEvent | KeyboardEvent) => {
			if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false)
		}
		window.addEventListener('pointerdown', close)
		window.addEventListener('keydown', close)
		return () => {
			window.removeEventListener('pointerdown', close)
			window.removeEventListener('keydown', close)
		}
	}, [open])

	const run = (fn: () => void) => () => {
		setOpen(false)
		fn()
	}

	return (
		<div className="cc-menu" ref={ref}>
			<button type="button" className="cc-btn cc-btn--shell" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
				Demo
				<ChevronDown size={14} aria-hidden="true" />
			</button>
			{open ? (
				<div className="cc-menu__list" role="menu" aria-label="Demo controls">
					<button type="button" role="menuitem" className="cc-menu__item" onClick={run(() => ctx?.store.getState().restart())}>
						<RotateCcw size={14} aria-hidden="true" />
						Restart demo
					</button>
					<div className="cc-menu__label" role="presentation">
						<ListOrdered size={14} aria-hidden="true" />
						Jump to step
					</div>
					{([0, 1, 2, 3, 4, 5] as BeatId[]).map((b) => (
						<button key={b} type="button" role="menuitem" className="cc-menu__item cc-menu__item--sub" onClick={run(() => ctx?.store.getState().jumpTo(b))}>
							<span className="cc-menu__num">{b}</span>
							{BEATS[b].name}
						</button>
					))}
				</div>
			) : null}
		</div>
	)
}
