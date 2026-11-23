import { useEffect, useRef } from 'react'
import { GitPullRequest, X } from 'lucide-react'
import { EXECUTION_STEPS, PROJECT } from '../demo/content'
import { useDemo, useDemoCtx } from '../state/DemoContext'
import { DiffView } from './DiffView'
import { Dot } from './Dot'
import { ExecutionSteps } from './ExecutionSteps'
import { TokenDiff } from './TokenDiff'

const PERMISSION_COPY = {
	read: 'Read — looks only',
	suggest: 'Suggest — changes the board only after you accept',
	prepare: 'Prepare — executing needs your approval',
	execute: 'Execute — runs immediately',
}

export function ProposalSheet() {
	const ctx = useDemoCtx()
	const open = useDemo((s) => s.sheetOpen, false)
	const pending = useDemo((s) => s.pending, undefined)
	const run = useDemo((s) => s.run, undefined)
	const busy = useDemo((s) => s.busy, false)
	const headingRef = useRef<HTMLHeadingElement>(null)

	useEffect(() => {
		if (!open) return
		headingRef.current?.focus()
		const onKey = (e: KeyboardEvent) => e.key === 'Escape' && ctx?.store.getState().closeSheet()
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [open, ctx])

	if (!open) return null
	const p = pending
	const running = !!run && busy
	const finished = !!run && run.steps.every((s) => s.state === 'done')
	const files = p?.fileDiffs ?? []

	return (
		<section className="cc-sheet" role="dialog" aria-modal="false" aria-labelledby="cc-sheet-title">
			<header className="cc-sheet__head">
				<div className="cc-sheet__title-row">
					<Dot state={finished ? 'synced' : 'proposal'} size="m" />
					<h2 id="cc-sheet-title" ref={headingRef} tabIndex={-1}>
						{p?.summary ?? 'Pull request opened'}
					</h2>
				</div>
				<button type="button" className="cc-icon-btn" aria-label="Close review" onClick={() => ctx?.store.getState().closeSheet()} disabled={running}>
					<X size={16} aria-hidden="true" />
				</button>
			</header>

			<div className="cc-sheet__body">
				<p className="cc-sheet__reads">
					Reads: Approved decision · Halden — Web UI.fig <span className="cc-sheet__ro">(read only)</span> · website/src/theme.ts
				</p>

				{p?.tokenChanges ? (
					<section className="cc-sheet__section" aria-labelledby="cc-sheet-tokens">
						<h3 id="cc-sheet-tokens">Design tokens from Figma</h3>
						<TokenDiff changes={p.tokenChanges} />
					</section>
				) : null}

				{files.length ? (
					<section className="cc-sheet__section" aria-labelledby="cc-sheet-code">
						<h3 id="cc-sheet-code">Code</h3>
						{files.map((f) => (
							<DiffView key={f.path} path={f.path} patch={f.patch} />
						))}
						<p className="cc-sheet__affected">
							Affected files: <code>{files.map((f) => f.path).join(', ')}</code>
						</p>
					</section>
				) : null}

				<section className="cc-sheet__section" aria-labelledby="cc-sheet-then">
					<h3 id="cc-sheet-then">{run ? 'Running in GitHub' : 'When you approve'}</h3>
					<ExecutionSteps steps={run?.steps ?? EXECUTION_STEPS.map((s) => ({ ...s, state: 'pending' as const }))} />
					<p className="cc-sheet__note">
						<GitPullRequest size={14} aria-hidden="true" />
						{PROJECT.repo} · simulated in demo. Nothing is merged or deployed.
					</p>
				</section>
			</div>

			<footer className="cc-sheet__foot">
				<span className="cc-sheet__perm">{p ? PERMISSION_COPY[p.permission] : 'Done'}</span>
				<div className="cc-sheet__actions">
					<button type="button" className="cc-btn cc-btn--ghost" onClick={() => ctx?.store.getState().closeSheet()} disabled={running}>
						{finished ? 'Close' : 'Cancel'}
					</button>
					{!finished ? (
						<button type="button" className="cc-btn cc-btn--primary" onClick={() => ctx?.store.getState().approveExternal()} disabled={running || !p}>
							{running ? 'Opening pull request…' : 'Approve and open pull request'}
						</button>
					) : null}
				</div>
			</footer>
		</section>
	)
}
