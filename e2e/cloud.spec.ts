import { expect, test, type Page, type Route } from '@playwright/test'

const cloudOrigin = 'https://agentc-cloud.test'
const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/mK0AAAAASUVORK5CYII=', 'base64')

interface Row {
	id: string
	name: string
	brief: string
	created_at: string
	document: unknown
	revision: string
}

function cloudApi() {
	const projects = new Map<string, Row>()
	const media = new Set<string>()
	return async (route: Route) => {
		const request = route.request()
		const url = new URL(request.url())
		const post = request.method() === 'POST'
		const reply = (json: unknown, status = 200) => route.fulfill({ status, json })
		if (url.pathname === '/auth/v1/token') {
			const { email } = request.postDataJSON()
			return reply({
				access_token: email, refresh_token: email, token_type: 'bearer', expires_in: 3600,
				user: { id: email === 'owner@agentc.test' ? 'aaaaaaaa-0000-4000-8000-000000000001' : 'aaaaaaaa-0000-4000-8000-000000000002', email, aud: 'authenticated', app_metadata: {}, user_metadata: {} },
			})
		}
		const account = request.headers().authorization
		const key = (id: string) => account + '/' + id
		if (url.pathname === '/rest/v1/agentc_projects') {
			if (post) {
				const payload = request.postDataJSON()
				if (!projects.has(key(payload.id))) {
					projects.set(key(payload.id), { ...payload, revision: crypto.randomUUID(), created_at: new Date().toISOString() })
				}
				return route.fulfill({ status: 201 })
			}
			const id = url.searchParams.get('id')?.slice(3)
			return reply(id ? [projects.get(key(id))].filter(Boolean) : [...projects.entries()]
				.filter(([name]) => name.startsWith(key(''))).map(([, row]) => row))
		}
		if (url.pathname === '/rest/v1/rpc/agentc_save_document') {
			const { project_id, expected_revision, next_document } = request.postDataJSON()
			const row = projects.get(key(project_id))
			if (!row || row.revision !== expected_revision) return reply(null)
			row.revision = crypto.randomUUID()
			row.document = next_document
			return reply(row.revision)
		}
		if (url.pathname.startsWith('/storage/v1/object/sign/')) {
			if (!post) return route.fulfill({ contentType: 'image/png', body: image })
			const path = url.pathname.replace('/storage/v1/object/sign/', '')
			if (!media.has(key(path))) return reply({ message: 'Missing media' }, 404)
			return reply({ signedURL: '/object/sign/' + path + '?token=test' })
		}
		if (url.pathname.startsWith('/storage/v1/object/agentc-board-media/')) {
			const path = url.pathname.replace('/storage/v1/object/', '')
			media.add(key(path))
			return reply({ Key: path, Id: crypto.randomUUID() })
		}
		return reply({ message: 'Unknown test route' }, 404)
	}
}

async function signIn(page: Page, email: string, path = '/?cloud=1') {
	await page.goto(path)
	await page.getByLabel('Email').fill(email)
	await page.getByLabel('Password').fill('private-test-password')
	await page.getByRole('button', { name: 'Sign in', exact: true }).click()
}

async function addSource(page: Page, name: string) {
	await page.getByLabel('Source name').fill(name)
	await page.getByLabel('Source URL').fill('https://example.com/reference')
	await page.getByRole('button', { name: 'Add source', exact: true }).click()
	await expect(page.getByLabel('Document file: ' + name)).toBeVisible()
}

test('imports a browser board with media, reopens across sessions, and preserves the newer save', async ({ page: first, context, browser }) => {
	const api = cloudApi()
	await context.route(cloudOrigin + '/**', api)
	await first.goto('/')
	await first.getByLabel('Project name').fill('Studio board')
	await first.getByRole('button', { name: 'Create project' }).click()
	await addSource(first, 'Original source')
	await addSource(first, 'Related source')
	await first.getByRole('button', { name: 'Node map', exact: true }).click()
	await first.getByRole('button', { name: 'Propose organization' }).click()
	await first.getByRole('button', { name: 'Accept layout' }).click()
	await first.getByLabel('Document file: Original source').click()
	await first.getByLabel('Document file: Related source').click({ modifiers: ['Shift'] })
	await first.getByRole('button', { name: 'Connect selected items' }).click()
	const arrows = (page: Page) => page.locator('[data-shape-type="arrow"]:not(.tl-shape-background)')
	await expect(arrows(first)).toHaveCount(1)
	await first.getByLabel('Add images').setInputFiles({ name: 'reference.png', mimeType: 'image/png', buffer: image })
	const photos = (page: Page) => page.locator('[data-shape-type="image"] img').first()
	await expect(photos(first)).toBeVisible()
	await expect(first.getByRole('status', { name: 'Save status' })).toHaveText('Saved on this browser')
	const localUrl = first.url()

	const owner = 'owner@agentc.test'
	await signIn(first, owner)
	await first.getByRole('button', { name: 'Import Studio board' }).click()
	await expect(first.getByLabel('Document file: Original source')).toBeVisible()
	await expect(photos(first)).toBeVisible()
	const cloudUrl = first.url()

	const separate = await browser.newContext()
	const second = await separate.newPage()
	await separate.route(cloudOrigin + '/**', api)
	await signIn(second, owner, cloudUrl)
	await expect(second.getByLabel('Document file: Original source')).toBeVisible()
	await second.getByRole('button', { name: 'Node map', exact: true }).click()
	await expect(arrows(second)).toHaveCount(1)
	await expect(photos(second)).toBeVisible()
	await expect.poll(() => photos(second).evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)
	await addSource(second, 'Newer source')
	await expect(second.getByRole('status', { name: 'Save status' })).toHaveText('Saved to cloud')
	await addSource(first, 'Unsaved stale source')
	await expect(first.getByRole('alert')).toContainText('changed on another device')
	await expect(first.getByRole('button', { name: 'Download canvas data' })).toBeVisible()
	await first.getByRole('button', { name: 'Reload saved version' }).click()
	await expect(first.getByLabel('Document file: Newer source')).toBeVisible()
	await expect(first.getByLabel('Document file: Unsaved stale source')).toHaveCount(0)

	const isolated = await browser.newContext()
	const third = await isolated.newPage()
	await isolated.route(cloudOrigin + '/**', api)
	await signIn(third, 'other@agentc.test', cloudUrl)
	await expect(third.getByRole('alert')).toContainText('unavailable to your account')
	await first.goto(localUrl)
	await expect(first.getByRole('link', { name: 'Open Original source' })).toBeVisible()
	await expect(first.getByRole('link', { name: 'Open Newer source' })).toHaveCount(0)
	await separate.close()
	await isolated.close()
})
