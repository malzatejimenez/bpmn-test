import type { TableRow } from '$lib/types/flow-table.types';

/**
 * Types of changes that can occur in the table
 */
export type ChangeType =
	| 'node_added'
	| 'node_removed'
	| 'node_updated'
	| 'connection_added'
	| 'connection_removed';

export interface Change {
	type: ChangeType;
	nodeId?: string;
	row?: TableRow;
	oldRow?: TableRow;
	connectionFrom?: string;
	connectionTo?: string;
}

/**
 * Service for applying incremental updates to BPMN diagrams
 * instead of regenerating the entire diagram from scratch
 */
export class BpmnIncrementalUpdater {
	/**
	 * Detect changes between old and new table rows
	 */
	detectChanges(oldRows: TableRow[], newRows: TableRow[]): Change[] {
		const changes: Change[] = [];

		// Create maps for quick lookup
		const oldRowsMap = new Map(oldRows.map((r) => [r.id, r]));
		const newRowsMap = new Map(newRows.map((r) => [r.id, r]));

		// Detect added and updated nodes
		for (const newRow of newRows) {
			const oldRow = oldRowsMap.get(newRow.id);

			if (!oldRow) {
				// Node was added
				changes.push({
					type: 'node_added',
					nodeId: newRow.id,
					row: newRow
				});
			} else {
				// Check if node properties changed
				if (this.hasNodeChanged(oldRow, newRow)) {
					changes.push({
						type: 'node_updated',
						nodeId: newRow.id,
						row: newRow,
						oldRow
					});
				}

				// Check for connection changes
				const connectionChanges = this.detectConnectionChanges(oldRow, newRow);
				changes.push(...connectionChanges);
			}
		}

		// Detect removed nodes
		for (const oldRow of oldRows) {
			if (!newRowsMap.has(oldRow.id)) {
				changes.push({
					type: 'node_removed',
					nodeId: oldRow.id,
					oldRow
				});
			}
		}

		return changes;
	}

	/**
	 * Check if a node's properties have changed
	 */
	private hasNodeChanged(oldRow: TableRow, newRow: TableRow): boolean {
		return (
			oldRow.label !== newRow.label ||
			oldRow.type !== newRow.type ||
			oldRow.responsable !== newRow.responsable
		);
	}

	/**
	 * Detect changes in connections between two row states
	 */
	private detectConnectionChanges(oldRow: TableRow, newRow: TableRow): Change[] {
		const changes: Change[] = [];

		const oldConnections = new Set(oldRow.connectsTo.map((c) => c.targetId));
		const newConnections = new Set(newRow.connectsTo.map((c) => c.targetId));

		// Detect added connections
		for (const conn of newRow.connectsTo) {
			if (!oldConnections.has(conn.targetId)) {
				changes.push({
					type: 'connection_added',
					connectionFrom: newRow.id,
					connectionTo: conn.targetId
				});
			}
		}

		// Detect removed connections
		for (const conn of oldRow.connectsTo) {
			if (!newConnections.has(conn.targetId)) {
				changes.push({
					type: 'connection_removed',
					connectionFrom: oldRow.id,
					connectionTo: conn.targetId
				});
			}
		}

		return changes;
	}

	/**
	 * Apply a single change to the BPMN modeler
	 */
	async applyChange(modeler: any, change: Change, allRows: TableRow[]): Promise<void> {
		switch (change.type) {
			case 'node_updated':
				await this.applyNodeUpdate(modeler, change, allRows);
				break;
			case 'connection_added':
				await this.applyConnectionAdd(modeler, change);
				break;
			case 'connection_removed':
				await this.applyConnectionRemove(modeler, change);
				break;
			case 'node_added':
				// For now, we'll need full regeneration for adding nodes
				// as positioning is complex (requires auto-layout)
				console.log('Node addition requires full regeneration');
				break;
			case 'node_removed':
				await this.applyNodeRemove(modeler, change);
				break;
		}
	}

	/**
	 * Update properties of an existing node
	 */
	private async applyNodeUpdate(
		modeler: any,
		change: Change,
		allRows: TableRow[]
	): Promise<void> {
		if (!change.row || !change.nodeId) return;

		const elementRegistry = modeler.get('elementRegistry');
		const modeling = modeler.get('modeling');

		const element = elementRegistry.get(change.nodeId);
		if (!element) {
			console.warn(`Element ${change.nodeId} not found in diagram`);
			return;
		}

		// Update element properties
		const updates: any = {};

		if (change.row.label !== change.oldRow?.label) {
			updates.name = change.row.label;
		}

		// Update responsable (stored as custom property)
		const responsableChanged = change.row.responsable !== change.oldRow?.responsable;
		if (responsableChanged) {
			updates.responsable = change.row.responsable;
		}

		if (Object.keys(updates).length > 0) {
			modeling.updateProperties(element, updates);
		}

		// If responsable changed, move element to new column
		if (responsableChanged) {
			const newX = this.calculateXForResponsable(change.row.responsable || '', allRows);
			const currentX = element.x;
			const deltaX = newX - currentX;

			if (Math.abs(deltaX) > 1) {
				// Only move if significant difference
				modeling.moveElements([element], { x: deltaX, y: 0 });
			}
		}

		// Note: Type changes would require replacing the element entirely
		// which is complex, so we'll skip that for now
	}

	/**
	 * Calculate X position for a given responsable based on swimlane layout
	 */
	private calculateXForResponsable(responsable: string, allRows: TableRow[]): number {
		const swimlaneWidth = 300;
		const startX = 100;
		const defaultResponsable = 'Sin asignar';

		// Get unique responsables in order
		const responsables = Array.from(
			new Set(
				allRows.map((r) => (r.responsable && r.responsable.trim() !== '' ? r.responsable : defaultResponsable))
			)
		);

		// Find index of this responsable
		const targetResponsable = responsable && responsable.trim() !== '' ? responsable : defaultResponsable;
		const index = responsables.indexOf(targetResponsable);

		if (index === -1) {
			// Responsable not found, use default column
			return startX + swimlaneWidth / 2;
		}

		// Calculate X position (center of column)
		return startX + swimlaneWidth / 2 + index * swimlaneWidth;
	}

	/**
	 * Add a new connection between two existing nodes
	 */
	private async applyConnectionAdd(modeler: any, change: Change): Promise<void> {
		if (!change.connectionFrom || !change.connectionTo) return;

		const elementRegistry = modeler.get('elementRegistry');
		const modeling = modeler.get('modeling');
		const bpmnFactory = modeler.get('bpmnFactory');

		const source = elementRegistry.get(change.connectionFrom);
		const target = elementRegistry.get(change.connectionTo);

		if (!source || !target) {
			console.warn(
				`Source or target not found for connection ${change.connectionFrom} -> ${change.connectionTo}`
			);
			return;
		}

		// Create sequence flow
		const sequenceFlow = modeling.connect(source, target, {
			type: 'bpmn:SequenceFlow'
		});

		console.log('Connection added:', sequenceFlow);
	}

	/**
	 * Remove a connection between two nodes
	 */
	private async applyConnectionRemove(modeler: any, change: Change): Promise<void> {
		if (!change.connectionFrom || !change.connectionTo) return;

		const elementRegistry = modeler.get('elementRegistry');
		const modeling = modeler.get('modeling');

		// Find the connection element
		const allElements = elementRegistry.getAll();
		const connection = allElements.find((el: any) => {
			return (
				el.type === 'bpmn:SequenceFlow' &&
				el.source?.id === change.connectionFrom &&
				el.target?.id === change.connectionTo
			);
		});

		if (connection) {
			modeling.removeConnection(connection);
			console.log('Connection removed:', connection.id);
		}
	}

	/**
	 * Remove a node from the diagram
	 */
	private async applyNodeRemove(modeler: any, change: Change): Promise<void> {
		if (!change.nodeId) return;

		const elementRegistry = modeler.get('elementRegistry');
		const modeling = modeler.get('modeling');

		const element = elementRegistry.get(change.nodeId);
		if (element) {
			modeling.removeElements([element]);
			console.log('Node removed:', change.nodeId);
		}
	}

	/**
	 * Apply all changes to the modeler
	 */
	async applyChanges(modeler: any, changes: Change[], allRows: TableRow[]): Promise<boolean> {
		// Check if any changes require full regeneration
		const requiresFullRegeneration = changes.some((c) => c.type === 'node_added');

		if (requiresFullRegeneration) {
			console.log('Changes require full diagram regeneration');
			return false;
		}

		// Apply all changes incrementally
		for (const change of changes) {
			await this.applyChange(modeler, change, allRows);
		}

		return true;
	}
}

/**
 * Singleton instance
 */
export const bpmnIncrementalUpdater = new BpmnIncrementalUpdater();
