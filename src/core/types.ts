// Connected Canvas — domain model. No UI dependencies: shared by the demo and the real product.

export type ToolKind = 'figma' | 'illustrator' | 'repo' | 'doc' | 'image'
export type ArtifactStatus = 'linked' | 'changed' | 'missing' | 'inaccessible'
export type Capability = 'open' | 'preview' | 'read' | 'propose-edit'

/** A Living Artifact: a canvas object that points at a real source. */
export interface Artifact {
	id: string
	name: string
	tool: ToolKind
	ext: string
	location: string
	status: ArtifactStatus
	capabilities: Capability[]
	summary?: string
}

export type RelationshipKind =
	| 'inspired'
	| 'constrains'
	| 'developed-into'
	| 'implemented-in'
	| 'included-in'

export interface Relationship {
	id: string
	from: string
	to: string
	kind: RelationshipKind
}

export interface Decision {
	id: string
	title: string
	rationale: string
	artifactIds: string[]
	approvedBy: string
	time: string
	votes: number
}

export type PermissionLevel = 'read' | 'suggest' | 'prepare' | 'execute'

export interface TokenChange {
	name: string
	before: string
	after: string
	source: string
}

export interface FileDiff {
	path: string
	/** Unified diff text */
	patch: string
}

export type DotState = 'proposal' | 'synced' | 'changed' | 'approved'

export type BoardShapeType = 'artifact' | 'reference' | 'direction' | 'decision' | 'pull-request' | 'note'

export interface BoardShape {
	id: string
	type: BoardShapeType
	x: number
	y: number
	w?: number
	h?: number
	parentId?: string
	tags?: string[]
	props: Record<string, unknown>
}

export type CanvasOp =
	| { op: 'createFrame'; id: string; name: string; rationale: string; x: number; y: number; w: number; h: number }
	| { op: 'moveShapes'; moves: { id: string; x: number; y: number; parentId?: string }[] }
	| { op: 'createNote'; id: string; text: string; x: number; y: number; parentId?: string; author: string }
	| { op: 'createShape'; shape: BoardShape }
	| { op: 'connect'; id: string; from: string; to: string; kind: RelationshipKind }
	| { op: 'setStatus'; id: string; dot: DotState }
	| { op: 'addVote'; directionId: string; voter: string }

export type BeatId = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface ActionProposal {
	id: string
	beat: BeatId
	summary: string
	ops: CanvasOp[]
	tokenChanges?: TokenChange[]
	fileDiffs?: FileDiff[]
	permission: PermissionLevel
	/** true when approving it would act on a tool outside the canvas */
	external: boolean
}

export type StepState = 'pending' | 'running' | 'done' | 'failed'

export interface ExecutionStep {
	id: string
	label: string
	detail?: string
	state: StepState
}

export interface ExecutionRun {
	proposalId: string
	steps: ExecutionStep[]
}

export interface Board {
	shapes: BoardShape[]
	relationships: Relationship[]
	/** directionId → voter names */
	votes: Record<string, string[]>
	/** shapeId → dot state */
	dots: Record<string, DotState>
}
