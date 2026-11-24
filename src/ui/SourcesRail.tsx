import type { BoardShape } from '../core/types'
import { useBoard, useDemoCtx } from '../state/DemoContext'
import { Dot } from './Dot'
import { SourceIcon } from './SourceIcon'

const GROUPS: { title: string; match: (s: BoardShape) => boolean }[] = [
	{ title: 'Figma', match: (s) => s.type === 'artifact' && s.props.tool === 'figma' },
	{ title: 'Illustrator', match: (s) => s.type === 'artifact' && s.props.tool === 'illustrator' },
	{ title: 'Repository', match: (s) => (s.type === 'artifact' && s.props.tool === 'repo') || s.type === 'pull-request' },
	{ title: 'Documents', match: (s) => s.type === 'artifact' && s.props.tool === 'doc' },
	{ title: 'References', match: (s) => s.type === 'reference' },
]

const KIND_TAG: Record<string, string> = { photo: 'photo', swatch: 'palette', specimen: 'type', texture: 'pattern' }

function labelOf(s: BoardShape) {
	if (s.type === 'pull-request') return { name: `#${s.props.number} ${s.props.title}`, ext: 'PR', isKind: true }
	if (s.type === 'artifact') return { name: String(s.props.name), ext: String(s.props.ext), isKind: false }
	const kind = String(s.props.kind ?? 'photo')
	return { name: String(s.props.title ?? 'Image'), ext: KIND_TAG[kind] ?? 'photo', isKind: true }
}

export function SourcesRail({ controls }: { controls?: React.ReactNode }) {
	const ctx = useDemoCtx()
	const board = useBoard()
	const shapes = board?.shapes ?? []

	return (
		<aside className="cc-sources" id="sample-sources" aria-label="Sources">
			<div className="cc-panel-head">
				<h2 className="cc-panel-title">Sources</h2>
				<span className="cc-panel-count">{shapes.filter((s) => s.type !== 'note' && s.type !== 'direction' && s.type !== 'decision').length}</span>
				{controls}
			</div>
			<div className="cc-sources__scroll">
				{GROUPS.map((g) => {
					const items = shapes.filter(g.match)
					if (!items.length) return null
					return (
						<section key={g.title} className="cc-src-group" aria-label={g.title}>
							<h3 className="cc-src-group__title">
								{g.title}
								<span>{items.length}</span>
							</h3>
							<ul className="cc-src-list">
								{items.map((s) => {
									const { name, ext, isKind } = labelOf(s)
									const dot = board?.dots[s.id]
									return (
										<li key={s.id}>
											<button type="button" className="cc-src-item" onClick={() => ctx?.port.focus([s.id])} title={`Show ${name} on the board`}>
												<span className="cc-src-item__name">{name}</span>
												<span className={`cc-src-item__ext${isKind ? ' cc-src-item__ext--kind' : ''}`}>{ext}</span>
												{dot ? <Dot state={dot} size="s" /> : <span className="cc-src-item__nodot" />}
											</button>
										</li>
									)
								})}
							</ul>
						</section>
					)
				})}
			</div>
			<section className="cc-tools" aria-label="Connected tools">
				<h3 className="cc-src-group__title">Connected tools</h3>
				<ul className="cc-tools__list">
					<li>
						<span className="cc-tools__name"><SourceIcon tool="figma" /> Figma</span>
						<span className="cc-tools__can">Read only</span>
					</li>
					<li>
						<span className="cc-tools__name"><SourceIcon tool="repo" location="github://" /> GitHub</span>
						<span className="cc-tools__can">Can open pull requests</span>
					</li>
					<li>
						<span className="cc-tools__name"><SourceIcon tool="desktop" /> Desktop app</span>
						<span className="cc-tools__can">Opens local files</span>
					</li>
				</ul>
			</section>
		</aside>
	)
}
