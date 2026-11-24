export function LoadingRows({ label }: { label: string }) {
	return <div className="cc-loading-rows" role="status" aria-label={label}>
		{[1, 2, 3].map((row) => <div className="cc-loading-row" key={row} aria-hidden="true">
			<span /><span><i /><i /></span>
		</div>)}
	</div>
}

export function WorkspaceLoading({ label, canvas = false }: { label: string; canvas?: boolean }) {
	if (!canvas) return <main className="cc-projects">
		<header className="cc-projects__header"><span className="cc-workspace-brand">AgentC <span>Connected Canvas</span></span></header>
		<div className="cc-projects__intro"><h1>{label}</h1></div>
		<LoadingRows label={label} />
	</main>
	return <main className="cc-canvas-loading" role="status" aria-label={label}>
		<div className="cc-canvas-loading__bar" aria-hidden="true"><i /><i /></div>
		<div className="cc-canvas-loading__board"><span>{label}</span></div>
	</main>
}
