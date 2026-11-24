import { expect, test, type Page } from '@playwright/test'

const IGNORE = /unsplash|net::ERR_|Failed to load resource|NetworkError/i

function collectErrors(page: Page) {
	const errors: string[] = []
	page.on('console', (m) => m.type() === 'error' && !IGNORE.test(m.text()) && errors.push(m.text()))
	page.on('pageerror', (e) => errors.push(String(e)))
	return errors
}

const ai = (page: Page) => page.getByRole('complementary', { name: 'AI' })

async function accept(page: Page) {
	await ai(page).getByRole('button', { name: 'Accept' }).click()
}

test('full journey by chips', async ({ page }) => {
	const errors = collectErrors(page)
	await page.goto('/?demo=1')
	await expect(page.getByRole('button', { name: 'Review changes (0)' })).toBeVisible()

	await ai(page).getByRole('button', { name: 'Organize into directions' }).click()
	await expect(page.getByRole('button', { name: 'Review changes (1)' })).toBeVisible({ timeout: 10_000 })
	await accept(page)

	await ai(page).getByRole('button', { name: 'What are we missing?' }).click()
	await expect(ai(page).getByRole('button', { name: 'Accept' })).toBeVisible({ timeout: 10_000 })
	await accept(page)

	await ai(page).getByRole('button', { name: 'Ask the team to vote' }).click()
	await ai(page).getByRole('button', { name: 'Approve Warm & tactile' }).click({ timeout: 15_000 })
	await expect(page.getByLabel('Decision: Warm & tactile approved')).toBeVisible({ timeout: 10_000 })
	await expect(ai(page).getByRole('button', { name: 'Accept' })).toBeVisible({ timeout: 10_000 })
	await accept(page)

	await ai(page).getByRole('button', { name: 'Apply this direction to the website' }).click()
	await ai(page).getByRole('button', { name: 'Review change' }).click({ timeout: 10_000 })
	const sheet = page.getByRole('dialog', { name: /theme\.ts/ })
	await expect(sheet).toContainText('Prepare — executing needs your approval')
	await sheet.getByRole('button', { name: 'Approve and open pull request' }).click()

	await expect(page.getByText('Nothing was merged or deployed.')).toBeVisible({ timeout: 10_000 })
	await expect(page.getByLabel(/Pull request #42/)).toBeVisible()
	await expect(page.getByRole('button', { name: 'Review changes (0)' })).toBeVisible()
	expect(errors).toEqual([])
})

test('typing works as well as chips, and unrelated text gets help', async ({ page }) => {
	await page.goto('/?demo=1')
	const box = page.getByLabel('Ask the assistant about this board')
	await box.fill('what time is it in Tokyo?')
	await box.press('Enter')
	await expect(ai(page)).toContainText('Try the suggestion below', { timeout: 8_000 })
	await box.fill('please sort these into groups')
	await box.press('Enter')
	await expect(ai(page).getByRole('button', { name: 'Accept' })).toBeVisible({ timeout: 10_000 })
})

test('undo after accept re-offers the suggestion; restart returns a clean wall', async ({ page }) => {
	await page.goto('/?demo=1')
	await ai(page).getByRole('button', { name: 'Organize into directions' }).click()
	await accept(page)
	// Use the visible canvas control; keyboard registration follows focus in a React effect.
	await page.getByRole('button', { name: /^Undo —/ }).click()
	await expect(ai(page)).toContainText('Undone. The suggestion is back', { timeout: 5_000 })
	await expect(page.getByRole('button', { name: 'Review changes (1)' })).toBeVisible()

	await page.getByRole('button', { name: 'Demo' }).click()
	await page.getByRole('menuitem', { name: 'Restart demo' }).click()
	await expect(page.getByRole('button', { name: 'Review changes (0)' })).toBeVisible()
	await expect(page.getByLabel(/Direction:/)).toHaveCount(0)
})

test('approving another direction politely declines', async ({ page }) => {
	await page.goto('/?demo=1')
	await page.getByRole('button', { name: 'Demo' }).click()
	await page.getByRole('menuitem', { name: /Gaps noted/ }).click()
	await page.getByLabel('Direction: Editorial').getByRole('button', { name: 'Approve direction' }).click()
	await expect(ai(page)).toContainText('in the real product any direction can be approved', { timeout: 8_000 })
	await expect(page.getByLabel(/^Decision:/)).toHaveCount(0)
})

test('the sample opens canvas-first and keeps chat available on mobile', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 740 })
	await page.goto('/?demo=1')
	const canvas = page.getByRole('main', { name: 'Canvas' })
	await expect(canvas).toBeVisible()
	await expect(page.getByRole('complementary')).toHaveCount(0)
	const canvasBounds = (await canvas.boundingBox())!
	const initial = canvasBounds.height
	const dock = page.getByRole('group', { name: 'Sample canvas controls' })
	expect((await dock.boundingBox())!.y).toBeGreaterThanOrEqual(canvasBounds.y + initial)
	await expect(page.getByRole('banner').getByRole('link', { name: 'Your projects' })).toBeVisible()
	await dock.getByRole('button', { name: 'Assistant', exact: true }).click()
	await expect(page.getByRole('complementary', { name: 'AI' })).toBeVisible()
	const compact = (await canvas.boundingBox())!.height
	await page.getByRole('button', { name: 'Expand Assistant' }).click()
	expect((await canvas.boundingBox())!.height).toBeLessThan(compact)
	await page.getByRole('button', { name: 'Minimize Assistant' }).click()
	expect((await canvas.boundingBox())!.height).toBe(compact)
	await page.getByRole('button', { name: 'Sources', exact: true }).click()
	await expect(page.getByRole('complementary', { name: 'Sources' })).toBeVisible()
	await expect(page.getByRole('complementary', { name: 'AI' })).toHaveCount(0)
	await page.getByRole('button', { name: 'Close Sources' }).click()
	expect((await canvas.boundingBox())!.height).toBe(initial)
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
})
