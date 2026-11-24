import { useEffect, useRef, useState } from 'react'
import { Check, CornerDownRight, LoaderCircle, Undo2 } from 'lucide-react'
import type { ActionProposal } from '../core/types'
import type { ChatMessage } from '../state/demoStore'
import { useDemo, useDemoCtx } from '../state/DemoContext'
import { Composer } from './Composer'
import { Dot } from './Dot'
import { CLEAR_HIGHLIGHT_CHIP } from '../demo/scenario'

export function AiPanel() {
	const ctx = useDemoCtx()
	const messages = useDemo((s) => s.messages, [])
	const chips = useDemo((s) => s.chips, [])
	const busy = useDemo((s) => s.busy, false)
	const pending = useDemo((s) => s.pending, undefined)
	const committed = useDemo((s) => s.committed, [])
	const undoable = useDemo((s) => s.undoable, null)
	const listRef = useRef<HTMLDivElement>(null)

	// stay pinned to the newest message while replies stream in
	useEffect(() => {
		const el = listRef.current
		if (!el || typeof ResizeObserver === 'undefined') return
		const pin = () => {
			if (el.scrollTo) el.scrollTo({ top: el.scrollHeight })
		}
		const ro = new ResizeObserver(pin)
		Array.from(el.children).forEach((c) => ro.observe(c))
		const mo = new MutationObserver(() => {
			Array.from(el.children).forEach((c) => ro.observe(c))
			pin()
		})
		mo.observe(el, { childList: true, subtree: true, characterData: true })
		pin()
		return () => {
			ro.disconnect()
			mo.disconnect()
		}
	}, [])

	const sendChip = (chip: string) => {
		if (!ctx) return
		const s = ctx.store.getState()
		if (chip === CLEAR_HIGHLIGHT_CHIP) return s.clearHighlight()
		if (chip === 'Ask the team to vote') return void s.askVote()
		if (chip.startsWith('Approve ')) return void s.approveDirection('dir-warm')
		void s.send(chip)
	}

	return (
		<aside className="cc-ai" aria-label="AI">
			<div className="cc-panel-head">
				<h2 className="cc-panel-title">Assistant</h2>
				<span className="cc-ai__scope">Sees this board · asks before changing anything</span>
			</div>
			<div className="cc-ai__list" ref={listRef} aria-live="polite">
				{messages.map((m, i) => {
					// a proposal's card sits on the latest message that offered it (re-offers repeat the id)
					const latestForProposal = !!m.proposalId && !messages.slice(i + 1).some((n) => n.proposalId === m.proposalId)
					const lastCommitted = committed.at(-1)
					return (
						<Message
							key={m.id}
							m={m}
							proposal={latestForProposal && pending?.id === m.proposalId ? pending : undefined}
							accepted={latestForProposal && committed.some((c) => c.proposal?.id === m.proposalId)}
							canUndo={latestForProposal && lastCommitted?.proposal?.id === m.proposalId && !pending && undoable === lastCommitted?.step}
						/>
					)
				})}
			</div>
			<div className="cc-ai__foot">
				{chips.length > 0 && !busy ? (
					<div className="cc-chips" role="group" aria-label="Suggestions">
						{chips.map((c) => (
							<button key={c} type="button" className="cc-chip" onClick={() => sendChip(c)}>
								<CornerDownRight size={14} aria-hidden="true" />
								{c}
							</button>
						))}
					</div>
				) : null}
				<Composer disabled={busy || !!pending} onSend={(text) => ctx?.store.getState().send(text)} />
			</div>
		</aside>
	)
}

function Message({ m, proposal, accepted, canUndo }: { m: ChatMessage; proposal?: ActionProposal; accepted: boolean; canUndo: boolean }) {
	const ctx = useDemoCtx()
	if (m.role === 'user')
		return (
			<div className="cc-msg cc-msg--user">
				<p>{m.text}</p>
			</div>
		)
	const steps = m.thinking ?? []
	const shown = m.thinkingShown ?? steps.length
	return (
		<div className="cc-msg cc-msg--ai">
			{steps.length > 0 ? (
				<ol className="cc-steps" aria-label="What the assistant did">
					{steps.slice(0, Math.min(steps.length, shown + (m.working ? 1 : 0))).map((step, i) => {
						const done = i < shown
						return (
							<li key={step} data-done={done || undefined}>
								{done ? (
									<Check size={13} strokeWidth={2.5} aria-hidden="true" />
								) : (
									<LoaderCircle size={13} strokeWidth={2.5} className="cc-spin" aria-hidden="true" />
								)}
								{step}
							</li>
						)
					})}
				</ol>
			) : null}
			{m.text ? <StreamText text={m.text} /> : m.working && steps.length === 0 ? <TypingDots /> : null}
			{proposal ? <ProposalCard p={proposal} /> : null}
			{!proposal && accepted ? (
				<p className="cc-msg__status">
					<Check size={13} strokeWidth={2.5} aria-hidden="true" />
					Accepted
					{canUndo ? (
						<button type="button" className="cc-link-btn" onClick={() => ctx?.store.getState().undoLast()}>
							<Undo2 size={13} aria-hidden="true" />
							Undo
						</button>
					) : null}
				</p>
			) : null}
		</div>
	)
}

function ProposalCard({ p }: { p: ActionProposal }) {
	const ctx = useDemoCtx()
	const busy = useDemo((s) => s.busy, false)
	const s = ctx?.store.getState()
	return (
		<div className="cc-proposal" role="group" aria-label="Suggested change">
			<div className="cc-proposal__head">
				<Dot state="proposal" size="m" animate />
				<span className="cc-proposal__summary">{p.summary}</span>
			</div>
			<p className="cc-proposal__note">
				{p.external ? 'Changes a connected tool. Review the exact change first.' : 'Shown on the board as ghosts. Nothing is kept until you accept.'}
			</p>
			<div className="cc-proposal__actions">
				{p.external ? (
					<button type="button" className="cc-btn cc-btn--primary" onClick={() => s?.openSheet()} disabled={busy}>
						Review change
					</button>
				) : (
					<button type="button" className="cc-btn cc-btn--primary" onClick={() => s?.accept()} disabled={busy}>
						Accept
					</button>
				)}
				<button type="button" className="cc-btn cc-btn--ghost" onClick={() => s?.discardPending()} disabled={busy}>
					Discard
				</button>
			</div>
		</div>
	)
}

/** Reveals text word by word once, like a reply arriving. */
function StreamText({ text }: { text: string }) {
	const words = text.split(' ')
	const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
	const [n, setN] = useState(reduce ? words.length : 0)
	useEffect(() => {
		if (n >= words.length) return
		const t = setTimeout(() => setN((x) => Math.min(words.length, x + 2)), 22)
		return () => clearTimeout(t)
	}, [n, words.length])
	return (
		<p className="cc-msg__text">
			{words.slice(0, n).join(' ')}
			{n < words.length ? <span className="cc-msg__caret" aria-hidden="true" /> : null}
			<span className="cc-sr">{n < words.length ? text : ''}</span>
		</p>
	)
}

function TypingDots() {
	return (
		<span className="cc-typing" aria-label="Assistant is typing">
			<i />
			<i />
			<i />
		</span>
	)
}
