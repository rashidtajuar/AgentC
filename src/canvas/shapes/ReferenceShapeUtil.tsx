import { BaseBoxShapeUtil, T } from 'tldraw'
import { photoCredit, ReferenceArt } from './referenceArt'
import { Print } from './Print'
import { SHAPE, type ReferenceShape } from './types'

const KIND_LABEL: Record<string, string> = { photo: 'Photo', swatch: 'Palette', specimen: 'Type', texture: 'Pattern' }

export class ReferenceShapeUtil extends BaseBoxShapeUtil<ReferenceShape> {
	static override type = SHAPE.reference
	static override props = {
		w: T.number,
		h: T.number,
		kind: T.literalEnum('photo', 'swatch', 'specimen', 'texture'),
		title: T.string,
		asset: T.string,
	}

	override getDefaultProps(): ReferenceShape['props'] {
		return { w: 220, h: 232, kind: 'swatch', title: 'Reference', asset: 'kiln' }
	}

	override canEdit() {
		return false
	}

	override isAspectRatioLocked() {
		return true
	}

	override component(shape: ReferenceShape) {
		const { kind, asset, title } = shape.props
		const credit = kind === 'photo' ? photoCredit(asset) : undefined
		return (
			<Print shape={shape} className="cc-ref" label={`Reference: ${title}`}>
				<ReferenceArt kind={kind} asset={asset} title={title} />
				<div className="cc-ref__caption">
					<span className="cc-ref__title">{title}</span>
					<span className="cc-ref__meta">
						{KIND_LABEL[kind]}
						{credit ? (
							<>
								{' · '}
								<a
									href={credit.authorUrl}
									target="_blank"
									rel="noreferrer"
									onPointerDown={(e) => e.stopPropagation()}
								>
									{credit.author}
								</a>
								{' / Unsplash'}
							</>
						) : null}
					</span>
				</div>
			</Print>
		)
	}

	override getIndicatorPath(shape: ReferenceShape) {
		const path = new Path2D()
		path.roundRect(0, 0, shape.props.w, shape.props.h, 6)
		return path
	}
}
