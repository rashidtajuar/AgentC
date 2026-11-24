import { useMemo, useState } from 'react'
import { ArrowUpRight, File, Frame, Group, Image, Link2, Lock, LockOpen, PenLine, Search, Shapes, StickyNote, Type } from 'lucide-react'
import { computed, useValue, type Editor, type TLShape } from 'tldraw'
import { SHAPE, type ArtifactShape } from '../canvas/shapes/types'
import { SourceIcon } from '../ui/SourceIcon'
import { isConnection } from './boardView'

interface Layer { id: TLShape['id']; type: TLShape['type']; kind: string; name: string; locked: boolean; depth: number; connection: boolean; source?: ArtifactShape['props'] }

const layerKinds = {
	arrow: ['Arrow', ArrowUpRight], bookmark: ['Bookmark', Link2], draw: ['Drawing', PenLine],
	frame: ['Frame', Frame], geo: ['Shape', Shapes], group: ['Group', Group], highlight: ['Highlight', PenLine],
	image: ['Image', Image], line: ['Line', PenLine], note: ['Sticky note', StickyNote],
	text: ['Text', Type], video: ['Video', Image],
} as const

function readLayers(editor: Editor) {
	const layers: Layer[] = []
	function visit(parent: TLShape['parentId'], depth: number) {
		for (const id of [...editor.getSortedChildIdsForParent(parent)].reverse()) {
			const shape = editor.getShape(id)
			if (!shape) continue
			const source = shape.type === SHAPE.artifact ? (shape as ArtifactShape).props : undefined
			const connection = isConnection(shape, editor)
			const kind = source ? 'Source' : connection ? 'Connection' : (layerKinds[shape.type as keyof typeof layerKinds]?.[0] ?? 'Element')
			const asset = (shape.type === 'image' || shape.type === 'video') && shape.props.assetId ? editor.getAsset(shape.props.assetId) : undefined
			const fileName = asset && 'name' in asset.props ? asset.props.name : undefined
			const label = source?.name ?? fileName ?? editor.getShapeUtil(shape).getText?.(shape)
			layers.push({ id, type: shape.type, kind, name: label?.trim().replace(/\s+/g, ' ') || kind, locked: shape.isLocked, depth, connection, source })
			if (shape.type === 'group' || shape.type === 'frame') visit(id, depth + 1)
		}
	}
	visit(editor.getCurrentPageId(), 0)
	return layers
}

export function LayersPanel({ editor, canEdit, onLocate }: {
	editor: Editor
	canEdit: boolean
	onLocate: (id: TLShape['id'], connection: boolean) => void
}) {
	const [query, setQuery] = useState('')
	const layerSignal = useMemo(() => computed<Layer[]>('layer metadata', () => readLayers(editor), {
		isEqual: (a: Layer[], b: Layer[]) => a.length === b.length && a.every((x, i) => {
			const y = b[i]
			return x.id === y.id && x.name === y.name && x.kind === y.kind && x.locked === y.locked && x.depth === y.depth &&
				x.connection === y.connection && x.source?.tool === y.source?.tool && x.source?.location === y.source?.location
		}),
	}), [editor])
	const layers = useValue(layerSignal)
	const selected = useValue('layer selection', () => editor.getSelectedShapeIds(), [editor])
	const needle = query.trim().toLowerCase()
	const filtered = layers.filter((layer) => !needle || (layer.name + ' ' + layer.kind).toLowerCase().includes(needle))

	return <div className="cc-layer-browser">
		<label className="cc-layer-search"><Search size={16} aria-hidden="true" /><input type="search" aria-label="Find a layer" placeholder="Find a layer" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
		<div className="cc-sources__scroll">
			{filtered.length ? <ul className="cc-layer-list" aria-label="Canvas layers">
				{filtered.map((layer) => {
					const Icon = layer.connection ? Link2 : layerKinds[layer.type as keyof typeof layerKinds]?.[1] ?? File
					const LockIcon = layer.locked ? Lock : LockOpen
					return <li key={layer.id} data-selected={selected.includes(layer.id)}>
						<button type="button" className="cc-layer-locate" style={{ paddingInlineStart: 8 + Math.min(layer.depth, 4) * 12 }}
							aria-label={`Locate ${layer.name}`} aria-pressed={selected.includes(layer.id)} onClick={() => onLocate(layer.id, layer.connection)}>
							{layer.source ? <SourceIcon tool={layer.source.tool} location={layer.source.location} /> : <Icon size={16} aria-hidden="true" />}
							<span title={layer.name}>{layer.name}{layer.name !== layer.kind && <small>{layer.kind}</small>}</span>
						</button>
						<button type="button" className="cc-board-icon" disabled={!canEdit} aria-label={`${layer.locked ? 'Unlock' : 'Lock'} ${layer.name}`}
							title={layer.locked ? 'Unlock layer' : 'Lock layer'} onClick={() => {
								editor.markHistoryStoppingPoint('lock layer')
								editor.toggleLock([layer.id])
							}}>
							<LockIcon size={15} aria-hidden="true" />
						</button>
					</li>
				})}
			</ul> : <p className="cc-workspace-hint">{needle ? 'No layers match that search.' : 'Add something to the canvas to see it here.'}</p>}
		</div>
	</div>
}
