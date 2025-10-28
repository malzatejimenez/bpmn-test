import BpmnModdle from 'bpmn-moddle';
import { layoutProcess } from 'bpmn-auto-layout';
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
	 * Apply advanced auto-layout using bpmn-auto-layout library
	 * This generates optimal positioning for all elements and connections
	 */
	async applyAdvancedLayout(xml: string): Promise<string> {
		try {
			return await layoutProcess(xml);
		} catch (error) {
			console.error('Error applying advanced layout:', error);
			throw error;
		}
	}

	/**
	 * Build XML with advanced auto-layout applied
	 */
	async buildXMLWithAutoLayout(flowDefinition: BPMNFlowDefinition): Promise<string> {
		const xml = await this.buildXML(flowDefinition);
		return await this.applyAdvancedLayout(xml);
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

		// Create text annotations
		if (flowDefinition.annotations) {
			for (const annotation of flowDefinition.annotations) {
				const textAnnotation = this.moddle.create('bpmn:TextAnnotation', {
					id: annotation.id,
					text: annotation.text
				});
				flowElements.push(textAnnotation);
			}
		}

		// Create associations
		if (flowDefinition.associations) {
			for (const association of flowDefinition.associations) {
				const assoc = this.moddle.create('bpmn:Association', {
					id: association.id,
					sourceRef: this.moddle.create('bpmn:FlowNode', { id: association.sourceRef }),
					targetRef: this.moddle.create('bpmn:TextAnnotation', { id: association.targetRef })
				});
				flowElements.push(assoc);
			}
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

		// Merge responsable into properties if present
		const properties = {
			...node.properties,
			...(node.responsable && { responsable: node.responsable })
		};

		return this.moddle.create(bpmnType, {
			id: node.id,
			name: node.label,
			...properties
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

		// Create shapes for annotations
		if (flowDefinition.annotations) {
			for (const annotation of flowDefinition.annotations) {
				const shape = this.createAnnotationShape(annotation);
				planeElements.push(shape);
			}
		}

		// Create edges for connections
		for (const connection of flowDefinition.connections) {
			const edge = this.createBPMNEdge(connection, flowDefinition.nodes);
			planeElements.push(edge);
		}

		// Create edges for associations
		if (flowDefinition.associations) {
			for (const association of flowDefinition.associations) {
				const edge = this.createAssociationEdge(association, flowDefinition.nodes, flowDefinition.annotations || []);
				planeElements.push(edge);
			}
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
		const dimensions = node.dimensions ||
			BPMN_DEFAULT_DIMENSIONS[node.type] || { width: 100, height: 80 };

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

		const waypoints = this.generateWaypoints(sourceNode, targetNode, nodes);

		return this.moddle.create('bpmndi:BPMNEdge', {
			id: `${connection.id}_di`,
			bpmnElement: this.moddle.create('bpmn:SequenceFlow', { id: connection.id }),
			waypoint: waypoints
		});
	}

	/**
	 * Find elements that are between source and target vertically
	 */
	private findElementsBetween(
		sourceNode: BPMNNode,
		targetNode: BPMNNode,
		allNodes: BPMNNode[]
	): BPMNNode[] {
		if (!sourceNode.position || !targetNode.position) return [];

		const sourceDims = sourceNode.dimensions ||
			BPMN_DEFAULT_DIMENSIONS[sourceNode.type] || { width: 100, height: 80 };
		const targetDims = targetNode.dimensions ||
			BPMN_DEFAULT_DIMENSIONS[targetNode.type] || { width: 100, height: 80 };

		const sourceBottom = sourceNode.position.y + (sourceDims.height ?? 80);
		const targetTop = targetNode.position.y;

		return allNodes.filter((node) => {
			if (node.id === sourceNode.id || node.id === targetNode.id || !node.position) {
				return false;
			}

			// Check if in same column (within tolerance of ±50px)
			const xDiff = Math.abs(node.position.x - (sourceNode.position?.x ?? 0));
			if (xDiff > 50) {
				return false;
			}

			// Check if vertically between source and target
			const nodeDims = node.dimensions ||
				BPMN_DEFAULT_DIMENSIONS[node.type] || { width: 100, height: 80 };
			const nodeTop = node.position.y;
			const nodeBottom = node.position.y + (nodeDims.height ?? 80);

			return nodeTop > sourceBottom && nodeBottom < targetTop;
		});
	}

	/**
	 * Generate waypoints for a connection
	 */
	private generateWaypoints(sourceNode?: BPMNNode, targetNode?: BPMNNode, allNodes?: BPMNNode[]) {
		const waypoints: any[] = [];

		const sourcePos = sourceNode?.position || { x: 100, y: 100 };
		const targetPos = targetNode?.position || { x: 300, y: 100 };

		const sourceDims = sourceNode?.dimensions ||
			BPMN_DEFAULT_DIMENSIONS[sourceNode?.type || 'task'] || { width: 100, height: 80 };
		const targetDims = targetNode?.dimensions ||
			BPMN_DEFAULT_DIMENSIONS[targetNode?.type || 'task'] || { width: 100, height: 80 };

		// Calculate connection points
		const sourceCenterX = sourcePos.x + (sourceDims.width ?? 100) / 2;
		const sourceCenterY = sourcePos.y + (sourceDims.height ?? 80) / 2;
		const sourceBottom = sourcePos.y + (sourceDims.height ?? 80);
		const sourceRight = sourcePos.x + (sourceDims.width ?? 100);

		const targetCenterX = targetPos.x + (targetDims.width ?? 100) / 2;
		const targetCenterY = targetPos.y + (targetDims.height ?? 80) / 2;
		const targetTop = targetPos.y;
		const targetLeft = targetPos.x;

		// Check if this is a vertical connection (same column, within ±50px tolerance)
		const xDiff = Math.abs(sourcePos.x - targetPos.x);
		const isVertical = xDiff < 50;

		if (isVertical && sourceNode && targetNode && allNodes) {
			// CASE 1 & 2: Vertical connection (same column)
			const obstacles = this.findElementsBetween(sourceNode, targetNode, allNodes);

			if (obstacles.length === 0) {
				// CASE 1: Direct vertical connection - simple straight line
				waypoints.push(
					this.moddle.create('dc:Point', {
						x: sourceCenterX,
						y: sourceBottom
					})
				);

				waypoints.push(
					this.moddle.create('dc:Point', {
						x: targetCenterX,
						y: targetTop
					})
				);
			} else {
				// CASE 2: Vertical connection with obstacles - route around
				const offset = 60; // Horizontal offset to route around

				waypoints.push(
					this.moddle.create('dc:Point', {
						x: sourceCenterX,
						y: sourceBottom
					})
				);

				waypoints.push(
					this.moddle.create('dc:Point', {
						x: sourceCenterX,
						y: sourceBottom + 20
					})
				);

				waypoints.push(
					this.moddle.create('dc:Point', {
						x: sourceRight + offset,
						y: sourceBottom + 20
					})
				);

				waypoints.push(
					this.moddle.create('dc:Point', {
						x: sourceRight + offset,
						y: targetTop - 20
					})
				);

				waypoints.push(
					this.moddle.create('dc:Point', {
						x: targetCenterX,
						y: targetTop - 20
					})
				);

				waypoints.push(
					this.moddle.create('dc:Point', {
						x: targetCenterX,
						y: targetTop
					})
				);
			}
		} else {
			// CASE 3: Horizontal or diagonal connection
			const midX = (sourceRight + targetLeft) / 2;

			waypoints.push(
				this.moddle.create('dc:Point', {
					x: sourceRight,
					y: sourceCenterY
				})
			);

			waypoints.push(
				this.moddle.create('dc:Point', {
					x: midX,
					y: sourceCenterY
				})
			);

			waypoints.push(
				this.moddle.create('dc:Point', {
					x: midX,
					y: targetCenterY
				})
			);

			waypoints.push(
				this.moddle.create('dc:Point', {
					x: targetLeft,
					y: targetCenterY
				})
			);
		}

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
	 * Create BPMN shape for an annotation
	 */
	private createAnnotationShape(annotation: any) {
		const position = annotation.position || this.generatePosition();
		const dimensions = annotation.dimensions || { width: 160, height: 80 };

		const bounds = this.moddle.create('dc:Bounds', {
			x: position.x,
			y: position.y,
			width: dimensions.width,
			height: dimensions.height
		});

		return this.moddle.create('bpmndi:BPMNShape', {
			id: `${annotation.id}_di`,
			bpmnElement: this.moddle.create('bpmn:TextAnnotation', { id: annotation.id }),
			bounds
		});
	}

	/**
	 * Create BPMN edge for an association
	 */
	private createAssociationEdge(association: any, nodes: any[], annotations: any[]) {
		const sourceNode = nodes.find((n) => n.id === association.sourceRef);
		const targetAnnotation = annotations.find((a) => a.id === association.targetRef);

		const waypoints: any[] = [];

		if (sourceNode && targetAnnotation) {
			const sourcePos = sourceNode.position || { x: 100, y: 100 };
			const targetPos = targetAnnotation.position || { x: 300, y: 100 };

			const sourceDims = sourceNode.dimensions ||
				BPMN_DEFAULT_DIMENSIONS[sourceNode.type] || { width: 100, height: 80 };
			const targetDims = targetAnnotation.dimensions || { width: 160, height: 80 };

			// From source right edge, vertically centered
			const sourceX = sourcePos.x + (sourceDims.width ?? 100);
			const sourceY = sourcePos.y + (sourceDims.height ?? 80) / 2;

			// To target left edge, vertically centered
			const targetX = targetPos.x;
			const targetY = targetPos.y + (targetDims.height ?? 80) / 2;

			waypoints.push(
				this.moddle.create('dc:Point', { x: sourceX, y: sourceY })
			);

			waypoints.push(
				this.moddle.create('dc:Point', { x: targetX, y: targetY })
			);
		}

		return this.moddle.create('bpmndi:BPMNEdge', {
			id: `${association.id}_di`,
			bpmnElement: this.moddle.create('bpmn:Association', { id: association.id }),
			waypoint: waypoints
		});
	}

	/**
	 * Auto-layout nodes in a top-to-bottom flow, grouped by responsable (vertical swimlanes/columns)
	 * Respects the order of nodes in the table - nodes appearing earlier are positioned higher
	 * ALL nodes share the same vertical space based on their table row index
	 */
	autoLayout(flowDefinition: BPMNFlowDefinition): BPMNFlowDefinition {
		const layouted = { ...flowDefinition };
		const defaultResponsable = 'Sin asignar';
		const verticalSpacing = 150; // Spacing between nodes vertically
		const swimlaneWidth = 300; // Width of each swimlane/column
		const startX = 100;
		const startY = 100;

		// Use allResponsables if provided (includes secondary responsables), otherwise fall back to node responsables
		let allResponsables: string[];
		if (layouted.allResponsables && layouted.allResponsables.length > 0) {
			allResponsables = layouted.allResponsables;
		} else {
			// Fallback: extract from nodes only (old behavior)
			const responsableSet = new Set<string>();
			layouted.nodes.forEach((node) => {
				const responsable =
					node.responsable && node.responsable.trim() !== '' ? node.responsable : defaultResponsable;
				responsableSet.add(responsable);
			});
			allResponsables = Array.from(responsableSet);
		}

		// Calculate X positions for ALL responsables (including secondary ones)
		const responsableXPositions = new Map<string, number>();
		let currentXBase = startX;

		allResponsables.forEach((responsable) => {
			// Center the activity horizontally in the column
			const xPos = currentXBase + swimlaneWidth / 2;
			responsableXPositions.set(responsable, xPos);
			currentXBase += swimlaneWidth;
		});

		// Position ALL nodes based on their GLOBAL table index
		// This creates a shared vertical space across all columns
		layouted.nodes.forEach((node) => {
			const responsable =
				node.responsable && node.responsable.trim() !== '' ? node.responsable : defaultResponsable;

			// Get X position from responsable column
			const x = responsableXPositions.get(responsable) || startX + swimlaneWidth / 2;

			// Get Y position from GLOBAL table index (not per-column index)
			const tableIndex = layouted.nodes.indexOf(node);
			const y = startY + tableIndex * verticalSpacing;

			node.position = { x, y };
		});

		// Position annotations to the right of their associated nodes within the swimlane
		// This keeps them close while avoiding interference with flows and secondary responsable lines
		if (layouted.annotations && layouted.associations) {
			layouted.annotations.forEach((annotation) => {
				// Find the association that targets this annotation
				const association = layouted.associations!.find((a) => a.targetRef === annotation.id);
				if (association) {
					// Find the source node
					const sourceNode = layouted.nodes.find((n) => n.id === association.sourceRef);
					if (sourceNode && sourceNode.position) {
						const sourceDims = sourceNode.dimensions ||
							BPMN_DEFAULT_DIMENSIONS[sourceNode.type] || { width: 100, height: 80 };

						const annotationWidth = 160;
						const annotationHeight = 80;

						// Position to the right of the node with generous margin
						// This avoids interference with secondary responsable lines (which are horizontal at node center)
						const horizontalMargin = 50; // Space between node and annotation
						const verticalOffset = 30; // Distance below the node center

						// Position annotation to the right and below the node
						annotation.position = {
							x: sourceNode.position.x + (sourceDims.width ?? 100) + horizontalMargin,
							y: sourceNode.position.y + (sourceDims.height ?? 80) / 2 + verticalOffset
						};
						annotation.dimensions = { width: annotationWidth, height: annotationHeight };
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
