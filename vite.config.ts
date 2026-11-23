/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * @tldraw/assets 5.6.2 is published without its translations folder, but its import map still
 * references it. English is built into tldraw, so the other languages resolve to an empty URL.
 */
function tldrawMissingTranslations(): Plugin {
	const VIRTUAL = '\0tldraw-missing-translation'
	return {
		name: 'tldraw-missing-translations',
		enforce: 'pre',
		resolveId(id, importer) {
			if (importer?.includes('@tldraw/assets') && id.startsWith('./translations/')) return VIRTUAL
		},
		load(id) {
			if (id === VIRTUAL) return 'export default ""'
		},
	}
}

export default defineConfig({
	plugins: [tldrawMissingTranslations(), react()],
	// keep the asset map out of dependency pre-bundling so the plugin above can resolve it
	optimizeDeps: { exclude: ['@tldraw/assets'] },
	test: {
		environment: 'jsdom',
		setupFiles: ['./src/test/setup.ts'],
		include: ['src/**/*.test.{ts,tsx}'],
		css: false,
	},
})
