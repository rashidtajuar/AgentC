import type { Editor, TLShape } from 'tldraw'

export const BOARD_COLORS = {
	pinboard: { label: 'Cool gray', value: '#e4e7eb' },
	paper: { label: 'Paper', value: '#f4f3ee' },
	sand: { label: 'Sand', value: '#eee5d7' },
	sage: { label: 'Sage', value: '#e2eae1' },
	mist: { label: 'Blue mist', value: '#e1e9f2' },
} as const

export interface BoardView {
	mode: 'moodboard' | 'map'
	color: keyof typeof BOARD_COLORS
	dotted: boolean
}

export const DEFAULT_VIEW: BoardView = { mode: 'moodboard', color: 'pinboard', dotted: true }

export function viewKey(projectId: string) {
	return `agentc:view:v1:${projectId}`
}

export function readView(projectId: string): BoardView {
	try {
		const value = JSON.parse(localStorage.getItem(viewKey(projectId)) ?? '{}') as Partial<BoardView>
		return {
			mode: value.mode === 'map' ? 'map' : 'moodboard',
			color: value.color && Object.hasOwn(BOARD_COLORS, value.color) ? value.color : 'pinboard',
			dotted: typeof value.dotted === 'boolean' ? value.dotted : true,
		}
	} catch {
		return DEFAULT_VIEW
	}
}

export function isConnection(shape: TLShape, editor: Editor) {
	if (shape.type !== 'arrow') return false
	if (shape.meta.rel) return true
	const bindings = editor.getBindingsFromShape(shape, 'arrow')
	return bindings.some((b) => b.props.terminal === 'start') && bindings.some((b) => b.props.terminal === 'end')
}

export function hasConnection(editor: Editor, first: TLShape, second: TLShape) {
	return editor.getBindingsToShape(first, 'arrow').some(({ fromId }) =>
		editor.getBindingsFromShape(fromId, 'arrow').some((binding) => binding.toId === second.id)
	)
}
