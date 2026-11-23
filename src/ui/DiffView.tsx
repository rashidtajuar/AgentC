export interface DiffLine {
	kind: 'add' | 'del' | 'ctx' | 'hunk'
	text: string
	oldNo?: number
	newNo?: number
}

/** Parse a unified diff into numbered lines (file headers dropped). */
export function parseUnifiedDiff(patch: string): DiffLine[] {
	const out: DiffLine[] = []
	let oldNo = 0
	let newNo = 0
	for (const raw of patch.split('\n')) {
		if (raw.startsWith('---') || raw.startsWith('+++')) continue
		const hunk = raw.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
		if (hunk) {
			oldNo = Number(hunk[1])
			newNo = Number(hunk[2])
			out.push({ kind: 'hunk', text: raw })
			continue
		}
		if (raw.startsWith('+')) out.push({ kind: 'add', text: raw.slice(1), newNo: newNo++ })
		else if (raw.startsWith('-')) out.push({ kind: 'del', text: raw.slice(1), oldNo: oldNo++ })
		else out.push({ kind: 'ctx', text: raw.slice(1), oldNo: oldNo++, newNo: newNo++ })
	}
	return out
}

export function DiffView({ path, patch }: { path: string; patch: string }) {
	const lines = parseUnifiedDiff(patch)
	const adds = lines.filter((l) => l.kind === 'add').length
	const dels = lines.filter((l) => l.kind === 'del').length
	return (
		<figure className="cc-diff" aria-label={`Changes to ${path}`}>
			<figcaption className="cc-diff__head">
				<span className="cc-diff__path">{path}</span>
				<span className="cc-diff__count">
					<span className="add">+{adds}</span> <span className="del">−{dels}</span>
				</span>
			</figcaption>
			<div className="cc-diff__body" role="table">
				{lines.map((l, i) =>
					l.kind === 'hunk' ? (
						<div key={i} className="cc-diff__hunk" role="row">
							{l.text}
						</div>
					) : (
						<div key={i} className={`cc-diff__line cc-diff__line--${l.kind}`} data-kind={l.kind} role="row">
							<span className="cc-diff__no" role="cell">
								{l.oldNo ?? ''}
							</span>
							<span className="cc-diff__no" role="cell">
								{l.newNo ?? ''}
							</span>
							<span className="cc-diff__sign" role="cell" aria-label={l.kind === 'add' ? 'added' : l.kind === 'del' ? 'removed' : undefined}>
								{l.kind === 'add' ? '+' : l.kind === 'del' ? '−' : ' '}
							</span>
							<code role="cell">{l.text || ' '}</code>
						</div>
					)
				)}
			</div>
		</figure>
	)
}
