import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BEATS } from '../demo/scenario'
import { ScriptedPlanner } from '../demo/scriptedPlanner'
import { DemoProvider } from '../state/DemoContext'
import { createDemoStore } from '../state/demoStore'
import { FakePort, instantDelay } from '../test/fakePort'
import { AiPanel } from './AiPanel'
import { TopBar } from './TopBar'

function setup() {
	const port = new FakePort()
	const store = createDemoStore({ planner: new ScriptedPlanner(), port, delay: instantDelay })
	store.getState().init()
	const ui = render(
		<DemoProvider value={{ store, port }}>
			<TopBar />
			<AiPanel />
		</DemoProvider>
	)
	return { port, store, ui }
}

describe('AiPanel', () => {
	it('Send is disabled for empty and whitespace input', async () => {
		setup()
		const send = screen.getByRole('button', { name: 'Send' })
		expect(send).toBeDisabled()
		await userEvent.type(screen.getByLabelText('Ask the assistant about this board'), '   ')
		expect(send).toBeDisabled()
	})

	it('clicking a chip sends the chip text', async () => {
		const { store } = setup()
		const spy = vi.spyOn(store.getState(), 'send')
		await userEvent.click(screen.getByRole('button', { name: BEATS[0].chip! }))
		expect(spy).toHaveBeenCalledWith(BEATS[0].chip)
	})

	it('a pending proposal shows Accept and Discard, and Review changes counts it', async () => {
		const { store } = setup()
		expect(screen.getByRole('button', { name: 'Review changes (0)' })).toBeDisabled()
		await store.getState().send(BEATS[0].chip!)
		expect(await screen.findByRole('button', { name: 'Accept' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Discard' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Review changes (1)' })).toBeEnabled()
	})
})

describe('DemoMenu', () => {
	it('Restart demo calls restart', async () => {
		const { store } = setup()
		const spy = vi.spyOn(store.getState(), 'restart')
		await userEvent.click(screen.getByRole('button', { name: 'Demo' }))
		await userEvent.click(screen.getByRole('menuitem', { name: 'Restart demo' }))
		expect(spy).toHaveBeenCalled()
	})
})
