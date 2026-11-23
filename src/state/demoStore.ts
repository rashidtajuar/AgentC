import { createStore, type StoreApi } from 'zustand/vanilla'
import type { Planner, PlanResult } from '../core/planner'
import type { ActionProposal, BeatId, CanvasOp, ExecutionRun } from '../core/types'
import type { CanvasPort } from '../canvas/port'
import { COPY, EXECUTION_STEPS, PEOPLE } from '../demo/content'
import { BEATS } from '../demo/scenario'
import { boardAtBeat, chipsFor, DECISION_ID, PR_ID, PROPOSAL_IDS } from '../demo/scriptedPlanner'
import { seedBoard } from '../demo/seed'
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

interface Committed {
	beatBefore: BeatId
	/** board id whose disappearance means this step was undone */
	sentinel: string
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

const PACE = { thinkingStep: 560, beforeText: 320, voteTravel: 950, voteSettle: 650, execStep: 720, sheetClose: 1300 }

const sentinelOf = (p: ActionProposal): string | undefined => {
	for (const op of p.ops) {
		if (op.op === 'createFrame' || op.op === 'createNote' || op.op === 'connect') return op.id
		if (op.op === 'createShape') return op.shape.id
	}
	return undefined
}

export function createDemoStore({ planner, port, delay }: DemoDeps): DemoStore {
	let ctrl = new AbortController()
	let seq = 0
	const nextId = (p: string) => `${p}-${++seq}`
	let unlisten: (() => void) | null = null

	const store = createStore<DemoState>()((set, get) => {
		const signal = () => ctrl.signal
		const chips = (beat = get().beat) => chipsFor(port.read(), beat)
		const addMessage = (m: Omit<ChatMessage, 'id'>) => {
			const msg = { ...m, id: nextId('m') }
			set((s) => ({ messages: [...s.messages, msg] }))
			return msg.id
		}
		const patchMessage = (id: string, patch: Partial<ChatMessage>) =>
			set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) }))

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

		function offer(p: ActionProposal) {
			set({ pending: p, chips: [], run: undefined })
			if (!p.external) port.preview(p.ops, p.id)
		}

		function pushCommitted(c: Committed) {
			set((s) => ({ committed: [...s.committed, c] }))
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
			ctrl.abort()
			ctrl = new AbortController()
			port.highlight(null)
			set({
				beat,
				busy: false,
				pending: undefined,
				sheetOpen: false,
				run: undefined,
				toasts: [],
				presence: {},
				popover: null,
				committed: [],
			})
		}

		function onBoardChange() {
			const { committed } = get()
			const top = committed.at(-1)
			if (!top || port.exists(top.sentinel)) return
			// a person undid the last accepted step
			set((s) => ({ committed: s.committed.slice(0, -1), beat: top.beatBefore, pending: undefined }))
			setTimeout(() => {
				if (top.proposal) {
					offer(top.proposal)
					addMessage({ role: 'ai', text: 'Undone. The suggestion is back if you want it.', proposalId: top.proposal.id })
				} else {
					set({ chips: chips() })
				}
			}, 0)
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
					set({ beat: 6, chips: [] })
					return
				default:
					await speak(result)
					set({ chips: result.chips })
			}
		}

		async function runVote() {
			const sig = signal()
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
			if (get().pending) discardPending()
			const beatBefore = get().beat
			port.apply(result.commitOps ?? [])
			pushCommitted({ beatBefore, sentinel: DECISION_ID })
			port.focus(['dir-warm', DECISION_ID])
			await speak(result, { proposalId: result.proposal?.id })
			if (result.proposal) offer(result.proposal)
		}

		function discardPending() {
			const p = get().pending
			if (!p || get().busy) return
			if (!p.external) port.discard()
			set({ pending: undefined, sheetOpen: false })
			addMessage({ role: 'ai', text: 'Discarded. Nothing changed.' })
			set({ chips: chips() })
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
				port.commit()
				const sentinel = sentinelOf(p)
				if (sentinel) pushCommitted({ beatBefore: get().beat, sentinel, proposal: p })
				set({ pending: undefined, beat: p.beat })
				set({ chips: chips(p.beat) })
			},

			discardPending,

			openSheet() {
				if (get().pending?.external) set({ sheetOpen: true })
			},
			closeSheet() {
				if (get().run && get().busy) return
				set({ sheetOpen: false })
			},

			async approveDirection(directionId) {
				if (get().busy) return
				if (get().pending && !get().pending?.external && get().pending?.id !== PROPOSAL_IDS.gaps) return
				await guarded(async () => {
					const result = planner.plan(`approve ${directionId.replace('dir-', '')}`, {
						beat: get().beat,
						board: port.read(),
						selection: [],
					})
					if (result.intent === 'approve' || result.intent === 'not-in-demo') return handle(result)
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
					port.apply(p.ops)
					pushCommitted({ beatBefore, sentinel: PR_ID, proposal: p })
					set({ pending: undefined, beat: 5 })
					get().toast('Nothing was merged or deployed.')
					await delay(PACE.sheetClose, sig)
					set({ sheetOpen: false })
					port.focus([DECISION_ID, PR_ID])
					await speak({ thinking: [], message: COPY.executed })
					set({ chips: chips(5) })
				})
			},

			restart() {
				reset(0)
				port.load(seedBoard())
				seq = 0
				set({ messages: [{ id: nextId('m'), role: 'ai', text: COPY.greeting }] })
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
			},
		}
	})
	return store
}

export type { CanvasOp }
