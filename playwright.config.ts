import { defineConfig } from '@playwright/test'

export default defineConfig({
	testDir: './e2e',
	timeout: 90_000,
	use: {
		baseURL: 'http://localhost:5173',
		viewport: { width: 1440, height: 900 },
		launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH },
	},
	webServer: {
		command: 'npm run dev -- --port 5173 --strictPort',
		url: 'http://localhost:5173',
		reuseExistingServer: true,
		timeout: 60_000,
	},
})
