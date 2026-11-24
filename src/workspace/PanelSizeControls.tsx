import { ChevronsDown, ChevronsUp, X } from 'lucide-react'

export function PanelSizeControls({ expanded, onResize, onClose, name }: {
	expanded: boolean; onResize: () => void; onClose: () => void; name: string
}) {
	const ResizeIcon = expanded ? ChevronsDown : ChevronsUp
	return <div className="cc-panel-size">
		<button type="button" className="cc-board-icon cc-panel-resize" aria-label={`${expanded ? 'Minimize' : 'Expand'} ${name}`}
			title={`${expanded ? 'Minimize' : 'Expand'} ${name}`} onClick={onResize}><ResizeIcon size={18} /></button>
		<button type="button" className="cc-board-icon" aria-label={`Close ${name}`} title={`Close ${name}`} onClick={onClose}><X size={17} /></button>
	</div>
}
