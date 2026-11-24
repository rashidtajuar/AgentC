import { useCallback, useEffect, useState } from 'react'
import type { Editor } from 'tldraw'
import { Canvas } from './canvas/Canvas'
import { CC_EVENTS } from './canvas/canvasUi'
import type { CanvasPort } from './canvas/port'
import { createTldrawPort } from './canvas/tldrawPort'
import { ScriptedPlanner } from './demo/scriptedPlanner'
import { DemoProvider } from './state/DemoContext'
import { delay } from './state/delay'
import { createDemoStore, type DemoStore } from './state/demoStore'
import { AiPanel } from './ui/AiPanel'
import { ArtifactPopover } from './ui/ArtifactPopover'
import { ProposalSheet } from './ui/ProposalSheet'
import { PresenceLayer } from './ui/PresenceLayer'
import { SourcesRail } from './ui/SourcesRail'
import { Toasts } from './ui/Toasts'
import { TopBar } from './ui/TopBar'

export default function DemoApp() {
	const [demo, setDemo] = useState<{ store: DemoStore; port: CanvasPort } | null>(null)

	const onMount = useCallback((editor: Editor) => {
		editor.user.updateUserPreferences({ colorScheme: 'light' })
		editor.updateInstanceState({ isGridMode: false })
		if (import.meta.env.DEV) (window as unknown as { __editor: Editor }).__editor = editor
		const port = createTldrawPort(editor)
		const store = createDemoStore({ planner: new ScriptedPlanner(), port, delay })
		store.getState().init()
		setDemo({ store, port })
	}, [])

	useEffect(() => {
		if (!demo) return
		const onApprove = (e: Event) => {
			const id = (e as CustomEvent<{ directionId?: string }>).detail?.directionId
			if (id) void demo.store.getState().approveDirection(id)
		}
		const onOpen = (e: Event) => {
			const id = (e as CustomEvent<{ boardId?: string }>).detail?.boardId
			if (id) demo.store.getState().openArtifact(id)
		}
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') demo.store.getState().clearHighlight()
		}
		window.addEventListener('keydown', onKey)
		window.addEventListener(CC_EVENTS.approve, onApprove)
		window.addEventListener(CC_EVENTS.openArtifact, onOpen)
		return () => {
			window.removeEventListener('keydown', onKey)
			window.removeEventListener(CC_EVENTS.approve, onApprove)
			window.removeEventListener(CC_EVENTS.openArtifact, onOpen)
		}
	}, [demo])

	return (
		<DemoProvider value={demo}>
		<div className="cc-app">
			<TopBar />
			<SourcesRail />
			<main className="cc-canvas" aria-label="Canvas">
				<Canvas onMount={onMount} />
				<PresenceLayer />
				<ArtifactPopover />
				<ProposalSheet />
				<Toasts />
			</main>
			<AiPanel />
		</div>
		</DemoProvider>
	)
}
