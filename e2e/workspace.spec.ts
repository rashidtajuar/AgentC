import { expect, test, type Page } from '@playwright/test'

async function create(page: Page, name: string) {
	await page.getByLabel('Project name').fill(name)
	await page.getByLabel('Project brief').fill('Connect research to delivery.')
	await page.getByRole('button', { name: 'Create project', exact: true }).click()
	await expect(page.getByRole('main', { name: 'Canvas' })).toBeVisible()
}

async function add(page: Page, name: string, url: string) {
	await page.getByLabel('Source name').fill(name)
	await page.getByLabel('Source URL').fill(url)
	await page.getByRole('button', { name: 'Add source', exact: true }).click()
	await expect(page.getByLabel(`Document file: ${name}`)).toBeVisible()
}

test('create a project, link sources, review changes, reload and switch projects', async ({ page }) => {
	const errors: string[] = []
	page.on('pageerror', (e) => errors.push(String(e)))
	await page.goto('/')
	await create(page, 'Studio launch')
	await add(page, 'Research brief', 'https://example.com/brief')
	await add(page, 'Delivery plan', 'https://example.com/plan')
	await expect(page.getByRole('link', { name: 'Open Research brief' })).toHaveAttribute('href', 'https://example.com/brief')
	await page.getByRole('button', { name: 'Propose organization' }).click()
	await expect(page.getByRole('region', { name: 'Proposal review' })).toContainText('2 source cards')
	await page.getByRole('button', { name: 'Discard', exact: true }).click()
	await expect(page.getByRole('region', { name: 'Proposal review' })).toHaveCount(0)
	await page.getByRole('button', { name: 'Propose organization' }).click()
	await page.getByRole('button', { name: 'Accept layout', exact: true }).click()
	await expect(page.getByRole('status', { name: 'Save status' })).toContainText('Saved on this browser')
	await page.reload()
	await expect(page.getByLabel('Document file: Research brief')).toBeVisible()
	await expect(page.getByRole('region', { name: 'Proposal review' })).toHaveCount(0)
	await page.getByRole('button', { name: 'Projects', exact: true }).click()
	await create(page, 'Separate project')
	await expect(page.getByLabel('Document file: Research brief')).toHaveCount(0)
	await page.getByRole('button', { name: 'Projects', exact: true }).click()
	await page.getByRole('button', { name: /Open Studio launch/ }).click()
	await expect(page.getByLabel('Document file: Research brief')).toBeVisible()
	expect(errors).toEqual([])
})

test('pending proposals are abandoned on reload and unsafe links are rejected', async ({ page }) => {
	await page.goto('/')
	await create(page, 'Safe proposals')
	await add(page, 'Brief', 'https://example.com/brief')
	await page.getByLabel('Source name').fill('Unsafe')
	await page.getByLabel('Source URL').fill('javascript:alert(1)')
	await page.getByRole('button', { name: 'Add source', exact: true }).click()
	await expect(page.getByRole('alert')).toContainText('http or https')
	await page.getByRole('button', { name: 'Propose organization' }).click()
	await page.reload()
	await expect(page.getByLabel('Document file: Brief')).toBeVisible()
	await expect(page.getByRole('region', { name: 'Proposal review' })).toHaveCount(0)
	await expect(page.getByLabel('Document file: Unsafe')).toHaveCount(0)
})

test('native drawing and camera survive reopening; proposals preserve the committed snapshot', async ({ page }) => {
	await page.goto('/')
	await create(page, 'Drawing and camera')
	await add(page, 'Brief', 'https://example.com/brief')
	await page.getByRole('button', { name: /Rectangle —/ }).click()
	const canvas = await page.locator('.tl-canvas').boundingBox()
	if (!canvas) throw new Error('Canvas missing')
	await page.mouse.move(canvas.x + 400, canvas.y + 320)
	await page.mouse.down()
	await page.mouse.move(canvas.x + 540, canvas.y + 430, { steps: 5 })
	await page.mouse.up()
	await page.getByRole('button', { name: /Hand —/ }).click()
	await page.mouse.move(canvas.x + 500, canvas.y + 200)
	await page.mouse.down()
	await page.mouse.move(canvas.x + 600, canvas.y + 260, { steps: 5 })
	await page.mouse.up()
	await expect(page.getByRole('status', { name: 'Save status' })).toHaveText('Saved on this browser')
	const saved = await page.evaluate(() => {
		const id = new URLSearchParams(location.search).get('project')
		return JSON.parse(localStorage.getItem(`agentc:document:${id}`)!).snapshot
	})
	const rectangle = page.locator('[data-shape-type="geo"]')
	const beforeBox = await rectangle.boundingBox()
	expect(beforeBox).not.toBeNull()
	expect(Object.values(saved.document.store).some((r: any) => r.type === 'geo')).toBe(true)
	await page.getByRole('button', { name: 'Propose organization' }).click()
	await expect(page.getByRole('region', { name: 'Proposal review' })).toBeVisible()
	await page.reload()
	await expect(page.getByLabel('Document file: Brief')).toBeVisible()
	await expect(rectangle).toBeVisible()
	const afterBox = await rectangle.boundingBox()
	for (const key of ['x', 'y', 'width', 'height'] as const) expect(afterBox![key]).toBeCloseTo(beforeBox![key], 0)
	const after = await page.evaluate(() => {
		const id = new URLSearchParams(location.search).get('project')
		return JSON.parse(localStorage.getItem(`agentc:document:${id}`)!).snapshot
	})
	expect(after.document).toEqual(saved.document)
	expect(after.session.pageStates).toEqual(saved.session.pageStates)
})

test('storage failures are visible and stop further edits', async ({ page }) => {
	await page.addInitScript(() => {
		const original = Storage.prototype.setItem
		Storage.prototype.setItem = function (key, value) {
			if (key.startsWith('agentc:document:')) throw new DOMException('Browser storage quota exceeded', 'QuotaExceededError')
			return original.call(this, key, value)
		}
	})
	await page.goto('/')
	await create(page, 'Storage failure')
	await add(page, 'Unsaved source', 'https://example.com/source')
	await expect(page.getByRole('status', { name: 'Save status' })).toHaveText('Not saved')
	await expect(page.getByRole('alert')).toContainText('quota exceeded')
	await expect(page.getByRole('button', { name: 'Add source', exact: true })).toBeDisabled()
})

test('another tab changing the document stops stale writes', async ({ page, context }) => {
	await page.goto('/')
	await create(page, 'Shared browser')
	await add(page, 'First source', 'https://example.com/first')
	await expect(page.getByRole('status', { name: 'Save status' })).toHaveText('Saved on this browser')
	const other = await context.newPage()
	await other.goto(page.url())
	await add(other, 'Second source', 'https://example.com/second')
	await expect(other.getByRole('status', { name: 'Save status' })).toHaveText('Saved on this browser')
	await expect(page.getByRole('alert')).toContainText('another tab')
	await expect(page.getByRole('button', { name: 'Add source', exact: true })).toBeDisabled()
	await page.getByRole('button', { name: 'Reload saved version' }).click()
	await expect(page.getByLabel('Document file: Second source')).toBeVisible()
})
