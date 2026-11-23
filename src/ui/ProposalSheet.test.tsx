import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { THEME_PATCH } from '../demo/content'
import { ScriptedPlanner } from '../demo/scriptedPlanner'
import { DemoProvider } from '../state/DemoContext'
import { createDemoStore } from '../state/demoStore'
import { FakePort, instantDelay, manualDelay } from '../test/fakePort'
import { DiffView, parseUnifiedDiff } from './DiffView'
import { ExecutionSteps } from './ExecutionSteps'
import { ProposalSheet } from './ProposalSheet'

describe('DiffView', () => {
	it('marks added, removed and context lines with numbers', () => {
		const lines = parseUnifiedDiff(THEME_PATCH)
		expect(lines.filter((l) => l.kind === 'add')).toHaveLength(6)
		expect(lines.filter((l) => l.kind === 'del')).toHaveLength(6)
		expect(lines.find((l) => l.kind === 'ctx')?.oldNo).toBe(1)
		render(<DiffView path="website/src/theme.ts" patch={THEME_PATCH} />)
		const fig = screen.getByRole('figure', { name: 'Changes to website/src/theme.ts' })
		expect(fig.querySelectorAll('[data-kind="add"]')).toHaveLength(6)
		expect(fig.querySelectorAll('[data-kind="del"]')).toHaveLength(6)
	})
})

describe('ExecutionSteps', () => {
	it('renders steps in order with their states', () => {
		render(
			<ExecutionSteps
				steps={[
					{ id: 'a', label: 'Create branch', state: 'done' },
					{ id: 'b', label: 'Commit 1 file', state: 'running' },
					{ id: 'c', label: 'Open pull request #42', state: 'pending' },
				]}
			/>
		)
		const items = within(screen.getByRole('list', { name: 'Steps' })).getAllByRole('listitem')
		expect(items.map((i) => i.getAttribute('data-state'))).toEqual(['done', 'running', 'pending'])
		expect(items[2]).toHaveTextContent('Open pull request #42')
	})
})

describe('ProposalSheet', () => {
	function setup(delay = instantDelay) {
		const port = new FakePort()
		const store = createDemoStore({ planner: new ScriptedPlanner(), port, delay })
		store.getState().init()
		store.getState().jumpTo(4)
		store.getState().openSheet()
		render(
			<DemoProvider value={{ store, port }}>
				<ProposalSheet />
			</DemoProvider>
		)
		return store
	}

	it('lists theme.ts as the only affected file and shows the permission line', () => {
		setup()
		expect(screen.getByRole('dialog')).toHaveTextContent('Affected files: website/src/theme.ts')
		expect(screen.getByText('Prepare — executing needs your approval')).toBeInTheDocument()
	})

	it('disables Approve while the run is in progress', async () => {
		const m = manualDelay()
		const store = setup(m.delay)
		const running = store.getState().approveExternal()
		expect(await screen.findByRole('button', { name: 'Opening pull request…' })).toBeDisabled()
		await m.releaseAll()
		await running
	})
})
