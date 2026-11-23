import { Tldraw } from 'tldraw'

export default function App() {
	return (
		<div className="cc-app">
			<header className="cc-topbar">
				<span className="cc-topbar__project">Halden Coffee · Brand &amp; Website</span>
				<span className="cc-tag">Sample data</span>
			</header>
			<aside className="cc-sources" aria-label="Sources" />
			<main className="cc-canvas">
				<Tldraw licenseKey={import.meta.env.VITE_TLDRAW_LICENSE_KEY} />
			</main>
			<aside className="cc-ai" aria-label="AI" />
		</div>
	)
}
