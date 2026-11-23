// Sample content for the demo. Every name, file and person here is fictional (sample data).
import type { TokenChange } from '../core/types'

export const PROJECT = {
	client: 'Halden Coffee',
	project: 'Brand & Website',
	studio: 'Northbound Studio',
	repo: 'northbound/halden-website',
}

export const PEOPLE = {
	you: { name: 'You', role: 'Creative lead', initials: 'Y', hue: '#e5432b' },
	maya: { name: 'Maya', role: 'Designer', initials: 'M', hue: '#2b57e8' },
	jon: { name: 'Jon', role: 'Developer', initials: 'J', hue: '#1c9a57' },
} as const

export interface PhotoCredit {
	url: string
	alt: string
	author: string
	authorUrl: string
	sourceUrl: string
}

const unsplash = (photo: string, w = 560) =>
	`https://images.unsplash.com/${photo}?auto=format&fit=crop&w=${w}&h=${Math.round(w * 0.82)}&q=80`

const UTM = '?utm_source=connected_canvas_demo&utm_medium=referral'

/** Unsplash photos (Unsplash License), hotlinked as Unsplash asks, with credit. */
export const PHOTOS: Record<string, PhotoCredit> = {
	cup: {
		url: unsplash('photo-1782351094137-14cef7134c18'),
		alt: 'A rustic handmade ceramic cup on a wooden table',
		author: 'Adam Rasheed',
		authorUrl: `https://unsplash.com/@adamrasheed${UTM}`,
		sourceUrl: `https://unsplash.com/photos/n9I_Xp7nyCk${UTM}`,
	},
	glaze: {
		url: unsplash('photo-1782351254515-d7a53dc60b7f'),
		alt: 'Rustic ceramic cup with red glaze on a wooden surface',
		author: 'Adam Rasheed',
		authorUrl: `https://unsplash.com/@adamrasheed${UTM}`,
		sourceUrl: `https://unsplash.com/photos/dpmUrwiS4q4${UTM}`,
	},
	beans: {
		url: unsplash('photo-1628546459752-b92e62a89cd8'),
		alt: 'Roasted coffee beans on a black surface',
		author: 'Brunno Tozzo',
		authorUrl: `https://unsplash.com/@tozzo${UTM}`,
		sourceUrl: `https://unsplash.com/photos/JU9pA9SS_P8${UTM}`,
	},
	book: {
		url: unsplash('photo-1526050071463-2c476b162a4c'),
		alt: 'An open book with minimalist graphic layouts',
		author: 'Isabella Fischer',
		authorUrl: `https://unsplash.com/@izzyfisch_${UTM}`,
		sourceUrl: `https://unsplash.com/photos/6ast1xZ9YJY${UTM}`,
	},
	magazine: {
		url: unsplash('photo-1617050318658-a9a3175e34cb'),
		alt: 'An editorial magazine layout on a white table',
		author: 'Brands&People',
		authorUrl: `https://unsplash.com/@brandsandpeople${UTM}`,
		sourceUrl: `https://unsplash.com/photos/V9zInThgKa4${UTM}`,
	},
}

export const DIRECTIONS = [
	{
		id: 'dir-warm',
		name: 'Warm & tactile',
		rationale: 'Hand-thrown ceramics, roast tones and kiln reds. Feels like the café counter: honest and unhurried.',
	},
	{
		id: 'dir-editorial',
		name: 'Editorial',
		rationale: 'Quiet grids, wide margins and a sharp serif. Positions Halden as a considered, origin-first roaster.',
	},
	{
		id: 'dir-playful',
		name: 'Playful modern',
		rationale: 'Fizzy colour and chunky rounded type. Loud and friendly — strongest on cans and social.',
	},
] as const

export type DirectionId = (typeof DIRECTIONS)[number]['id']
export const APPROVABLE_DIRECTION: DirectionId = 'dir-warm'

export const COPY = {
	greeting:
		'Hi — I can see 10 references and 4 linked files for Halden Coffee. Want me to sort the references into directions?',
	organize: {
		thinking: ['Reading 10 references', 'Comparing colour, material and type', 'Drafting three directions'],
		message:
			'I grouped the references into three directions — Warm & tactile, Editorial and Playful modern — and lined your files up underneath. Nothing has moved yet: preview it, then accept or discard.',
		summary: 'Create 3 directions · sort references · tidy 4 files',
	},
	gaps: {
		thinking: ['Checking each direction against Halden_Brief.pdf'],
		message:
			'Two gaps against the brief: Warm & tactile has no packaging reference, and Playful modern has no real product shot. I added a note to each.',
		summary: 'Add 2 gap notes',
		notes: {
			warm: 'Gap: no packaging reference yet. Add a bag or label example?',
			playful: 'Gap: no real product shot — everything here is flat colour.',
		},
	},
	voteAsk: 'I asked Maya and Jon to vote on the three directions.',
	voteDone: (n: number) => `Warm & tactile has ${n} votes. Approve it when you're ready.`,
	approve: {
		message:
			'Warm & tactile is approved and recorded as a decision. I suggest linking it to the files it shapes: the logo exploration, the Web UI design and theme.ts.',
		summary: 'Link the decision to 3 files',
	},
	apply: {
		thinking: [
			'Reading the approved decision',
			'Reading Halden — Web UI.fig variables (read only)',
			'Reading website/src/theme.ts',
			'Mapping 6 design tokens to code',
		],
		message:
			"Here's the change I'd make to the website: 6 values in theme.ts updated to match the Warm & tactile tokens in Figma. Nothing changes until you approve it.",
		summary: 'Update website/src/theme.ts — 6 tokens',
	},
	executed:
		'Pull request #42 is open on northbound/halden-website and linked to the decision on the wall. Nothing was merged or deployed.',
	connections:
		"Here's how Warm & tactile travels: 4 references → the approved decision → logo, Web UI and theme.ts → pull request #42.",
	help: 'In this demo I can sort references into directions, spot gaps, run a team vote, and turn the approved direction into a reviewed code change. Try the suggestion below.',
	notInDemo:
		'In this demo the team has voted for Warm & tactile — in the real product any direction can be approved.',
}

export const TOKEN_CHANGES: TokenChange[] = [
	{ name: 'color/brand/primary', before: '#1F3A5F', after: '#B4482E', source: 'Halden — Web UI.fig' },
	{ name: 'color/surface/base', before: '#FFFFFF', after: '#F4ECE2', source: 'Halden — Web UI.fig' },
	{ name: 'color/text/primary', before: '#111827', after: '#2B1D16', source: 'Halden — Web UI.fig' },
	{ name: 'color/accent', before: '#3B82F6', after: '#D9A441', source: 'Halden — Web UI.fig' },
	{ name: 'font/display', before: 'Inter', after: 'Young Serif', source: 'Halden — Web UI.fig' },
	{ name: 'radius/card', before: '4', after: '14', source: 'Halden — Web UI.fig' },
]

export const THEME_PATCH = `--- a/website/src/theme.ts
+++ b/website/src/theme.ts
@@ -1,17 +1,17 @@
 // Generated from Figma variables — Halden — Web UI
 export const theme = {
   colors: {
-    primary: '#1F3A5F',
-    surface: '#FFFFFF',
-    text: '#111827',
-    accent: '#3B82F6',
+    primary: '#B4482E', // kiln red
+    surface: '#F4ECE2', // clay
+    text: '#2B1D16', // roast
+    accent: '#D9A441', // honey
   },
   fonts: {
-    display: 'Inter, system-ui, sans-serif',
+    display: '"Young Serif", Georgia, serif',
     body: 'Inter, system-ui, sans-serif',
   },
   radius: {
-    card: 4,
+    card: 14,
     button: 999,
   },
 }`

export const EXECUTION_STEPS = [
	{ id: 'branch', label: 'Create branch', detail: 'direction/warm-tactile' },
	{ id: 'commit', label: 'Commit 1 file', detail: 'website/src/theme.ts · +6 −6' },
	{ id: 'pr', label: 'Open pull request #42', detail: 'northbound/halden-website' },
]
