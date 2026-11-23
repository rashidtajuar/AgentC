import type { ActionProposal, BeatId, Board } from './types'

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
	chips: string[]
}

/** Anything that turns a prompt plus board context into a plan: scripted today, a live model later. */
export interface Planner {
	plan(prompt: string, ctx: PlanContext): PlanResult
}
