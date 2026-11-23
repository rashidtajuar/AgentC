import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import 'tldraw/tldraw.css'
import './styles/tokens.css'
import '@fontsource/instrument-serif'
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource/young-serif'
import './styles/app.css'
import './styles/shapes.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>
)
