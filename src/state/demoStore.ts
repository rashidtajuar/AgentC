import { createStore, type StoreApi } from 'zustand/vanilla'
import type { Planner, PlanResult } from '../core/planner'
import type { ActionProposal, BeatId, ExecutionRun } from '../core/types'
import type { CanvasPort, StepId } from '../canvas/port'
import { COPY, EXECUTION_STEPS, PEOPLE } from '../demo/content'
import { BEATS, CLEAR_HIGHLIGHT_CHIP } from '../demo/scenario'
import { boardAtBeat, chipsFor, DECISION_ID, PR_ID, PROPOSAL_IDS } from '../demo/scriptedPlanner'
import { ARTIFACT_IDS, seedBoard } from '../demo/seed'
import { isAbort } from './delay'

export interface ChatMessage {
	id: string
	role: 'ai' | 'user'
	text: string
	thinking?: string[]
	thinkingShown?: number
	/** still revealing thinking / waiting for text */
	working?: boolean
	/** proposal this message offered */
	proposalId?: string
}

export interface Toast {
	id: string
	text: string
}

/** One accepted or applied step, and the canvas undo step it lives in. */
export interface Committed {
	beatBefore: BeatId
	step: StepId
	proposal?: ActionProposal
}

export interface DemoState {
	beat: BeatId
	busy: boolean
	messages: ChatMessage[]
	chips: string[]
	pending?: ActionProposal
	sheetOpen: boolean
	run?: ExecutionRun
	toasts: Toast[]
	/** teammate name → board id their cursor is heading to */
	presence: Record<string, string>
	popover: { boardId: string } | null
	committed: Committed[]

	init(): void
	send(prompt: string): Promise<void>
	accept(): void
	discardPending(): void
	undoLast(): void
	openSheet(): void
	closeSheet(): void
	approveDirection(directionId: string): Promise<void>
	askVote(): Promise<void>
	approveExternal(): Promise<void>
	restart(): void
	jumpTo(beat: BeatId): void
	openArtifact(boardId: string): void
	closePopover(): void
	showConnections(): Promise<void>
	toast(text: string): void
	dismissToast(id: string): void
	clearHighlight(): void
}

export interface DemoDeps {
	planner: Planner
	port: CanvasPort
	delay: (ms: number, signal: AbortSignal) => Promise<void>
}

export type DemoStore = StoreApi<DemoState>

const PACE = { thinkingStep: 560, beforeText: 320, voteTravel: 950, voteSettle: 650, execStep: 720, sheetClose: 1300, landed: 680 }

/** Board ids a proposal touches, for framing the camera. */
function idsToFrame(p: ActionProposal): string[] {
	return p.ops.flatMap((o) =>
		o.op === 'createFrame'
			? [o.id]
			: o.op === 'moveShapes'
				? o.moves.filter((m) => !m.parentId).map((m) => m.id)
				: o.op === 'connect'
					? [o.from, o.to]
					: o.op === 'createNote'
						? [o.parentId ?? o.id]
						: []
	)
}

export function createDemoStore({ planner, port, delay }: DemoDeps): DemoStore {
	let ctrl = new AbortController()
	let seq = 0
	const nextId = (p: string) => `${p}-${++seq}`
	let unlisten: (() => void) | null = null

	const store = createStore<DemoState>()((set, get) => {
		const signal = () => ctrl.signal
		const chips = (beat = get().beat) => (get().pending ? [] : chipsFor(port.read(), beat))
		const addMessage = (m: Omit<ChatMessage, 'id'>) => {
			const msg = { ...m, id: nextId('m') }
			set((s) => ({ messages: [...s.messages, msg] }))
			return msg.id
		}
		const patchMessage = (id: string, patch: Partial<ChatMessage>) =>
			set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) }))

		/** Stop anything in flight (thinking, votes, an execution run). */
		function abortInFlight() {
			ctrl.abort()
			ctrl = new AbortController()
			set({ busy: false, presence: {} })
		}

		/** Fire-and-forget wait tied to the current run, so Restart/Jump/undo cancel it. */
		function later(ms: number, fn: () => void) {
			delay(ms, signal()).then(fn, () => {})
		}

		/** Reveal thinking steps then the message text, at a natural pace. */
		async function speak(result: Pick<PlanResult, 'thinking' | 'message'>, extra: Partial<ChatMessage> = {}) {
			const sig = signal()
			const id = addMessage({ role: 'ai', text: '', thinking: result.thinking, thinkingShown: 0, working: true, ...extra })
			for (let i = 0; i < result.thinking.length; i++) {
				await delay(PACE.thinkingStep, sig)
				patchMessage(id, { thinkingShown: i + 1 })
			}
			await delay(PACE.beforeText, sig)
			patchMessage(id, { text: result.message, working: false })
			return id
		}

		// the suggestion a Cmd+Z took off the board, so a redo can put it back with Accept and Discard
		let undonePreview: ActionProposal | null = null

		function offer(p: ActionProposal) {
			undonePreview = null
			set({ pending: p, chips: [], run: undefined })
			if (p.external) return
			port.preview(p.ops, p.id)
			const ids = idsToFrame(p)
			// frame once the cards have landed (the move tween runs ~620ms)
			if (ids.length) later(PACE.landed, () => port.focus(ids))
		}

		/** Drop a waiting canvas preview without the busy guard (internal use). */
		function dropPending() {
			undonePreview = null
			const p = get().pending
			if (!p) return
			if (!p.external) port.discard()
			set({ pending: undefined, sheetOpen: false })
		}

		async function guarded(fn: () => Promise<void>) {
			if (get().busy) return
			set({ busy: true })
			const mine = ctrl
			try {
				await fn()
			} catch (e) {
				if (!isAbort(e)) throw e
			} finally {
				if (mine === ctrl) set({ busy: false })
			}
		}

		function reset(beat: BeatId) {
			abortInFlight()
			undonePreview = null
			port.highlight(null)
			set({ beat, pending: undefined, sheetOpen: false, run: undefined, toasts: [], popover: null, committed: [] })
		}

		/** React to the canvas changing under us: only real undos rewind the story. */
		function onBoardChange() {
			if (port.previewWasUndone()) {
				abortInFlight()
				undonePreview = get().pending ?? null
				set({ pending: undefined })
				set({ chips: chips() })
			} else if (undonePreview && port.previewWasRedone()) {
				abortInFlight()
				set({ pending: undonePreview, chips: [], run: undefined })
				undonePreview = null
			}
			const { committed } = get()
			let keep = committed.length
			while (keep > 0 && !port.isStepActive(committed[keep - 1].step)) keep--
			if (keep === committed.length) return
			const first = committed[keep]
			abortInFlight()
			dropPending()
			set({ committed: committed.slice(0, keep), beat: first.beatBefore, run: undefined })
			later(0, () => {
				if (first.proposal) {
					addMessage({ role: 'ai', text: 'Undone. The suggestion is back if you want it.', proposalId: first.proposal.id })
					offer(first.proposal)
				} else {
					set({ chips: chips() })
				}
			})
		}

		async function handle(result: PlanResult) {
			switch (result.intent) {
				case 'propose':
					await speak(result, { proposalId: result.proposal?.id })
					if (result.proposal) offer(result.proposal)
					return
				case 'vote':
					await runVote()
					return
				case 'approve':
					await runApproval(result)
					return
				case 'show-connections':
					port.highlight(result.highlightIds ?? null)
					if (result.highlightIds?.length) port.focus(result.highlightIds)
					await speak(result)
					set({ beat: 6, chips: [CLEAR_HIGHLIGHT_CHIP] })
					return
				default:
					await speak(result)
					set({ chips: get().pending ? [] : result.chips })
			}
		}

		async function runVote() {
			const sig = signal()
			// votes land on Warm & tactile: frame it close enough to see the stickers go on
			port.focus(['dir-warm'])
			await speak({ thinking: [], message: COPY.voteAsk })
			for (const voter of [PEOPLE.maya.name, PEOPLE.jon.name]) {
				set((s) => ({ presence: { ...s.presence, [voter]: 'dir-warm' } }))
				await delay(PACE.voteTravel, sig)
				port.apply([{ op: 'addVote', directionId: 'dir-warm', voter }])
				await delay(PACE.voteSettle, sig)
				set((s) => {
					const presence = { ...s.presence }
					delete presence[voter]
					return { presence }
				})
			}
			const n = port.read().votes['dir-warm']?.length ?? 0
			await speak({ thinking: [], message: COPY.voteDone(n) })
			set({ chips: chips() })
		}

		async function runApproval(result: PlanResult) {
			// a waiting suggestion is set aside first, so the approval is never folded into its undo step
			dropPending()
			const beatBefore = get().beat
			const step = port.apply(result.commitOps ?? [])
			set((s) => ({ committed: [...s.committed, { beatBefore, step }] }))
			port.focus(['dir-warm', DECISION_ID])
			await speak(result, { proposalId: result.proposal?.id })
			if (result.proposal) offer(result.proposal)
		}

		async function sayNotInDemo() {
			await speak({ thinking: [], message: COPY.notInDemo })
			set({ chips: chips() })
		}

		function greet() {
			const b = port.read()
			const refs = b.shapes.filter((s) => s.type === 'reference').length
			const files = b.shapes.filter((s) => s.type === 'artifact').length
			return COPY.greeting(refs, files)
		}

		return {
			beat: 0,
			busy: false,
			messages: [],
			chips: [],
			sheetOpen: false,
			toasts: [],
			presence: {},
			popover: null,
			committed: [],

			init() {
				unlisten?.()
				get().restart()
				unlisten = port.onChange(onBoardChange)
			},

			async send(prompt) {
				if (!prompt.trim() || get().busy || get().pending) return
				await guarded(async () => {
					port.highlight(null)
					addMessage({ role: 'user', text: prompt.trim() })
					set({ chips: [] })
					const result = planner.plan(prompt, { beat: get().beat, board: port.read(), selection: [] })
					await handle(result)
				})
			},

			accept() {
				const p = get().pending
				if (!p || get().busy) return
				if (p.external) return set({ sheetOpen: true })
				const step = port.commit()
				if (step) set((s) => ({ committed: [...s.committed, { beatBefore: s.beat, step, proposal: p }] }))
				set({ pending: undefined, beat: p.beat })
				if (p.id === PROPOSAL_IDS.organize) port.focus(['dir-warm', 'dir-editorial', 'dir-playful'])
				set({ chips: chips(p.beat) })
			},

			discardPending() {
				if (!get().pending || get().busy) return
				dropPending()
				addMessage({ role: 'ai', text: 'Discarded. Nothing changed.' })
				set({ chips: chips() })
			},

			undoLast() {
				if (get().busy) return
				const last = get().committed.at(-1)
				if (!last) return port.undo()
				// clicks after accepting leave small history entries on top: step back until this step is gone
				for (let i = 0; i < 25 && port.isStepActive(last.step); i++) port.undo()
			},

			openSheet() {
				if (get().pending?.external) set({ sheetOpen: true })
			},
			closeSheet() {
				if (get().run && get().busy) return
				set({ sheetOpen: false })
			},

			async approveDirection(directionId) {
				if (get().busy) return
				if (directionId !== 'dir-warm') return guarded(sayNotInDemo)
				const p = get().pending
				// Warm's follow-up is already on screen
				if (p && (p.external || p.id === PROPOSAL_IDS.links)) return
				if (port.read().dots['dir-warm'] === 'approved') return
				if (!planner.approve) return
				await guarded(async () => {
					const result = planner.approve!('dir-warm', { beat: get().beat, board: port.read(), selection: [] })
					await handle(result)
				})
			},

			async askVote() {
				if (get().pending) return
				await guarded(async () => {
					addMessage({ role: 'user', text: BEATS[2].chip! })
					set({ chips: [] })
					await runVote()
				})
			},

			async approveExternal() {
				const p = get().pending
				if (!p?.external || get().run) return
				await guarded(async () => {
					const sig = signal()
					const beatBefore = get().beat
					set({ sheetOpen: true, run: { proposalId: p.id, steps: EXECUTION_STEPS.map((s) => ({ ...s, state: 'pending' })) } })
					for (let i = 0; i < EXECUTION_STEPS.length; i++) {
						set((s) => ({ run: s.run && { ...s.run, steps: s.run.steps.map((st, j) => (j === i ? { ...st, state: 'running' } : st)) } }))
						await delay(PACE.execStep, sig)
						set((s) => ({ run: s.run && { ...s.run, steps: s.run.steps.map((st, j) => (j === i ? { ...st, state: 'done' } : st)) } }))
					}
					const step = port.apply(p.ops)
					set((s) => ({ committed: [...s.committed, { beatBefore, step, proposal: p }], pending: undefined, beat: 5 }))
					get().toast('Nothing was merged or deployed.')
					await delay(PACE.sheetClose, sig)
					set({ sheetOpen: false })
					port.focus([DECISION_ID, PR_ID, ARTIFACT_IDS.logo, ARTIFACT_IDS.webUi, ARTIFACT_IDS.theme])
					await speak({ thinking: [], message: COPY.executed })
					set({ chips: chips(5) })
				})
			},

			restart() {
				reset(0)
				port.load(seedBoard())
				seq = 0
				set({ messages: [{ id: nextId('m'), role: 'ai', text: greet() }] })
				set({ chips: chips(0) })
			},

			jumpTo(beat) {
				reset(beat)
				port.load(boardAtBeat(beat))
				seq = 0
				set({ messages: [{ id: nextId('m'), role: 'ai', text: `Jumped to “${BEATS[beat].name}”.` }] })
				if (beat === 4) {
					const r = planner.plan(BEATS[3].chip!, { beat: 3, board: port.read(), selection: [] })
					if (r.proposal) {
						addMessage({ role: 'ai', text: r.message, proposalId: r.proposal.id })
						offer(r.proposal)
						return
					}
				}
				set({ chips: chips(beat) })
			},

			openArtifact(boardId) {
				set({ popover: { boardId } })
			},
			closePopover() {
				set({ popover: null })
			},

			async showConnections() {
				await get().send(BEATS[5].chip!)
			},

			toast(text) {
				const t = { id: nextId('t'), text }
				set((s) => ({ toasts: [...s.toasts, t] }))
			},
			dismissToast(id) {
				set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
			},
			clearHighlight() {
				port.highlight(null)
				if (get().chips.includes(CLEAR_HIGHLIGHT_CHIP)) set({ chips: chips() })
			},
		}
	})
	return store
}
