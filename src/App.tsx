import { lazy, Suspense } from 'react'
import { WorkspaceLoading } from './workspace/WorkspaceLoading'
import { Workspace } from './workspace/Workspace'

const CloudWorkspace = lazy(() => import('./cloud/CloudWorkspace'))
const DemoApp = lazy(() => import('./DemoApp'))

export default function App() {
	const query = new URLSearchParams(window.location.search)
	if (query.has('cloud')) return (
		<Suspense fallback={<WorkspaceLoading label="Opening cloud workspace…" />}>
			<CloudWorkspace />
		</Suspense>
	)
	if (!query.has('demo')) return <Workspace />
	return (
		<Suspense fallback={<WorkspaceLoading canvas label="Opening sample…" />}>
			<DemoApp />
		</Suspense>
	)
}
