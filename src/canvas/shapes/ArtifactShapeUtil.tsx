import { BaseBoxShapeUtil, T } from 'tldraw'
import { SourceIcon } from '../../ui/SourceIcon'
import { Dot } from '../../ui/Dot'
import { emit, CC_EVENTS } from '../canvasUi'
import { Print } from './Print'
import { ccMeta, SHAPE, type ArtifactShape } from './types'

export const TOOL_NAME: Record<string, string> = {
	figma: 'Figma',
	illustrator: 'Illustrator',
	repo: 'Repository',
	doc: 'Document',
	image: 'Image',
	folder: 'Folder',
	file: 'File',
	pdf: 'PDF',
	link: 'Inspiration',
}

export class ArtifactShapeUtil extends BaseBoxShapeUtil<ArtifactShape> {
	static override type = SHAPE.artifact
	static override props = {
		w: T.number,
		h: T.number,
		name: T.string,
		tool: T.string,
		ext: T.string,
		location: T.string,
		status: T.string,
		summary: T.string,
		preview: T.string,
		capabilities: T.arrayOf(T.string),
	}

	override getDefaultProps(): ArtifactShape['props'] {
		return {
			w: 280,
			h: 176,
			name: 'Untitled',
			tool: 'doc',
			ext: '.pdf',
			location: '',
			status: 'linked',
			summary: '',
			preview: 'doc',
			capabilities: ['open'],
		}
	}

	override canEdit() {
		return false
	}

	override canResize() {
		return false
	}

	override onBeforeDuplicate(_original: ArtifactShape, duplicate: ArtifactShape) {
		return { ...duplicate, meta: { ...duplicate.meta, boardId: duplicate.id, ghost: false, ghostDot: false } }
	}

	override onDoubleClick(shape: ArtifactShape) {
		emit(CC_EVENTS.openArtifact, { boardId: ccMeta(shape).boardId, shapeId: shape.id })
		// returning a (no-op) change tells tldraw the double-click was handled, so it won't start a text shape
		return { id: shape.id, type: shape.type }
	}

	override component(shape: ArtifactShape) {
		const { name, tool, ext, summary, location, preview } = shape.props
		const dot = ccMeta(shape).dot ?? 'synced'
		return (
			<Print shape={shape} className="cc-art" label={`${TOOL_NAME[tool] ?? tool} file: ${name}`}>
				<div className="cc-art__strip">
					<span className="cc-art__tool"><SourceIcon tool={tool} location={location} size={13} />{TOOL_NAME[tool] ?? tool}</span>
					<span className="cc-ext">{ext}</span>
					<span className="cc-art__dot">
						<Dot state={dot} size="s" label={shape.props.status === 'unverified' ? 'Source link · not read or synced' : undefined} />
					</span>
				</div>
				<div className="cc-art__body">
					<div className={`cc-art__preview cc-prev--${preview}`} aria-hidden="true">
						{preview === 'link' ? <SourceIcon tool={tool} size={28} kindOnly /> : <ArtifactPreview kind={preview} />}
					</div>
					<div className="cc-art__text">
						<span className="cc-art__name">{name}</span>
						<span className="cc-art__summary">{summary}</span>
						<span className="cc-art__path" title={location}>
							{location}
						</span>
					</div>
				</div>
			</Print>
		)
	}

	override getIndicatorPath(shape: ArtifactShape) {
		const path = new Path2D()
		path.roundRect(0, 0, shape.props.w, shape.props.h, 6)
		return path
	}
}

/** Authored mini previews; the real product renders thumbnails from the source. */
function ArtifactPreview({ kind }: { kind: string }) {
	if (kind === 'logo')
		return (
			<div className="cc-prev-logo">
				<span className="cc-prev-logo__mark">H</span>
				<span className="cc-prev-logo__word">Halden</span>
			</div>
		)
	if (kind === 'ui')
		return (
			<div className="cc-prev-ui">
				<span className="cc-prev-ui__nav" />
				<span className="cc-prev-ui__hero" />
				<span className="cc-prev-ui__row">
					<i />
					<i />
					<i />
				</span>
			</div>
		)
	if (kind === 'code')
		return (
			<pre className="cc-prev-code">
				<span className="k">export</span> <span className="k">const</span> theme{'\n'}
				{'  '}colors: {'{'}
				{'\n'}
				{'    '}primary: <span className="s">'#1F3A5F'</span>
				{'\n'}
				{'    '}surface: <span className="s">'#FFF'</span>
			</pre>
		)
	return (
		<div className="cc-prev-doc">
			<span className="cc-prev-doc__title" />
			<span />
			<span />
			<span className="short" />
			<span />
			<span className="short" />
		</div>
	)
}
