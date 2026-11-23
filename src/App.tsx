import { useCallback, useEffect, useState } from 'react'
import { getAssetUrlsByImport } from '@tldraw/assets/imports.vite'
import { DefaultStylePanel, Tldraw, useEditor, useValue, type Editor, type TLComponents, type TLUiStylePanelProps } from 'tldraw'
import { CC_EVENTS } from './canvas/canvasUi'
import type { CanvasPort } from './canvas/port'
import { customShapeUtils } from './canvas/shapes'
import { createTldrawPort } from './canvas/tldrawPort'
import { ScriptedPlanner } from './demo/scriptedPlanner'
import { DemoProvider } from './state/DemoContext'
import { delay } from './state/delay'
import { createDemoStore, type DemoStore } from './state/demoStore'
import { AiPanel } from './ui/AiPanel'
import { PresenceLayer } from './ui/PresenceLayer'
import { SourcesRail } from './ui/SourcesRail'
import { Toasts } from './ui/Toasts'
import { TopBar } from './ui/TopBar'

const assetUrls = getAssetUrlsByImport()

/** Style controls only while something is selected, so the board stays clear. */
function SelectionStylePanel(props: TLUiStylePanelProps) {
	const editor = useEditor()
	const hasSelection = useValue('has selection', () => editor.getSelectedShapeIds().length > 0, [editor])
	return hasSelection ? <DefaultStylePanel {...props} /> : null
}

const components: TLComponents = {
	StylePanel: SelectionStylePanel,
	MainMenu: null,
	PageMenu: null,
	HelpMenu: null,
	DebugMenu: null,
	DebugPanel: null,
	SharePanel: null,
	Minimap: null,
}

export default function App() {
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
		window.addEventListener(CC_EVENTS.approve, onApprove)
		window.addEventListener(CC_EVENTS.openArtifact, onOpen)
		return () => {
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
				<Tldraw
					licenseKey={import.meta.env.VITE_TLDRAW_LICENSE_KEY}
					shapeUtils={customShapeUtils}
					assetUrls={assetUrls}
					components={components}
					onMount={onMount}
				/>
				<PresenceLayer />
				<Toasts />
			</main>
			<AiPanel />
		</div>
		</DemoProvider>
	)
}
