import 'tldraw/tldraw.css'
import '@fontsource/gloock'
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource/young-serif'
import '../styles/shapes.css'
import { getAssetUrlsByImport } from '@tldraw/assets/imports.vite'
import { DefaultStylePanel, Tldraw, useEditor, useValue, type Editor, type TldrawProps, type TLComponents, type TLUiStylePanelProps } from 'tldraw'
import { customShapeUtils } from './shapes'

const assetUrls = getAssetUrlsByImport()

/** Style controls only while something is selected, so the board stays clear. */
function SelectionStylePanel(props: TLUiStylePanelProps) {
	const editor = useEditor()
	const hasStyleable = useValue(
		'styleable selection',
		() => editor.getSelectedShapes().some((s) => !s.type.startsWith('cc-')),
		[editor]
	)
	const isDrawing = useValue('drawing tool', () => editor.getCurrentToolId() !== 'select' && editor.getCurrentToolId() !== 'hand', [editor])
	const hasSelection = hasStyleable || isDrawing
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


export function Canvas({ onMount, getShapeVisibility }: {
	onMount: (editor: Editor) => void
	getShapeVisibility?: TldrawProps['getShapeVisibility']
}) {
	return <Tldraw licenseKey={import.meta.env.VITE_TLDRAW_LICENSE_KEY} shapeUtils={customShapeUtils} assetUrls={assetUrls} components={components} onMount={onMount} getShapeVisibility={getShapeVisibility} />
}
