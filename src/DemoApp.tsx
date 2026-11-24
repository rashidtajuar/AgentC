import { useCallback, useEffect, useState } from 'react'
import { BotMessageSquare, Layers } from 'lucide-react'
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
import { DemoReviewButton, TopBar } from './ui/TopBar'
import { PanelSizeControls } from './workspace/PanelSizeControls'
import './styles/demoMobile.css'

export default function DemoApp() {
	const [dock, setDock] = useState<'sources' | 'assistant' | null>(null)
	const [expanded, setExpanded] = useState(false)
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

	function toggle(panel: 'sources' | 'assistant') {
		setExpanded(false)
		setDock((current) => current === panel ? null : panel)
	}

	return (
		<DemoProvider value={demo}>
		<div className="cc-app cc-sample-app" data-dock={dock ?? 'closed'} data-expanded={expanded}>
			<TopBar />
			<SourcesRail controls={<PanelSizeControls expanded={expanded} onResize={() => setExpanded(!expanded)} onClose={() => toggle('sources')} name="Sources" />} />
			<main className="cc-canvas" aria-label="Canvas">
				<Canvas onMount={onMount} />
				<PresenceLayer />
				<ArtifactPopover />
				<ProposalSheet />
				<Toasts />
			</main>
			<AiPanel controls={<PanelSizeControls expanded={expanded} onResize={() => setExpanded(!expanded)} onClose={() => toggle('assistant')} name="Assistant" />} />
			<div className="cc-mobile-dock cc-demo-dock" role="group" aria-label="Sample canvas controls">
				<button type="button" className="cc-board-icon cc-demo-dock-button" aria-expanded={dock === 'sources'} aria-controls="sample-sources" onClick={() => toggle('sources')}><Layers size={18} /><span>Sources</span></button>
				<button type="button" className="cc-board-icon cc-demo-dock-button" aria-expanded={dock === 'assistant'} aria-controls="sample-assistant" onClick={() => toggle('assistant')}><BotMessageSquare size={18} /><span>Assistant</span></button>
				<DemoReviewButton compact />
			</div>
		</div>
		</DemoProvider>
	)
}
