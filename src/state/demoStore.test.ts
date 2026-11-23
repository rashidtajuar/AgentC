import { beforeEach, describe, expect, it } from 'vitest'
import { COPY } from '../demo/content'
import { BEATS } from '../demo/scenario'
import { boardAtBeat, ScriptedPlanner } from '../demo/scriptedPlanner'
import { seedBoard } from '../demo/seed'
import { FakePort, instantDelay, manualDelay, settle } from '../test/fakePort'
import { createDemoStore } from './demoStore'

let port: FakePort
const make = (delay = instantDelay) => {
	const store = createDemoStore({ planner: new ScriptedPlanner(), port, delay })
	store.getState().init()
	return store
}

beforeEach(() => {
	port = new FakePort()
})

describe('demo store', () => {
	it('starts on a clean wall with the greeting and the Organize chip', () => {
		const s = make().getState()
		expect(port.calls[0]).toBe('load')
		expect(s.beat).toBe(0)
		expect(s.messages.at(-1)?.text).toBe(COPY.greeting)
		expect(s.chips).toEqual([BEATS[0].chip])
		expect(s.pending).toBeUndefined()
	})

	it('send at beat 0 previews the organize ops and sets pending', async () => {
		const store = make()
		await store.getState().send(BEATS[0].chip!)
		const s = store.getState()
		expect(port.calls).toContain('preview:prop-organize')
		expect(s.pending?.id).toBe('prop-organize')
		expect(s.messages.at(-1)?.text).toBe(COPY.organize.message)
		expect(s.messages.at(-1)?.thinkingShown).toBe(COPY.organize.thinking.length)
	})

	it('accept commits, clears pending and advances the beat', async () => {
		const store = make()
		await store.getState().send(BEATS[0].chip!)
		store.getState().accept()
		const s = store.getState()
		expect(port.calls.at(-1)).toBe('commit')
		expect(s.pending).toBeUndefined()
		expect(s.beat).toBe(1)
		expect(s.chips).toEqual([BEATS[1].chip, BEATS[2].chip])
	})

	it('discard throws the preview away and keeps the beat', async () => {
		const store = make()
		await store.getState().send(BEATS[0].chip!)
		store.getState().discardPending()
		expect(port.calls.at(-1)).toBe('discard')
		expect(store.getState().beat).toBe(0)
		expect(store.getState().chips).toEqual([BEATS[0].chip])
	})

	it('a second send while busy is ignored', async () => {
		const m = manualDelay()
		const store = make(m.delay)
		const first = store.getState().send(BEATS[0].chip!)
		const second = store.getState().send(BEATS[0].chip!)
		await m.releaseAll()
		await Promise.all([first, second])
		expect(port.calls.filter((c) => c.startsWith('preview')).length).toBe(1)
		expect(store.getState().messages.filter((x) => x.role === 'user').length).toBe(1)
	})

	it('double accept commits once', async () => {
		const store = make()
		await store.getState().send(BEATS[0].chip!)
		store.getState().accept()
		store.getState().accept()
		expect(port.calls.filter((c) => c === 'commit').length).toBe(1)
	})

	it('undo after accept rewinds the beat and re-offers the proposal', async () => {
		const store = make()
		await store.getState().send(BEATS[0].chip!)
		store.getState().accept()
		port.simulateUndo(seedBoard())
		await settle()
		const s = store.getState()
		expect(s.beat).toBe(0)
		expect(s.pending?.id).toBe('prop-organize')
		expect(port.calls.filter((c) => c === 'preview:prop-organize').length).toBe(2)
	})

	it('approving Editorial replies "not in demo" and changes nothing', async () => {
		const store = make()
		store.getState().jumpTo(2)
		const before = structuredClone(port.board)
		await store.getState().approveDirection('dir-editorial')
		expect(store.getState().messages.at(-1)?.text).toBe(COPY.notInDemo)
		expect(port.board).toEqual(before)
		expect(store.getState().beat).toBe(2)
	})

	it('askVote adds votes for Maya and Jon on dir-warm only', async () => {
		const store = make()
		store.getState().jumpTo(2)
		await store.getState().askVote()
		expect(port.board.votes).toEqual({ 'dir-warm': ['Maya', 'Jon'] })
		expect(store.getState().messages.at(-1)?.text).toBe(COPY.voteDone(2))
		expect(store.getState().presence).toEqual({})
	})

	it('approving Warm & tactile records the decision and previews 3 links', async () => {
		const store = make()
		store.getState().jumpTo(2)
		await store.getState().approveDirection('dir-warm')
		expect(port.board.dots['dir-warm']).toBe('approved')
		expect(port.board.shapes.some((s) => s.id === 'decision-warm')).toBe(true)
		expect(store.getState().pending?.id).toBe('prop-links')
		expect(port.previewing?.ops.filter((o) => o.op === 'connect')).toHaveLength(3)
	})

	it('approveExternal runs 3 steps, pins the PR and says nothing was merged', async () => {
		const store = make()
		store.getState().jumpTo(3)
		await store.getState().send(BEATS[3].chip!)
		expect(store.getState().pending?.external).toBe(true)
		expect(port.calls.some((c) => c === 'preview:prop-apply')).toBe(false)
		await store.getState().approveExternal()
		const s = store.getState()
		expect(s.run?.steps.map((x) => x.state)).toEqual(['done', 'done', 'done'])
		expect(port.board.shapes.some((x) => x.id === 'pr-42')).toBe(true)
		expect(s.toasts.map((t) => t.text)).toContain('Nothing was merged or deployed.')
		expect(s.beat).toBe(5)
		expect(s.pending).toBeUndefined()
	})

	it('approveExternal twice runs once', async () => {
		const store = make()
		store.getState().jumpTo(4)
		await Promise.all([store.getState().approveExternal(), store.getState().approveExternal()])
		expect(port.calls.filter((c) => c === 'apply').length).toBe(1)
	})

	it('restart during thinking aborts: no further messages arrive', async () => {
		const m = manualDelay()
		const store = make(m.delay)
		const sending = store.getState().send(BEATS[0].chip!)
		store.getState().restart()
		await m.releaseAll()
		await sending
		const s = store.getState()
		expect(s.messages.map((x) => x.text)).toEqual([COPY.greeting])
		expect(s.pending).toBeUndefined()
		expect(s.busy).toBe(false)
	})

	it('jumpTo(4) loads the approved board and re-offers the code change', () => {
		const store = make()
		store.getState().jumpTo(4)
		expect(port.board).toEqual(boardAtBeat(4))
		expect(store.getState().beat).toBe(4)
		expect(store.getState().pending?.id).toBe('prop-apply')
	})

	it('showConnections highlights the lineage', async () => {
		const store = make()
		store.getState().jumpTo(5)
		await store.getState().showConnections()
		expect(port.highlighted).toEqual(expect.arrayContaining(['dir-warm', 'decision-warm', 'pr-42']))
		expect(store.getState().beat).toBe(6)
	})
})
