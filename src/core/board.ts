import type { Board, BoardShape, CanvasOp } from './types'

export function emptyBoard(): Board {
	return { shapes: [], relationships: [], votes: {}, dots: {} }
}

/** Pure reducer: returns a new board with the ops applied. Ops that reference missing ids are skipped. */
export function applyOps(board: Board, ops: CanvasOp[]): Board {
	let shapes = board.shapes
	let relationships = board.relationships
	let votes = board.votes
	let dots = board.dots
	const has = (id: string) => shapes.some((s) => s.id === id)
	const add = (shape: BoardShape) => {
		if (!has(shape.id)) shapes = [...shapes, shape]
	}

	for (const op of ops) {
		switch (op.op) {
			case 'createFrame':
				add({
					id: op.id,
					type: 'direction',
					x: op.x,
					y: op.y,
					w: op.w,
					h: op.h,
					props: { name: op.name, rationale: op.rationale },
				})
				break
			case 'createNote':
				add({
					id: op.id,
					type: 'note',
					x: op.x,
					y: op.y,
					...(op.parentId ? { parentId: op.parentId } : {}),
					props: { text: op.text, author: op.author },
				})
				break
			case 'createShape':
				add(op.shape)
				break
			case 'moveShapes': {
				const byId = new Map(op.moves.map((m) => [m.id, m]))
				shapes = shapes.map((s) => {
					const m = byId.get(s.id)
					if (!m) return s
					return { ...s, x: m.x, y: m.y, ...(m.parentId !== undefined ? { parentId: m.parentId } : {}) }
				})
				break
			}
			case 'connect':
				if (has(op.from) && has(op.to) && !relationships.some((r) => r.id === op.id)) {
					relationships = [...relationships, { id: op.id, from: op.from, to: op.to, kind: op.kind }]
				}
				break
			case 'setStatus':
				dots = { ...dots, [op.id]: op.dot }
				break
			case 'addVote': {
				const current = votes[op.directionId] ?? []
				if (!current.includes(op.voter)) votes = { ...votes, [op.directionId]: [...current, op.voter] }
				break
			}
		}
	}
	return { shapes, relationships, votes, dots }
}
