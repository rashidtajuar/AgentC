import { T, type Editor } from 'tldraw'
import { describe, expect, it } from 'vitest'
import { customShapeUtils } from './index'

describe('custom shape utils', () => {
	for (const Util of customShapeUtils) {
		it(`${Util.type} default props pass its validators`, () => {
			const util = new (Util as unknown as new (e: Editor) => { getDefaultProps(): object })({} as Editor)
			const validator = T.object(Util.props as Record<string, T.Validatable<unknown>>)
			expect(() => validator.validate(util.getDefaultProps())).not.toThrow()
		})
	}

	it('registers five unique cc- types', () => {
		const types = customShapeUtils.map((u) => u.type)
		expect(new Set(types).size).toBe(5)
		expect(types.every((t) => t.startsWith('cc-'))).toBe(true)
	})
})
