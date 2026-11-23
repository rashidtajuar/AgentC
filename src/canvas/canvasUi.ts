import { create } from 'zustand'

/** Transient canvas view state that must not enter undo history. */
interface CanvasUiState {
	/** board ids to emphasise; everything else dims. null = no highlight */
	highlight: Set<string> | null
	setHighlight: (ids: string[] | null) => void
}

export const useCanvasUi = create<CanvasUiState>((set) => ({
	highlight: null,
	setHighlight: (ids) => set({ highlight: ids ? new Set(ids) : null }),
}))

export type LitState = 'lit' | 'dim' | 'none'

export function litState(highlight: Set<string> | null, boardId: string | undefined): LitState {
	if (!highlight || !boardId) return 'none'
	return highlight.has(boardId) ? 'lit' : 'dim'
}

export const CC_EVENTS = {
	approve: 'cc:approve',
	openArtifact: 'cc:open-artifact',
} as const

export function emit(name: string, detail: Record<string, unknown>) {
	window.dispatchEvent(new CustomEvent(name, { detail }))
}
