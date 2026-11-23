/** setTimeout as a promise that rejects with AbortError when the signal fires. */
export function delay(ms: number, signal: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'))
		const t = setTimeout(resolve, ms)
		signal.addEventListener(
			'abort',
			() => {
				clearTimeout(t)
				reject(new DOMException('Aborted', 'AbortError'))
			},
			{ once: true }
		)
	})
}

export function isAbort(e: unknown) {
	return e instanceof DOMException && e.name === 'AbortError'
}
