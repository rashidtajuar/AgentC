import type { ActionProposal, BeatId, Board, CanvasOp } from './types'

export type PlanIntent = 'propose' | 'vote' | 'approve' | 'show-connections' | 'help' | 'not-in-demo'

export interface PlanContext {
	beat: BeatId
	board: Board
	selection: string[]
}

export interface PlanResult {
	/** Short visible reasoning steps shown before the message */
	thinking: string[]
	message: string
	proposal?: ActionProposal
	/** Changes a person made directly (e.g. approving a direction): applied immediately, no preview */
	commitOps?: CanvasOp[]
	/** Shapes to highlight on the canvas */
	highlightIds?: string[]
	intent: PlanIntent
	chips: string[]
}

/** Anything that turns a prompt plus board context into a plan: scripted today, a live model later. */
export interface Planner {
	plan(prompt: string, ctx: PlanContext): PlanResult
	/** A person approved a direction directly (a button, not a prompt): record it and suggest follow-ups. */
	approve?(directionId: string, ctx: PlanContext): PlanResult
}
