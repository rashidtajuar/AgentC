import { useEffect, useRef, useState } from 'react'
import { ArrowRight, CircleHelp, Layers, Network, PanelRight, X } from 'lucide-react'

const seenKey = 'agentc:canvas-guide:v1'
const steps = [
	{ icon: PanelRight, title: 'Put something on the board', text: 'Open Add to pin a source or choose an image. The canvas toolbar has drawing, text, and sticky notes.' },
	{ icon: Network, title: 'Show how things connect', text: 'Switch to Node map to see relationships. Use the Arrow tool to connect two items.' },
	{ icon: Layers, title: 'Find a layer in seconds', text: 'Open Layers and search by name or type. Choose a result to select it and bring it into view.' },
	{ icon: CircleHelp, title: 'Review a suggested layout', text: 'Open Assistant to preview an arrangement by source type. Review the result before accepting it.' },
]

export function useCanvasGuide() {
	const [hint, setHint] = useState(() => {
		try { return !localStorage.getItem(seenKey) } catch { return true }
	})
	const [open, setOpen] = useState(false)
	function dismissHint() {
		setHint(false)
		try { localStorage.setItem(seenKey, 'seen') } catch { /* The guide is still available from Help. */ }
	}
	return { hint, open, dismissHint, show: () => { dismissHint(); setOpen(true) }, close: () => setOpen(false) }
}

export function CanvasGuide({ onClose }: { onClose: () => void }) {
	const dialog = useRef<HTMLDialogElement>(null)
	const [index, setIndex] = useState(0)
	const step = steps[index]
	useEffect(() => {
		const active = document.activeElement
		const modal = dialog.current
		modal?.showModal()
		return () => {
			modal?.close()
			if (active instanceof HTMLElement && active !== document.body && active.isConnected) active.focus()
			else document.getElementById('canvas-guide-trigger')?.focus()
		}
	}, [])

	const Icon = step.icon
	return <dialog className="cc-guide" ref={dialog} aria-labelledby="canvas-guide-title" onCancel={(event) => {
		event.preventDefault()
		onClose()
	}}>
		<header><span>Canvas guide</span><button type="button" className="cc-board-icon" aria-label="Close guide" onClick={onClose} autoFocus><X size={18} /></button></header>
		<div className="cc-guide__step" aria-live="polite">
			<Icon size={24} aria-hidden="true" />
			<h2 id="canvas-guide-title">{step.title}</h2>
			<p>{step.text}</p>
		</div>
		<footer>
			<span>Step {index + 1} of {steps.length}</span>
			<div>
				{index > 0 && <button type="button" className="cc-btn cc-btn--ghost" onClick={() => setIndex(index - 1)}>Back</button>}
				<button type="button" className="cc-btn cc-btn--primary" onClick={() => index + 1 === steps.length ? onClose() : setIndex(index + 1)}>
					{index + 1 === steps.length ? 'Done' : <>Next <ArrowRight size={16} /></>}
				</button>
			</div>
		</footer>
	</dialog>
}
