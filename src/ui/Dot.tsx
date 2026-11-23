import type { DotState } from '../core/types'

const LABELS: Record<DotState, string> = {
	proposal: 'AI suggestion waiting for review',
	synced: 'Linked and in sync',
	changed: 'Source changed or missing',
	approved: 'Approved',
}

export function dotLabel(state: DotState) {
	return LABELS[state]
}

interface DotProps {
	state: DotState
	size?: 's' | 'm' | 'l'
	animate?: boolean
	label?: string
	/** person who stuck the dot, for vote dots */
	title?: string
}

/** A dot sticker. Colour always means state. */
export function Dot({ state, size = 'm', animate = false, label, title }: DotProps) {
	return (
		<span
			role="img"
			aria-label={label ?? LABELS[state]}
			title={title ?? label ?? LABELS[state]}
			data-state={state}
			className={`cc-dot cc-dot--${size}${animate ? ' cc-dot--stick' : ''}`}
		/>
	)
}
