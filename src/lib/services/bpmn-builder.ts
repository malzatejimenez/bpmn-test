import BpmnModdle from 'bpmn-moddle';
import type {
	BPMNFlowDefinition,
	BPMNNode,
	BPMNConnection,
	BPMNPosition
} from '$lib/types/bpmn.types';
import { BPMN_DEFAULT_DIMENSIONS } from '$lib/types/bpmn.types';

/**
 * Service to build BPMN XML from flow definitions
 */
export class BpmnBuilder {
	private moddle: BpmnModdle;

	constructor() {
		this.moddle = new BpmnModdle();
	}

	/**
	 * Convert a flow definition to BPMN 2.0 XML
	 */
	async buildXML(flowDefinition: BPMNFlowDefinition): Promise<string> {
		const definitions = this.createDefinitions(flowDefinition);
		const result = await this.moddle.toXML(definitions, { format: true });
		return result.xml;
	}

	/**
	 * Create BPMN definitions element
	 */
	private createDefinitions(flowDefinition: BPMNFlowDefinition) {
		const process = this.createProcess(flowDefinition);
		const diagram = this.createBPMNDiagram(flowDefinition, process);

		return this.moddle.create('bpmn:Definitions', {
			id: `Definitions_${flowDefinition.id}`,
			targetNamespace: 'http://bpmn.io/schema/bpmn',
			exporter: 'bpmn-builder',
			exporterVersion: '1.0.0',
			rootElements: [process],
			diagrams: [diagram]
		});
	}

	/**
	 * Create BPMN process element
	 */
	private createProcess(flowDefinition: BPMNFlowDefinition) {
		const flowElements: any[] = [];

		// Create flow elements (nodes)
		for (const node of flowDefinition.nodes) {
			const element = this.createFlowElement(node);
			flowElements.push(element);
		}

		// Create sequence flows (connections)
		for (const connection of flowDefinition.connections) {
			const sequenceFlow = this.createSequenceFlow(connection);
			flowElements.push(sequenceFlow);
		}

		return this.moddle.create('bpmn:Process', {
			id: flowDefinition.id,
			name: flowDefinition.name,
			isExecutable: true,
			flowElements
		});
	}

	/**
	 * Create a flow element (node) based on its type
	 */
	private createFlowElement(node: BPMNNode) {
		const typeMapping: Record<string, string> = {
			startEvent: 'bpmn:StartEvent',
			endEvent: 'bpmn:EndEvent',
			task: 'bpmn:Task',
			userTask: 'bpmn:UserTask',
			serviceTask: 'bpmn:ServiceTask',
			scriptTask: 'bpmn:ScriptTask',
			sendTask: 'bpmn:SendTask',
			receiveTask: 'bpmn:ReceiveTask',
			manualTask: 'bpmn:ManualTask',
			businessRuleTask: 'bpmn:BusinessRuleTask',
			exclusiveGateway: 'bpmn:ExclusiveGateway',
			parallelGateway: 'bpmn:ParallelGateway',
			inclusiveGateway: 'bpmn:InclusiveGateway',
			eventBasedGateway: 'bpmn:EventBasedGateway',
			subProcess: 'bpmn:SubProcess',
			callActivity: 'bpmn:CallActivity'
		};

		const bpmnType = typeMapping[node.type] || 'bpmn:Task';

		return this.moddle.create(bpmnType, {
			id: node.id,
			name: node.label,
			...node.properties
		});
	}

	/**
	 * Create a sequence flow (connection)
	 */
	private createSequenceFlow(connection: BPMNConnection) {
		const sequenceFlow: any = {
			id: connection.id,
			sourceRef: this.moddle.create('bpmn:FlowNode', { id: connection.from }),
			targetRef: this.moddle.create('bpmn:FlowNode', { id: connection.to })
		};

		if (connection.label) {
			sequenceFlow.name = connection.label;
		}

		if (connection.condition) {
			sequenceFlow.conditionExpression = this.moddle.create('bpmn:FormalExpression', {
				body: connection.condition
			});
		}

		return this.moddle.create('bpmn:SequenceFlow', sequenceFlow);
	}

	/**
	 * Create BPMN diagram with visual information
	 */
	private createBPMNDiagram(flowDefinition: BPMNFlowDefinition, process: any) {
		const plane = this.createBPMNPlane(flowDefinition, process);

		return this.moddle.create('bpmndi:BPMNDiagram', {
			id: `BPMNDiagram_${flowDefinition.id}`,
			plane
		});
	}

	/**
	 * Create BPMN plane with shapes and edges
	 */
	private createBPMNPlane(flowDefinition: BPMNFlowDefinition, process: any) {
		const planeElements: any[] = [];

		// Create shapes for nodes
		for (const node of flowDefinition.nodes) {
			const shape = this.createBPMNShape(node);
			planeElements.push(shape);
		}

		// Create edges for connections
		for (const connection of flowDefinition.connections) {
			const edge = this.createBPMNEdge(connection, flowDefinition.nodes);
			planeElements.push(edge);
		}

		return this.moddle.create('bpmndi:BPMNPlane', {
			id: `BPMNPlane_${flowDefinition.id}`,
			bpmnElement: process,
			planeElement: planeElements
		});
	}

	/**
	 * Create BPMN shape for a node
	 */
	private createBPMNShape(node: BPMNNode) {
		const position = node.position || this.generatePosition();
		const dimensions =
			node.dimensions || BPMN_DEFAULT_DIMENSIONS[node.type] || { width: 100, height: 80 };

		const bounds = this.moddle.create('dc:Bounds', {
			x: position.x,
			y: position.y,
			width: dimensions.width,
			height: dimensions.height
		});

		return this.moddle.create('bpmndi:BPMNShape', {
			id: `${node.id}_di`,
			bpmnElement: this.moddle.create('bpmn:FlowNode', { id: node.id }),
			bounds
		});
	}

	/**
	 * Create BPMN edge for a connection
	 */
	private createBPMNEdge(connection: BPMNConnection, nodes: BPMNNode[]) {
		const sourceNode = nodes.find((n) => n.id === connection.from);
		const targetNode = nodes.find((n) => n.id === connection.to);

		const waypoints = this.generateWaypoints(sourceNode, targetNode);

		return this.moddle.create('bpmndi:BPMNEdge', {
			id: `${connection.id}_di`,
			bpmnElement: this.moddle.create('bpmn:SequenceFlow', { id: connection.id }),
			waypoint: waypoints
		});
	}

	/**
	 * Generate waypoints for a connection
	 */
	private generateWaypoints(sourceNode?: BPMNNode, targetNode?: BPMNNode) {
		const waypoints: any[] = [];

		const sourcePos = sourceNode?.position || { x: 100, y: 100 };
		const targetPos = targetNode?.position || { x: 300, y: 100 };

		const sourceDims =
			sourceNode?.dimensions ||
			BPMN_DEFAULT_DIMENSIONS[sourceNode?.type || 'task'] ||
			{ width: 100, height: 80 };
		const targetDims =
			targetNode?.dimensions ||
			BPMN_DEFAULT_DIMENSIONS[targetNode?.type || 'task'] ||
			{ width: 100, height: 80 };

		// Start waypoint (right side of source)
		waypoints.push(
			this.moddle.create('dc:Point', {
				x: sourcePos.x + (sourceDims.width || 100),
				y: sourcePos.y + (sourceDims.height || 80) / 2
			})
		);

		// End waypoint (left side of target)
		waypoints.push(
			this.moddle.create('dc:Point', {
				x: targetPos.x,
				y: targetPos.y + (targetDims.height || 80) / 2
			})
		);

		return waypoints;
	}

	/**
	 * Generate a default position (for nodes without explicit position)
	 */
	private generatePosition(): BPMNPosition {
		return {
			x: 100,
			y: 100
		};
	}

	/**
	 * Auto-layout nodes in a simple left-to-right flow
	 */
	autoLayout(flowDefinition: BPMNFlowDefinition): BPMNFlowDefinition {
		const layouted = { ...flowDefinition };
		const nodeMap = new Map<string, BPMNNode>();

		// Find start events
		const startNodes = layouted.nodes.filter((n) => n.type === 'startEvent');
		const visitedNodes = new Set<string>();

		let currentX = 100;
		const currentY = 200;
		const horizontalSpacing = 200;
		const verticalSpacing = 150;

		// Build adjacency map
		const adjacencyMap = new Map<string, string[]>();
		for (const conn of layouted.connections) {
			if (!adjacencyMap.has(conn.from)) {
				adjacencyMap.set(conn.from, []);
			}
			adjacencyMap.get(conn.from)!.push(conn.to);
		}

		// BFS layout from start events
		const queue: Array<{ nodeId: string; x: number; y: number }> = [];

		// Position start events
		startNodes.forEach((node, index) => {
			const y = currentY + index * verticalSpacing;
			node.position = { x: currentX, y };
			nodeMap.set(node.id, node);
			visitedNodes.add(node.id);
			queue.push({ nodeId: node.id, x: currentX, y });
		});

		// BFS to position remaining nodes
		while (queue.length > 0) {
			const current = queue.shift()!;
			const nextNodes = adjacencyMap.get(current.nodeId) || [];

			nextNodes.forEach((nextNodeId, index) => {
				if (!visitedNodes.has(nextNodeId)) {
					const node = layouted.nodes.find((n) => n.id === nextNodeId);
					if (node) {
						const x = current.x + horizontalSpacing;
						const y = current.y + index * verticalSpacing;
						node.position = { x, y };
						nodeMap.set(node.id, node);
						visitedNodes.add(nextNodeId);
						queue.push({ nodeId: nextNodeId, x, y });
					}
				}
			});
		}

		return layouted;
	}
}

/**
 * Singleton instance
 */
export const bpmnBuilder = new BpmnBuilder();
