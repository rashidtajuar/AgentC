// Authored moodboard references (palettes, type specimens, textures) and photo credits.
import { useState } from 'react'
import { PHOTOS } from '../../demo/content'

const PALETTES: Record<string, { name: string; colors: [string, string][] }> = {
	kiln: {
		name: 'Kiln',
		colors: [
			['Kiln red', '#B4482E'],
			['Terracotta', '#D98B5F'],
			['Roast', '#5A3223'],
			['Clay', '#F4ECE2'],
			['Honey', '#D9A441'],
		],
	},
	fizz: {
		name: 'Fizz',
		colors: [
			['Blood orange', '#FF5A36'],
			['Lemon', '#FFC93C'],
			['Mint', '#3DDC97'],
			['Pool', '#4F86FF'],
			['Bubblegum', '#FF8AD8'],
		],
	},
}

export function ReferenceArt({ kind, asset, title }: { kind: string; asset: string; title: string }) {
	if (kind === 'photo') {
		return <Photo asset={asset} />
	}
	if (kind === 'swatch') {
		const p = PALETTES[asset]
		return (
			<div className="cc-ref__art cc-ref__art--swatch" aria-label={`${p?.name} palette`}>
				{p?.colors.map(([name, hex]) => (
					<div key={hex} className="cc-swatch" style={{ background: hex }}>
						<span className="cc-swatch__hex" data-dark={isDark(hex)}>
							{hex}
						</span>
						<span className="cc-sr">{name}</span>
					</div>
				))}
			</div>
		)
	}
	if (kind === 'specimen') {
		const serif = asset === 'serif'
		return (
			<div className={`cc-ref__art cc-ref__art--specimen cc-specimen--${asset}`}>
				<span className="cc-specimen__glyphs">{serif ? 'Aa' : 'Aa'}</span>
				<span className="cc-specimen__word">{serif ? 'Single origin' : 'Fizzy cold brew!'}</span>
				<span className="cc-specimen__name">{serif ? 'Instrument Serif' : 'Bricolage Grotesque 800'}</span>
			</div>
		)
	}
	return (
		<div className="cc-ref__art cc-ref__art--texture" aria-label={title}>
			<svg viewBox="0 0 200 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
				<rect width="200" height="160" fill="#FFC93C" />
				{BUBBLES.map(([cx, cy, r, c], i) => (
					<circle key={i} cx={cx} cy={cy} r={r} fill={c} />
				))}
			</svg>
		</div>
	)
}

function Photo({ asset }: { asset: string }) {
	const photo = PHOTOS[asset]
	const [failed, setFailed] = useState(false)
	if (!photo || failed)
		return (
			<div className="cc-ref__art cc-ref__art--missing" role="img" aria-label={photo?.alt ?? 'Image unavailable'}>
				<span>{photo ? 'Photo offline' : 'Image unavailable'}</span>
			</div>
		)
	return (
		<div className="cc-ref__art cc-ref__art--photo">
			<img src={photo.url} alt={photo.alt} draggable={false} onError={() => setFailed(true)} />
		</div>
	)
}

const BUBBLES: [number, number, number, string][] = [
	[20, 24, 16, '#FF5A36'],
	[62, 40, 9, '#4F86FF'],
	[104, 18, 22, '#FF8AD8'],
	[156, 46, 14, '#3DDC97'],
	[190, 12, 10, '#FF5A36'],
	[34, 92, 24, '#3DDC97'],
	[92, 84, 12, '#FF5A36'],
	[132, 106, 26, '#4F86FF'],
	[184, 98, 13, '#FF8AD8'],
	[14, 150, 12, '#4F86FF'],
	[70, 140, 18, '#FF8AD8'],
	[176, 150, 16, '#3DDC97'],
]

export function photoCredit(asset: string) {
	return PHOTOS[asset]
}

function isDark(hex: string) {
	const n = parseInt(hex.slice(1), 16)
	const r = (n >> 16) & 255
	const g = (n >> 8) & 255
	const b = n & 255
	return 0.299 * r + 0.587 * g + 0.114 * b < 150
}
