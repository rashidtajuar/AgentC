import { lazy, Suspense } from 'react'
import { Workspace } from './workspace/Workspace'

const CloudWorkspace = lazy(() => import('./cloud/CloudWorkspace'))
const DemoApp = lazy(() => import('./DemoApp'))

export default function App() {
	const query = new URLSearchParams(window.location.search)
	if (query.has('cloud')) return (
		<Suspense fallback={<main className="cc-route-loading" role="status">Opening cloud workspace…</main>}>
			<CloudWorkspace />
		</Suspense>
	)
	if (!query.has('demo')) return <Workspace />
	return (
		<Suspense fallback={<main className="cc-route-loading" role="status">Opening sample…</main>}>
			<DemoApp />
		</Suspense>
	)
}
