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
	size?: 's' | 'm' | 'l' | 'xl'
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

/** A teammate's vote: a neutral graphite sticker with their initial. Votes are not a state, so no state colour. */
export function VoteSticker({ name, animate = true }: { name: string; animate?: boolean }) {
	return (
		<span role="img" aria-label={`${name} voted`} title={`${name} voted`} className={`cc-vote-sticker${animate ? ' cc-dot--stick' : ''}`}>
			{name.slice(0, 1)}
		</span>
	)
}
