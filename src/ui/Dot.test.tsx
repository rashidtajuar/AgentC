import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Dot } from './Dot'

describe('Dot', () => {
	it('renders an accessible label and its state', () => {
		render(<Dot state="approved" />)
		const dot = screen.getByRole('img', { name: 'Approved' })
		expect(dot).toHaveAttribute('data-state', 'approved')
	})

	it('only animates when asked', () => {
		const { rerender } = render(<Dot state="proposal" />)
		expect(screen.getByRole('img').className).not.toContain('cc-dot--stick')
		rerender(<Dot state="proposal" animate />)
		expect(screen.getByRole('img').className).toContain('cc-dot--stick')
	})
})
