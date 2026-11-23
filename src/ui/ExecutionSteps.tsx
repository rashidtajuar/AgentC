import { Check, Circle, LoaderCircle, X } from 'lucide-react'
import type { ExecutionStep } from '../core/types'

const ICON = {
	pending: <Circle size={14} aria-hidden="true" />,
	running: <LoaderCircle size={14} className="cc-spin" aria-hidden="true" />,
	done: <Check size={14} strokeWidth={2.5} aria-hidden="true" />,
	failed: <X size={14} strokeWidth={2.5} aria-hidden="true" />,
}

const STATE_LABEL = { pending: 'waiting', running: 'in progress', done: 'done', failed: 'failed' }

export function ExecutionSteps({ steps }: { steps: ExecutionStep[] }) {
	return (
		<ol className="cc-exec" aria-label="Steps">
			{steps.map((s) => (
				<li key={s.id} className="cc-exec__step" data-state={s.state}>
					<span className="cc-exec__icon">{ICON[s.state]}</span>
					<span className="cc-exec__text">
						<span className="cc-exec__label">{s.label}</span>
						{s.detail ? <code className="cc-exec__detail">{s.detail}</code> : null}
					</span>
					<span className="cc-sr">{STATE_LABEL[s.state]}</span>
				</li>
			))}
		</ol>
	)
}
