import { canvasDocument } from '../workspace/model'

export function cloudDocument(snapshot: unknown) {
	if (!snapshot || typeof snapshot !== 'object' || !('document' in snapshot) || !canvasDocument(snapshot.document)) {
		throw new Error('The canvas document is incomplete.')
	}
	return snapshot.document
}

export async function importDocument(snapshot: unknown, upload: (source: string) => Promise<string>) {
	if (snapshot === null) return null
	const document = cloudDocument(snapshot)
	const store = { ...document.store }
	for (const [id, record] of Object.entries(store)) {
		if (!record || typeof record !== 'object' || !('typeName' in record) || record.typeName !== 'asset' ||
			!('props' in record) || !record.props || typeof record.props !== 'object' || !('src' in record.props)) continue
		const source = record.props.src
		if (typeof source !== 'string' || !source.startsWith('data:')) continue
		store[id] = { ...record, props: { ...record.props, src: await upload(source) } }
	}
	return { ...document, store }
}
