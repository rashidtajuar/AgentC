import { Code2, File, FileBadge, FileText, Folder, Image, Link2, Monitor } from 'lucide-react'

const brands: Record<string, string> = {
	figma: 'figma',
	github: 'github',
	drive: 'googledrive',
	illustrator: 'adobeillustrator',
}

function sourceBrand(tool: string, location = '') {
	if (tool === 'figma' || tool === 'illustrator') return tool
	// The demo uses authored pseudo-locations; real cards use validated web URLs.
	if (location.startsWith('github://') || (tool === 'repo' && !location.includes('://'))) return 'github'
	if (location.startsWith('drive://')) return 'drive'
	try {
		const host = new URL(location).hostname
		if (host === 'github.com') return 'github'
		if (host === 'docs.google.com' || host === 'drive.google.com') return 'drive'
		if (host === 'figma.com' || host === 'www.figma.com') return 'figma'
	} catch { /* A missing URL uses the generic file icon. */ }
}

export function SourceIcon({ tool, location, size = 15, kindOnly = false }: {
	tool: string
	location?: string
	size?: number
	kindOnly?: boolean
}) {
	const brand = kindOnly ? undefined : sourceBrand(tool, location)
	if (brand) return <span className="cc-source-icon" aria-hidden="true" style={{
		width: size, height: size, maskImage: `url(${import.meta.env.BASE_URL}brands/${brands[brand]}.svg)`,
	}} />
	const Icon = {
		doc: FileText, pdf: FileBadge, folder: Folder, file: File,
		image: Image, repo: Code2, desktop: Monitor,
	}[tool] ?? Link2
	return <Icon size={size} aria-hidden="true" strokeWidth={1.7} />
}
