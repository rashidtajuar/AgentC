import { useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'

export function Composer({ onSend, disabled }: { onSend: (text: string) => void; disabled?: boolean }) {
	const [text, setText] = useState('')
	const ref = useRef<HTMLTextAreaElement>(null)
	const empty = text.trim().length === 0

	const send = () => {
		if (empty || disabled) return
		onSend(text.trim())
		setText('')
		ref.current?.focus()
	}

	return (
		<form
			className="cc-composer"
			onSubmit={(e) => {
				e.preventDefault()
				send()
			}}
		>
			<label htmlFor="cc-ask" className="cc-sr">
				Ask the assistant about this board
			</label>
			<textarea
				id="cc-ask"
				ref={ref}
				rows={2}
				value={text}
				placeholder="Ask about this board…"
				onChange={(e) => setText(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === 'Enter' && !e.shiftKey) {
						e.preventDefault()
						send()
					}
				}}
			/>
			<button type="submit" className="cc-composer__send" disabled={empty || disabled} aria-label="Send">
				<ArrowUp size={16} strokeWidth={2.4} aria-hidden="true" />
			</button>
		</form>
	)
}
