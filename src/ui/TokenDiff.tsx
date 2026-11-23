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
			<span className="cc-token__radius" style={{ borderTopLeftRadius: `${Math.min(Number(value), 14)}px` }} />
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
