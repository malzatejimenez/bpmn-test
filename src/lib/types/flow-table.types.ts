import type { BPMNNodeType } from './bpmn.types';

/**
 * Connection from a node to another node
 */
export interface TableConnection {
	targetId: string; // ID of the target node
	label?: string; // Optional label for the connection (e.g., "Yes", "No")
	condition?: string; // Optional condition (e.g., "${approved == true}")
}

/**
 * A row in the flow table representing a BPMN node
 */
export interface TableRow {
	rowNumber: number; // Auto-generated row number (1, 2, 3...)
	id: string; // Unique node ID
	type: BPMNNodeType; // Type of BPMN node
	label: string; // Descriptive label
	connectsTo: TableConnection[]; // Connections to other nodes
}

/**
 * Node type categories for UI organization
 */
export const NODE_TYPE_CATEGORIES = {
	events: ['startEvent', 'endEvent'] as BPMNNodeType[],
	tasks: [
		'task',
		'userTask',
		'serviceTask',
		'scriptTask',
		'sendTask',
		'receiveTask',
		'manualTask',
		'businessRuleTask'
	] as BPMNNodeType[],
	gateways: [
		'exclusiveGateway',
		'parallelGateway',
		'inclusiveGateway',
		'eventBasedGateway'
	] as BPMNNodeType[],
	other: ['subProcess', 'callActivity'] as BPMNNodeType[]
};

/**
 * Icons for each node type
 */
export const NODE_TYPE_ICONS: Record<BPMNNodeType, string> = {
	startEvent: '⚪',
	endEvent: '⚫',
	task: '📋',
	userTask: '👤',
	serviceTask: '⚙️',
	scriptTask: '📜',
	sendTask: '✉️',
	receiveTask: '📥',
	manualTask: '✋',
	businessRuleTask: '📊',
	exclusiveGateway: '◇',
	parallelGateway: '✚',
	inclusiveGateway: '○',
	eventBasedGateway: '⬡',
	subProcess: '📦',
	callActivity: '📞'
};

/**
 * Display names for node types
 */
export const NODE_TYPE_LABELS: Record<BPMNNodeType, string> = {
	startEvent: 'Start Event',
	endEvent: 'End Event',
	task: 'Task',
	userTask: 'User Task',
	serviceTask: 'Service Task',
	scriptTask: 'Script Task',
	sendTask: 'Send Task',
	receiveTask: 'Receive Task',
	manualTask: 'Manual Task',
	businessRuleTask: 'Business Rule Task',
	exclusiveGateway: 'Exclusive Gateway (XOR)',
	parallelGateway: 'Parallel Gateway (AND)',
	inclusiveGateway: 'Inclusive Gateway (OR)',
	eventBasedGateway: 'Event-Based Gateway',
	subProcess: 'Sub-Process',
	callActivity: 'Call Activity'
};
