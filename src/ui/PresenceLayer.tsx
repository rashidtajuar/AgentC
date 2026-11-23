import { useEffect, useState } from 'react'
import { useDemo, useDemoCtx } from '../state/DemoContext'

/** Teammates' cursors gliding to where they stick their vote. */
export function PresenceLayer() {
	const presence = useDemo((s) => s.presence, {})
	return (
		<div className="cc-presence" aria-hidden="true">
			{Object.entries(presence).map(([name, target], i) => (
				<Cursor key={name} name={name} target={target} index={i} />
			))}
		</div>
	)
}

function Cursor({ name, target, index }: { name: string; target: string; index: number }) {
	const ctx = useDemoCtx()
	const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
	useEffect(() => {
		const host = document.querySelector('.cc-canvas') as HTMLElement | null
		const w = host?.clientWidth ?? 800
		const h = host?.clientHeight ?? 600
		setPos({ x: index ? w * 0.15 : w - 60, y: h - 70 })
		const raf = requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				const r = ctx?.port.screenRect(target)
				// land on the frame's sticker corner, where the vote gets stuck
				if (r) setPos({ x: r.x + r.w - 150 + index * 46, y: r.y + 30 })
			})
		)
		return () => cancelAnimationFrame(raf)
	}, [ctx, target, index])
	if (!pos) return null
	return (
		<div className="cc-cursor" style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}>
			<svg width="18" height="20" viewBox="0 0 18 20">
				<path d="M1.5 1.5 16 9.2l-6.6 1.6-3.1 6.7z" fill="var(--cc-graphite-900)" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
			</svg>
			<span className="cc-cursor__name">{name}</span>
		</div>
	)
}
