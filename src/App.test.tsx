import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('tldraw', async () => {
	const actual = await vi.importActual<object>('tldraw')
	return { ...actual, Tldraw: () => <div data-testid="tldraw" /> }
})

import App from './App'

describe('App', () => {
	it('renders the four shell regions', () => {
		render(<App />)
		expect(screen.getByRole('banner')).toBeInTheDocument()
		expect(screen.getByRole('complementary', { name: 'Sources' })).toBeInTheDocument()
		expect(screen.getByRole('complementary', { name: 'AI' })).toBeInTheDocument()
		expect(screen.getByTestId('tldraw')).toBeInTheDocument()
		expect(screen.getByText('Sample data')).toBeVisible()
	})
})
