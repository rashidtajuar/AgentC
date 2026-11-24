import { lazy, Suspense } from 'react'
import { Workspace } from './workspace/Workspace'

const DemoApp = lazy(() => import('./DemoApp'))

export default function App() {
	if (!new URLSearchParams(window.location.search).has('demo')) return <Workspace />
	return (
		<Suspense fallback={<main className="cc-route-loading" role="status">Opening sample…</main>}>
			<DemoApp />
		</Suspense>
	)
}
