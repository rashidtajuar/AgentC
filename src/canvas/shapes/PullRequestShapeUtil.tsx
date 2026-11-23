import { BaseBoxShapeUtil, T } from 'tldraw'
import { GitBranch, GitPullRequest } from 'lucide-react'
import { Dot } from '../../ui/Dot'
import { Print } from './Print'
import { ccMeta, SHAPE, type PullRequestShape } from './types'

export class PullRequestShapeUtil extends BaseBoxShapeUtil<PullRequestShape> {
	static override type = SHAPE.pr
	static override props = {
		w: T.number,
		h: T.number,
		number: T.number,
		title: T.string,
		branch: T.string,
		repo: T.string,
		files: T.number,
		additions: T.number,
		deletions: T.number,
		status: T.string,
	}

	override getDefaultProps(): PullRequestShape['props'] {
		return {
			w: 300,
			h: 150,
			number: 1,
			title: 'Pull request',
			branch: 'main',
			repo: '',
			files: 1,
			additions: 0,
			deletions: 0,
			status: 'Open',
		}
	}

	override canEdit() {
		return false
	}

	override canResize() {
		return false
	}

	override component(shape: PullRequestShape) {
		const p = shape.props
		return (
			<Print shape={shape} className="cc-pr" label={`Pull request #${p.number}: ${p.title}`}>
				<div className="cc-art__strip">
					<span className="cc-art__tool">Pull request</span>
					<span className="cc-ext">#{p.number}</span>
					<span className="cc-art__dot">
						<Dot state={ccMeta(shape).dot ?? 'synced'} size="s" animate />
					</span>
				</div>
				<div className="cc-pr__body">
					<div className="cc-pr__title-row">
						<GitPullRequest size={16} strokeWidth={2} aria-hidden="true" className="cc-pr__icon" />
						<span className="cc-pr__title">{p.title}</span>
					</div>
					<span className="cc-pr__branch">
						<GitBranch size={12} strokeWidth={2} aria-hidden="true" />
						{p.branch}
					</span>
					<span className="cc-pr__meta">
						<span className="cc-pr__status">{p.status}</span>
						<span className="cc-pr__diff">
							<span className="add">+{p.additions}</span> <span className="del">−{p.deletions}</span> · {p.files}{' '}
							{p.files === 1 ? 'file' : 'files'}
						</span>
					</span>
					<span className="cc-pr__repo">{p.repo} · simulated in demo</span>
				</div>
			</Print>
		)
	}

	override getIndicatorPath(shape: PullRequestShape) {
		const path = new Path2D()
		path.roundRect(0, 0, shape.props.w, shape.props.h, 6)
		return path
	}
}
