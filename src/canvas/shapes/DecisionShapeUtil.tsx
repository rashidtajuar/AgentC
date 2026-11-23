import { BaseBoxShapeUtil, T } from 'tldraw'
import { Dot } from '../../ui/Dot'
import { Print } from './Print'
import { SHAPE, type DecisionShape } from './types'

export class DecisionShapeUtil extends BaseBoxShapeUtil<DecisionShape> {
	static override type = SHAPE.decision
	static override props = {
		w: T.number,
		h: T.number,
		title: T.string,
		rationale: T.string,
		approvedBy: T.string,
		time: T.string,
		votes: T.number,
	}

	override getDefaultProps(): DecisionShape['props'] {
		return { w: 520, h: 150, title: 'Decision', rationale: '', approvedBy: 'You', time: '', votes: 0 }
	}

	override canEdit() {
		return false
	}

	override canResize() {
		return false
	}

	override component(shape: DecisionShape) {
		const { title, rationale, approvedBy, time, votes } = shape.props
		return (
			<Print shape={shape} className="cc-decision" label={`Decision: ${title} approved`}>
				<div className="cc-decision__head">
					<Dot state="approved" size="xl" animate />
					<h3 className="cc-decision__title">Decision: {title}</h3>
				</div>
				<p className="cc-decision__why">{rationale}</p>
				<p className="cc-decision__meta">
					Approved by {approvedBy} · {time} · {votes} {votes === 1 ? 'vote' : 'votes'}
				</p>
			</Print>
		)
	}

	override getIndicatorPath(shape: DecisionShape) {
		const path = new Path2D()
		path.roundRect(0, 0, shape.props.w, shape.props.h, 6)
		return path
	}
}
