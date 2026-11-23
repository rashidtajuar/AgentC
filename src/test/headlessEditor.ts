// A real tldraw Editor in jsdom, for testing the canvas adapter without a browser.
import {
	createTLStore,
	defaultAddFontsFromNode,
	defaultBindingUtils,
	defaultShapeTools,
	defaultShapeUtils,
	defaultTools,
	Editor,
	registerDefaultSideEffects,
	tipTapDefaultExtensions,
} from 'tldraw'
import { customShapeUtils } from '../canvas/shapes'

// a rAF clock on the same basis as performance.now(), so tweens advance in tests
globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) =>
	setTimeout(() => cb(performance.now()), 16) as unknown as number) as typeof requestAnimationFrame
globalThis.cancelAnimationFrame = ((id: number) => clearTimeout(id)) as typeof cancelAnimationFrame

export function makeEditor() {
	const elm = document.createElement('div')
	const bounds = { x: 0, y: 0, top: 0, left: 0, width: 1080, height: 720, bottom: 720, right: 1080 }
	elm.getBoundingClientRect = () => bounds as DOMRect
	document.body.appendChild(elm)
	const shapeUtils = [...defaultShapeUtils, ...customShapeUtils]
	const bindingUtils = [...defaultBindingUtils]
	const editor = new Editor({
		shapeUtils,
		bindingUtils,
		tools: [...defaultTools, ...defaultShapeTools],
		store: createTLStore({ shapeUtils, bindingUtils }),
		getContainer: () => elm,
		initialState: 'select',
		options: { text: { addFontsFromNode: defaultAddFontsFromNode, tipTapConfig: { extensions: tipTapDefaultExtensions } } } as never,
	})
	registerDefaultSideEffects(editor)
	editor.updateViewportScreenBounds(elm)
	return editor
}

export const frames = (ms = 50) => new Promise((r) => setTimeout(r, ms))
