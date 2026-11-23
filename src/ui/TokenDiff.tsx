import { ArrowRight } from 'lucide-react'
import type { TokenChange } from '../core/types'

const isColor = (v: string) => /^#[0-9a-f]{3,8}$/i.test(v)

function Value({ name, value }: { name: string; value: string }) {
	if (isColor(value))
		return (
			<span className="cc-token__val">
				<span className="cc-token__chip" style={{ background: value }} />
				<code>{value}</code>
			</span>
		)
	if (name.startsWith('font/'))
		return (
			<span className="cc-token__val">
				<span className="cc-token__font" style={{ fontFamily: `'${value}', serif` }}>
					Aa
				</span>
				<code>{value}</code>
			</span>
		)
	return (
		<span className="cc-token__val">
			<svg className="cc-token__radius" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
				<path d={`M2 15 V${2 + Math.min(Number(value), 12)} Q2 2 ${2 + Math.min(Number(value), 12)} 2 H15`} fill="none" stroke="currentColor" strokeWidth="2" />
			</svg>
			<code>{value}px</code>
		</span>
	)
}

export function TokenDiff({ changes }: { changes: TokenChange[] }) {
	return (
		<ul className="cc-tokens" aria-label="Design tokens">
			{changes.map((t) => (
				<li key={t.name} className="cc-token">
					<code className="cc-token__name">{t.name}</code>
					<Value name={t.name} value={t.before} />
					<ArrowRight size={14} className="cc-token__arrow" aria-label="becomes" />
					<Value name={t.name} value={t.after} />
				</li>
			))}
		</ul>
	)
}
