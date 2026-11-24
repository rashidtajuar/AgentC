import { describe, expect, it, vi } from 'vitest'
import { cloudDocument, importDocument } from './document'

const document = {
	schema: { schemaVersion: 2, sequences: {} },
	store: {
		'document:document': { typeName: 'document' },
		'page:page': { typeName: 'page' },
		'asset:example': { typeName: 'asset', type: 'image', props: { src: 'data:image/png;base64,AA==' } },
		'shape:example': { typeName: 'shape', type: 'image', props: { assetId: 'asset:example' } },
	},
}

describe('cloud documents', () => {
	it('keeps relationships and strips device session state', () => {
		expect(cloudDocument({ document, session: { camera: 'device setting' } })).toBe(document)
		expect(() => cloudDocument({ document: { schema: {}, store: {} } })).toThrow('incomplete')
	})

	it('uploads embedded media before replacing references in an imported copy', async () => {
		const upload = vi.fn().mockResolvedValue('https://agentc-media.invalid/stored')
		const copy = await importDocument({ document }, upload)
		expect(upload).toHaveBeenCalledWith('data:image/png;base64,AA==')
		expect(copy?.store['asset:example']).toMatchObject({ props: { src: 'https://agentc-media.invalid/stored' } })
		expect(copy?.store['shape:example']).toEqual(document.store['shape:example'])
		expect(document.store['asset:example'].props.src).toMatch(/^data:/)
	})

	it('aborts import when an upload fails', async () => {
		await expect(importDocument({ document }, async () => { throw new Error('Upload failed') }))
			.rejects.toThrow('Upload failed')
	})
})
