import { afterEach, describe, expect, it } from 'vitest'
import type { Editor } from 'tldraw'
import { BEATS, VOTE_CHIP } from '../demo/scenario'
import { boardAtBeat, ScriptedPlanner } from '../demo/scriptedPlanner'
import { seedBoard } from '../demo/seed'
import { createDemoStore } from '../state/demoStore'
import { frames, makeEditor } from '../test/headlessEditor'
import { instantDelay } from '../test/fakePort'
import { createTldrawPort } from './tldrawPort'
import { toTlId } from './toPartials'

const planner = new ScriptedPlanner()
const organizeOps = () => planner.plan(BEATS[0].chip!, { beat: 0, board: seedBoard(), selection: [] }).proposal!.ops
const TAU = Math.PI * 2
/** smallest angle from 0, in degrees */
const tilt = (r: number) => (Math.abs(((((r % TAU) + 1.5 * TAU) % TAU) - TAU / 2)) * 180) / Math.PI

let editor: Editor
afterEach(() => editor?.dispose())

function setup() {
	editor = makeEditor()
	const port = createTldrawPort(editor)
	port.load(seedBoard())
	return port
}

describe('tldraw port', () => {
	it('accepting a preview clears every ghost, and one undo takes the whole proposal back', async () => {
		const port = setup()
		const cupBefore = editor.getShape(toTlId('ref-cup'))!
		port.preview(organizeOps(), 'p1')
		const step = port.commit()!
		expect(editor.getCurrentPageShapes().filter((s) => (s.meta as { ghost?: boolean }).ghost)).toHaveLength(0)
		expect(port.exists('dir-warm')).toBe(true)
		expect(port.isStepActive(step)).toBe(true)
		port.undo()
		expect(port.exists('dir-warm')).toBe(false)
		const cup = editor.getShape(toTlId('ref-cup'))!
		expect([cup.x, cup.y, cup.rotation]).toEqual([cupBefore.x, cupBefore.y, cupBefore.rotation])
		expect(port.isStepActive(step)).toBe(false)
	})

	it('tilted cards straighten by the short way round, never spinning', async () => {
		const port = setup()
		port.preview(organizeOps(), 'p1')
		for (let i = 0; i < 6; i++) {
			await frames(30)
			expect(tilt(editor.getShape(toTlId('ref-cup'))!.rotation)).toBeLessThan(3)
		}
		port.discard()
	})

	it('accepting mid-move lands every card in its slot', () => {
		const port = setup()
		port.preview(organizeOps(), 'p1')
		port.commit()
		const beans = editor.getShape(toTlId('ref-beans'))!
		expect([beans.x, beans.y, tilt(beans.rotation)]).toEqual([24, 424, 0])
		expect(beans.parentId).toBe(toTlId('dir-warm'))
	})

	it('a direct action is its own undo step', () => {
		const port = setup()
		port.preview(organizeOps(), 'p1')
		const organized = port.commit()!
		const vote = port.apply([{ op: 'addVote', directionId: 'dir-warm', voter: 'Maya' }])
		port.undo()
		expect(port.read().votes['dir-warm'] ?? []).toEqual([])
		expect(port.isStepActive(vote)).toBe(false)
		expect(port.isStepActive(organized)).toBe(true)
		expect(port.exists('dir-warm')).toBe(true)
	})

	it('reports a preview the person undid, once', () => {
		const port = setup()
		port.preview(organizeOps(), 'p1')
		expect(port.previewWasUndone()).toBe(false)
		port.undo()
		expect(port.previewWasUndone()).toBe(true)
		expect(port.previewWasUndone()).toBe(false)
		expect(port.exists('dir-warm')).toBe(false)
	})

	it('read() round-trips a loaded board without losing sizes or note text', () => {
		const port = setup()
		const board = boardAtBeat(5)
		port.load(board)
		const back = port.read()
		const pick = (b: typeof board) =>
			b.shapes
				.map((s) => ({ id: s.id, type: s.type, w: s.type === 'note' ? undefined : s.w, text: s.type === 'note' ? s.props.text : undefined }))
				.sort((a, z) => a.id.localeCompare(z.id))
		expect(pick(back)).toEqual(pick(board))
		expect(back.relationships.map((r) => r.id).sort()).toEqual(board.relationships.map((r) => r.id).sort())
		expect(back.dots['dir-warm']).toBe('approved')
		expect(back.votes['dir-warm']).toEqual(['Maya', 'Jon'])
	})
})

describe('demo engine on the real canvas', () => {
	function demo() {
		editor = makeEditor()
		const port = createTldrawPort(editor)
		const store = createDemoStore({ planner, port, delay: instantDelay })
		store.getState().init()
		return { port, store }
	}

	it('approving Warm while the gaps suggestion waits keeps the decision and offers the links', async () => {
		const { port, store } = demo()
		store.getState().jumpTo(1)
		await store.getState().send(BEATS[1].chip!)
		await store.getState().approveDirection('dir-warm')
		await frames(40)
		expect(port.exists('decision-warm')).toBe(true)
		expect(port.read().dots['dir-warm']).toBe('approved')
		expect(store.getState().pending?.id).toBe('prop-links')
	})

	it('deleting an accepted note by hand does not rewind the story', async () => {
		const { store } = demo()
		store.getState().jumpTo(1)
		await store.getState().send(BEATS[1].chip!)
		store.getState().accept()
		editor.deleteShapes([toTlId('note-gap-editorial')])
		await frames(60)
		expect(store.getState().beat).toBe(2)
		expect(store.getState().pending).toBeUndefined()
	})

	it('Cmd+Z after accepting re-offers the suggestion', async () => {
		const { port, store } = demo()
		await store.getState().send(BEATS[0].chip!)
		store.getState().accept()
		editor.undo()
		await frames(80)
		expect(store.getState().beat).toBe(0)
		expect(store.getState().pending?.id).toBe('prop-organize')
		expect(port.exists('dir-warm')).toBe(true) // back as ghosts
	})

	/** what a click on the canvas leaves in tldraw's history: a stop plus a selection change */
	const click = (id: string) => {
		editor.markHistoryStoppingPoint('selecting')
		editor.select(toTlId(id))
	}
	const ghosts = () => editor.getCurrentPageShapes().filter((s) => (s.meta as { ghost?: boolean }).ghost)

	it('clicking the board during a preview still leaves one undo per accepted suggestion', async () => {
		const { port, store } = demo()
		await store.getState().send(BEATS[0].chip!)
		click('ref-cup')
		store.getState().accept()
		editor.undo()
		await frames(80)
		expect(store.getState().committed).toHaveLength(0)
		expect(store.getState().beat).toBe(0)
		expect(store.getState().pending?.id).toBe('prop-organize')
		expect(port.exists('dir-warm')).toBe(true)
	})

	it('the Undo button takes back the accepted step even after a click', async () => {
		const { port, store } = demo()
		await store.getState().send(BEATS[0].chip!)
		store.getState().accept()
		click('dir-warm')
		store.getState().undoLast()
		await frames(80)
		expect(store.getState().committed).toHaveLength(0)
		expect(store.getState().beat).toBe(0)
		expect(port.exists('dir-warm')).toBe(true) // offered again as ghosts
		expect(ghosts().length).toBeGreaterThan(0)
	})

	it('redo after undoing a suggestion brings it back with Accept and Discard', async () => {
		const { port, store } = demo()
		await store.getState().send(BEATS[0].chip!)
		await frames(60)
		editor.undo()
		await frames(10)
		expect(store.getState().pending).toBeUndefined()
		expect(port.exists('dir-warm')).toBe(false)
		editor.redo()
		await frames(10)
		expect(port.exists('dir-warm')).toBe(true)
		expect(store.getState().pending?.id).toBe('prop-organize')
		store.getState().accept()
		await frames(10)
		expect(store.getState().beat).toBe(1)
		expect(ghosts()).toHaveLength(0)
		editor.undo()
		await frames(80)
		expect(store.getState().beat).toBe(0)
		expect(store.getState().pending?.id).toBe('prop-organize')
	})

	it('the Undo button stays only while the accepted step is the newest change', async () => {
		const { port, store } = demo()
		await store.getState().send(BEATS[0].chip!)
		store.getState().accept()
		await frames(10)
		const step = store.getState().committed[0].step
		expect(store.getState().undoable).toBe(step)
		click('dir-warm') // a selection is not a change
		await frames(10)
		expect(store.getState().undoable).toBe(step)
		await store.getState().send(VOTE_CHIP)
		await frames(10)
		expect(port.read().votes['dir-warm']).toEqual(['Maya', 'Jon'])
		expect(store.getState().undoable).toBeNull()
		store.getState().undoLast() // must not take the votes with it
		await frames(10)
		expect(port.read().votes['dir-warm']).toEqual(['Maya', 'Jon'])
		expect(store.getState().committed).toHaveLength(1)
	})

	it('the Undo button never deletes a note the driver added after accepting', async () => {
		const { port, store } = demo()
		await store.getState().send(BEATS[0].chip!)
		store.getState().accept()
		await frames(10)
		editor.markHistoryStoppingPoint('creating')
		editor.createShape({ id: toTlId('my-note'), type: 'note', x: 2000, y: 2000 })
		await frames(10)
		expect(store.getState().undoable).toBeNull()
		store.getState().undoLast()
		await frames(10)
		expect(port.exists('my-note')).toBe(true)
		expect(store.getState().committed).toHaveLength(1)
	})

	it('redoing an undone approval puts it back in the story, then the links suggestion', async () => {
		const { port, store } = demo()
		store.getState().jumpTo(2)
		await store.getState().approveDirection('dir-warm')
		await frames(40)
		expect(store.getState().pending?.id).toBe('prop-links')
		editor.undo() // the links suggestion
		await frames(10)
		editor.undo() // the approval
		await frames(10)
		expect(store.getState().beat).toBe(2)
		expect(port.exists('decision-warm')).toBe(false)
		editor.redo()
		await frames(10)
		expect(port.exists('decision-warm')).toBe(true)
		expect(store.getState().beat).toBe(2) // approving keeps the beat; accepting the links moves it on
		expect(store.getState().committed).toHaveLength(1)
		expect(store.getState().chips).not.toContain('Approve Warm & tactile')
		editor.redo()
		await frames(10)
		expect(store.getState().pending?.id).toBe('prop-links')
	})

	it('redoing an undone pull request closes the re-offered change', async () => {
		const { port, store } = demo()
		store.getState().jumpTo(3)
		await store.getState().send(BEATS[3].chip!)
		expect(store.getState().pending?.external).toBe(true)
		await store.getState().approveExternal()
		await frames(10)
		expect(store.getState().beat).toBe(5)
		editor.undo()
		await frames(10)
		expect(port.exists('pr-42')).toBe(false)
		expect(store.getState().pending?.external).toBe(true)
		editor.redo()
		await frames(10)
		expect(port.exists('pr-42')).toBe(true)
		expect(store.getState().pending).toBeUndefined()
		expect(store.getState().beat).toBe(5)
		expect(store.getState().committed.at(-1)?.proposal?.external).toBe(true)
	})
})
