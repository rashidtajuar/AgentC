export function message(error: unknown) {
	return error instanceof Error ? error.message : 'Something went wrong. Your saved data has been kept.'
}
