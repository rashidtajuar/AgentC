import { useEffect } from 'react'
import { useDemo, useDemoCtx } from '../state/DemoContext'

export function Toasts() {
	const ctx = useDemoCtx()
	const toasts = useDemo((s) => s.toasts, [])
	useEffect(() => {
		if (!toasts.length || !ctx) return
		const first = toasts[0]
		const t = setTimeout(() => ctx.store.getState().dismissToast(first.id), 3600)
		return () => clearTimeout(t)
	}, [toasts, ctx])
	return (
		<div className="cc-toasts" role="status" aria-live="polite">
			{toasts.map((t) => (
				<div key={t.id} className="cc-toast">
					{t.text}
				</div>
			))}
		</div>
	)
}
