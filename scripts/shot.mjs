import { chromium } from '@playwright/test'
// usage: node scripts/shot.mjs <out.png|-> <width> <height> [steps...]
// "-" skips the final capture (use shot:<path> steps instead), so a stepped run never overwrites another file
const [, , out, w = '1440', h = '900', ...steps] = process.argv
if (!out) throw new Error('first argument must be the output path, or - for none')
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' })
const page = await browser.newPage({ viewport: { width: +w, height: +h } })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto('http://localhost:5173/')
await page.waitForSelector('.cc-ai__list .cc-msg', { timeout: 20000 })
await page.waitForTimeout(1200)
for (const s of steps) {
	if (s.startsWith('wait:')) { await page.waitForTimeout(+s.slice(5)); continue }
	if (s.startsWith('text:')) { await page.getByRole('button', { name: s.slice(5), exact: true }).first().click(); continue }
	if (s.startsWith('css:')) { await page.locator(s.slice(4)).first().click(); continue }
	if (s.startsWith('shot:')) { await page.screenshot({ path: s.slice(5) }); continue }
	if (s.startsWith('dbl:')) {
		const pt = await page.evaluate((id) => {
			const e = window.__editor
			const b = e.getShapePageBounds('shape:' + id)
			return e.pageToScreen({ x: b.x + b.w * 0.7, y: b.y + b.h * 0.6 })
		}, s.slice(4))
		await page.mouse.dblclick(pt.x, pt.y)
		continue
	}
	if (s.startsWith('key:')) { await page.keyboard.press(s.slice(4)); continue }
}
if (out !== '-') await page.screenshot({ path: out })
console.log('errors:', errors.filter(e => !/unsplash|ERR_|Failed to load resource/.test(e)).slice(0, 8))
await browser.close()
