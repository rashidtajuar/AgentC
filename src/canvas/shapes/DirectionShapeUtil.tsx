import { BaseFrameLikeShapeUtil, HTMLContainer, T } from 'tldraw'
import { Check } from 'lucide-react'
import { Dot, VoteSticker } from '../../ui/Dot'
import { CC_EVENTS, emit, litState, useCanvasUi } from '../canvasUi'
import { ccMeta, SHAPE, type DirectionShape } from './types'

export class DirectionShapeUtil extends BaseFrameLikeShapeUtil<DirectionShape> {
	static override type = SHAPE.direction
	static override props = { w: T.number, h: T.number, name: T.string, rationale: T.string }

	override getDefaultProps(): DirectionShape['props'] {
		return { w: 520, h: 852, name: 'Direction', rationale: '' }
	}

	override canEdit() {
		return false
	}

	override component(shape: DirectionShape) {
		return <DirectionView shape={shape} />
	}

	override getIndicatorPath(shape: DirectionShape) {
		const path = new Path2D()
		path.roundRect(0, 0, shape.props.w, shape.props.h, 14)
		return path
	}
}

function DirectionView({ shape }: { shape: DirectionShape }) {
	const meta = ccMeta(shape)
	const highlight = useCanvasUi((s) => s.highlight)
	const approved = meta.dot === 'approved'
	const votes = meta.votes ?? []
	return (
		<HTMLContainer
			className="cc-dir"
			data-ghost={meta.ghost ? 'true' : undefined}
			data-approved={approved ? 'true' : undefined}
			data-lit={litState(highlight, meta.boardId)}
			style={{ width: shape.props.w, height: shape.props.h }}
			aria-label={`Direction: ${shape.props.name}`}
		>
			<div className="cc-dir__stickers" aria-hidden={votes.length === 0 && !approved && !meta.ghost}>
				{meta.ghost ? <Dot state="proposal" size="xl" /> : null}
				{votes.map((v) => (
					<VoteSticker key={v} name={v} />
				))}
				{approved ? <Dot state="approved" size="xl" animate label="Approved" /> : null}
			</div>
			<header className="cc-dir__head">
				<div className="cc-dir__title-row">
					<h3 className="cc-dir__name">{shape.props.name}</h3>
					{approved ? <span className="cc-dir__approved">Approved</span> : null}
				</div>
				<p className="cc-dir__why">{shape.props.rationale}</p>
				<div className="cc-dir__foot">
					<span className="cc-dir__votes">
						{votes.length === 0 ? 'No votes yet' : `${votes.length} ${votes.length === 1 ? 'vote' : 'votes'} · ${votes.join(', ')}`}
					</span>
					{!approved && !meta.ghost ? (
						<button
							type="button"
							className="cc-btn cc-btn--quiet cc-dir__approve"
							onPointerDown={(e) => e.stopPropagation()}
							onClick={(e) => {
								e.stopPropagation()
								emit(CC_EVENTS.approve, { directionId: meta.boardId })
							}}
						>
							<Check size={14} strokeWidth={2.25} aria-hidden="true" />
							Approve direction
						</button>
					) : null}
				</div>
			</header>
		</HTMLContainer>
	)
}
