import { defineConfig } from '@playwright/test'

const port = process.env.AGENTC_TEST_PORT ?? '5173'
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
	testDir: './e2e',
	timeout: 90_000,
	use: {
		baseURL,
		viewport: { width: 1440, height: 900 },
		launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH },
	},
	webServer: {
		command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
		url: baseURL,
		reuseExistingServer: false,
		env: { VITE_SUPABASE_URL: 'https://agentc-cloud.test', VITE_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key' },
		timeout: 60_000,
	},
})
