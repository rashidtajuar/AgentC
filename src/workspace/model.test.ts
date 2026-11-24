import { describe, expect, it } from 'vitest'
import { getSnapshot } from 'tldraw'
import { makeEditor } from '../test/headlessEditor'
import { createProject, sourceShape, planOrganization, readProjects, writeProjects, readDocument, writeDocument } from './model'

describe('workspace boundaries', () => {
	it('validates project names and retains briefs', () => {
		expect(() => createProject('   ', '')).toThrow(/name/i)
		expect(() => createProject('x'.repeat(101), '')).toThrow(/100/)
		expect(createProject('  Launch  ', 'A useful brief')).toMatchObject({ name: 'Launch', brief: 'A useful brief' })
	})
	it('rejects executable, credentialed and invalid source URLs', () => {
		for (const url of ['javascript:alert(1)', 'data:text/html,hi', 'file:///tmp/a', 'https://u:password@example.com', 'not a url']) {
			expect(() => sourceShape('Brief', url, 'doc', 0)).toThrow()
		}
		const card = sourceShape('Brief', 'https://example.com/brief', 'doc', 0)
		expect(card.props).toMatchObject({ location: 'https://example.com/brief', status: 'unverified', capabilities: ['open'] })
	})
	it('keeps project documents isolated and refuses stale writes', () => {
		const storage = window.localStorage
		storage.clear()
		const a = createProject('A', ''), b = createProject('B', '')
		writeProjects(storage, [a, b])
		expect(readProjects(storage)).toHaveLength(2)
		const editor = makeEditor()
		const snapshot = getSnapshot(editor.store)
		editor.dispose()
		const revision = writeDocument(storage, a.id, snapshot, null)
		expect(readDocument(storage, b.id)).toBeNull()
		expect(() => writeDocument(storage, a.id, snapshot, null)).toThrow(/another tab/i)
		expect(readDocument(storage, a.id)).toMatchObject({ revision, snapshot })
	})
	it('does not replace corrupt or unsupported data', () => {
		const storage = window.localStorage
		storage.clear()
		storage.setItem('agentc:projects:v1', '{broken')
		expect(() => readProjects(storage)).toThrow(/saved project/i)
		expect(storage.getItem('agentc:projects:v1')).toBe('{broken')
		storage.setItem('agentc:document:a', JSON.stringify({ version: 99 }))
		expect(() => readDocument(storage, 'a')).toThrow(/saved canvas/i)
		storage.setItem('agentc:document:a', JSON.stringify({ version: 1, revision: 'r', snapshot: {} }))
		expect(() => readDocument(storage, 'a')).toThrow(/saved canvas/i)
	})
	it('plans only canvas moves for current source cards without mutating the board', () => {
		const source = sourceShape('Code', 'https://github.com/example/repo', 'repo', 0)
		const board = { shapes: [source, { id: 'note', type: 'note' as const, x: 8, y: 9, props: { text: 'Keep me' } }], relationships: [], dots: {}, votes: {} }
		const before = structuredClone(board)
		const proposal = planOrganization(board)
		expect(proposal.external).toBe(false)
		expect(proposal.permission).toBe('suggest')
		expect(proposal.ops).toEqual([{ op: 'moveShapes', moves: [{ id: source.id, x: 80, y: 80, rotation: 0, parentId: '' }] }])
		expect(board).toEqual(before)
		expect(() => planOrganization({ ...board, shapes: [] })).toThrow(/source/i)
	})
})
