/**
 * BPMN Node Types
 */
export type BPMNNodeType =
	| 'startEvent'
	| 'endEvent'
	| 'task'
	| 'userTask'
	| 'serviceTask'
	| 'scriptTask'
	| 'sendTask'
	| 'receiveTask'
	| 'manualTask'
	| 'businessRuleTask'
	| 'exclusiveGateway'
	| 'parallelGateway'
	| 'inclusiveGateway'
	| 'eventBasedGateway'
	| 'subProcess'
	| 'callActivity';

/**
 * Position of a BPMN node in the diagram
 */
export interface BPMNPosition {
	x: number;
	y: number;
}

/**
 * Dimensions of a BPMN node
 */
export interface BPMNDimensions {
	width?: number;
	height?: number;
}

/**
 * BPMN Node Definition
 */
export interface BPMNNode {
	id: string;
	type: BPMNNodeType;
	label: string;
	responsable?: string;
	position?: BPMNPosition;
	dimensions?: BPMNDimensions;
	properties?: Record<string, unknown>;
}

/**
 * BPMN Connection (Sequence Flow)
 */
export interface BPMNConnection {
	id: string;
	from: string; // source node id
	to: string; // target node id
	label?: string;
	condition?: string;
	properties?: Record<string, unknown>;
}

/**
 * BPMN Text Annotation
 */
export interface BPMNAnnotation {
	id: string;
	text: string;
	position?: BPMNPosition;
	dimensions?: BPMNDimensions;
}

/**
 * BPMN Association (links annotations to elements)
 */
export interface BPMNAssociation {
	id: string;
	sourceRef: string; // source element id
	targetRef: string; // target annotation id
}

/**
 * Complete BPMN Flow Definition
 */
export interface BPMNFlowDefinition {
	id: string;
	name: string;
	nodes: BPMNNode[];
	connections: BPMNConnection[];
	annotations?: BPMNAnnotation[];
	associations?: BPMNAssociation[];
	metadata?: {
		version?: string;
		author?: string;
		created?: string;
		modified?: string;
		description?: string;
	};
}

/**
 * Default dimensions for different node types
 */
export const BPMN_DEFAULT_DIMENSIONS: Record<string, BPMNDimensions> = {
	startEvent: { width: 36, height: 36 },
	endEvent: { width: 36, height: 36 },
	task: { width: 100, height: 80 },
	userTask: { width: 100, height: 80 },
	serviceTask: { width: 100, height: 80 },
	scriptTask: { width: 100, height: 80 },
	sendTask: { width: 100, height: 80 },
	receiveTask: { width: 100, height: 80 },
	manualTask: { width: 100, height: 80 },
	businessRuleTask: { width: 100, height: 80 },
	exclusiveGateway: { width: 50, height: 50 },
	parallelGateway: { width: 50, height: 50 },
	inclusiveGateway: { width: 50, height: 50 },
	eventBasedGateway: { width: 50, height: 50 },
	subProcess: { width: 350, height: 200 },
	callActivity: { width: 100, height: 80 }
};
