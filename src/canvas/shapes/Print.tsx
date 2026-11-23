import type { ReactNode } from 'react'
import { HTMLContainer } from 'tldraw'
import { Dot } from '../../ui/Dot'
import { litState, useCanvasUi } from '../canvasUi'
import { ccMeta } from './types'

interface PrintProps {
	shape: { id: string; meta: unknown; props: { w: number; h: number } }
	className?: string
	children: ReactNode
	label: string
}

/** The white "print" every artifact sits on: paper shadow, ghost and highlight states. */
export function Print({ shape, className = '', children, label }: PrintProps) {
	const meta = ccMeta(shape)
	const highlight = useCanvasUi((s) => s.highlight)
	const lit = litState(highlight, meta.boardId)
	return (
		<HTMLContainer
			className={`cc-print ${className}`}
			data-ghost={meta.ghost ? 'true' : undefined}
			data-lit={lit}
			aria-label={label}
			style={{ width: shape.props.w, height: shape.props.h }}
		>
			{children}
			{meta.ghost ? (
				<span className="cc-print__ghost-dot">
					<Dot state="proposal" size="m" />
				</span>
			) : null}
		</HTMLContainer>
	)
}
