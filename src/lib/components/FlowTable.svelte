<script lang="ts">
	import type { TableRow } from '$lib/types/flow-table.types';
	import { NODE_TYPE_ICONS } from '$lib/types/flow-table.types';
	import NodeTypeSelect from './NodeTypeSelect.svelte';
	import ConnectionsCell from './ConnectionsCell.svelte';
	import MultiValueCell from './MultiValueCell.svelte';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	interface Props {
		rows: TableRow[];
		onChange: (rows: TableRow[]) => void;
	}

	let { rows, onChange }: Props = $props();
	let lastMovedRowId = $state<string | null>(null);
	let showAutoSortDialog = $state(false);

	let nextRowNumber = $derived(rows.length > 0 ? Math.max(...rows.map((r) => r.rowNumber)) + 1 : 1);

	// Add new row
	function addRow() {
		const newRow: TableRow = {
			rowNumber: nextRowNumber,
			id: generateId('node', nextRowNumber),
			type: 'task',
			label: '',
			responsables: [],
			suppliers: [],
			inputs: [],
			outputs: [],
			connectsTo: []
		};

		onChange([...rows, newRow]);
	}

	// Delete row
	function deleteRow(rowNumber: number) {
		const filtered = rows.filter((r) => r.rowNumber !== rowNumber);
		onChange(filtered);
	}

	// Move row up
	function moveRowUp(rowNumber: number) {
		const index = rows.findIndex((r) => r.rowNumber === rowNumber);
		if (index <= 0) return; // Already at top

		const newRows = [...rows];
		// Store the ID of the row that moved
		const movedRow = newRows[index];

		// Swap with previous row
		[newRows[index - 1], newRows[index]] = [newRows[index], newRows[index - 1]];

		// Renumber all rows
		newRows.forEach((row, i) => {
			row.rowNumber = i + 1;
		});

		// Highlight moved row
		lastMovedRowId = movedRow.id;
		setTimeout(() => {
			lastMovedRowId = null;
		}, 600);

		onChange(newRows);
	}

	// Move row down
	function moveRowDown(rowNumber: number) {
		const index = rows.findIndex((r) => r.rowNumber === rowNumber);
		if (index === -1 || index >= rows.length - 1) return; // Already at bottom

		const newRows = [...rows];
		// Store the ID of the row that moved
		const movedRow = newRows[index];

		// Swap with next row
		[newRows[index], newRows[index + 1]] = [newRows[index + 1], newRows[index]];

		// Renumber all rows
		newRows.forEach((row, i) => {
			row.rowNumber = i + 1;
		});

		// Highlight moved row
		lastMovedRowId = movedRow.id;
		setTimeout(() => {
			lastMovedRowId = null;
		}, 600);

		onChange(newRows);
	}

	// Update row field
	function updateRow(rowNumber: number, field: keyof TableRow, value: any) {
		const updated = rows.map((r) => (r.rowNumber === rowNumber ? { ...r, [field]: value } : r));
		onChange(updated);
	}

	// Auto-sort rows by logical flow (follows connections)
	function autoSortByLogic() {
		if (rows.length === 0) return;

		// Build dependency maps
		const incomingEdges = new Map<string, string[]>();
		const outgoingEdges = new Map<string, string[]>();

		rows.forEach((row) => {
			outgoingEdges.set(row.id, row.connectsTo.map((c) => c.targetId));

			row.connectsTo.forEach((conn) => {
				if (!incomingEdges.has(conn.targetId)) {
					incomingEdges.set(conn.targetId, []);
				}
				incomingEdges.get(conn.targetId)!.push(row.id);
			});
		});

		// Find root nodes (StartEvents or nodes without incoming edges)
		const roots = rows.filter((row) => {
			const hasIncoming = incomingEdges.get(row.id)?.length > 0;
			return !hasIncoming || row.type === 'startEvent';
		});

		// If no roots found, use first row as root
		if (roots.length === 0 && rows.length > 0) {
			roots.push(rows[0]);
		}

		// BFS to sort topologically
		const sorted: string[] = [];
		const visited = new Set<string>();
		const queue = roots.map((r) => r.id);

		while (queue.length > 0) {
			const nodeId = queue.shift()!;
			if (visited.has(nodeId)) continue;

			visited.add(nodeId);
			sorted.push(nodeId);

			// Add child nodes to queue
			const targets = outgoingEdges.get(nodeId) || [];
			targets.forEach((targetId) => {
				if (!visited.has(targetId)) {
					queue.push(targetId);
				}
			});
		}

		// Add orphan nodes (not connected) at the end
		rows.forEach((row) => {
			if (!visited.has(row.id)) {
				sorted.push(row.id);
			}
		});

		// Reorder rows based on sorted order
		const newRows = sorted
			.map((id) => rows.find((r) => r.id === id))
			.filter((r): r is TableRow => r !== undefined)
			.map((row, index) => ({
				...row,
				rowNumber: index + 1
			}));

		onChange(newRows);
	}

	// Generate auto ID
	function generateId(prefix: string, number: number): string {
		return `${prefix}_${number}`;
	}

	// Get all available node IDs for connection dropdowns
	let availableNodeIds = $derived(rows.map((r) => ({ id: r.id, label: r.label })));

	// Get unique responsables (flatten all responsables arrays)
	let availableResponsables = $derived(
		Array.from(
			new Set(
				rows
					.flatMap((r) => r.responsables)
					.filter((r): r is string => !!r && r.trim() !== '')
			)
		)
	);

	// Validate unique IDs
	function isDuplicateId(id: string, rowNumber: number): boolean {
		return rows.filter((r) => r.id === id && r.rowNumber !== rowNumber).length > 0;
	}

	// Validate if ID is empty
	function isEmptyId(id: string): boolean {
		return id.trim() === '';
	}
</script>

<div class="flow-table-container">
	<div class="table-actions">
		<button onclick={addRow} class="btn-add">+ Agregar Actividad</button>
		<button onclick={() => (showAutoSortDialog = true)} class="btn-auto-sort" title="Ordenar automáticamente por flujo lógico">
			🔄 Ordenar por flujo
		</button>
	</div>

	<div class="table-wrapper">
		<table class="flow-table">
			<thead>
				<tr>
					<th class="col-number">#</th>
					<th class="col-id">ID</th>
					<th class="col-type">Tipo</th>
					<th class="col-label">Nombre</th>
					<th class="col-responsable">Responsables</th>
					<th class="col-supplier">Proveedores</th>
					<th class="col-input">Inputs</th>
					<th class="col-output">Outputs</th>
					<th class="col-connections">Conecta a</th>
					<th class="col-actions">Acciones</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as row (row.id)}
					<tr
						animate:flip={{ duration: 300, easing: cubicOut }}
						transition:fade={{ duration: 150 }}
						class:row-moved={row.id === lastMovedRowId}
					>
						<!-- Row Number -->
						<td class="col-number">{row.rowNumber}</td>

						<!-- ID -->
						<td class="col-id">
							<input
								type="text"
								value={row.id}
								oninput={(e) => updateRow(row.rowNumber, 'id', e.currentTarget.value)}
								placeholder="id_nodo"
								class="input-cell"
								class:error={isDuplicateId(row.id, row.rowNumber) || isEmptyId(row.id)}
								title={isDuplicateId(row.id, row.rowNumber)
									? 'ID duplicado'
									: isEmptyId(row.id)
										? 'ID requerido'
										: ''}
							/>
						</td>

						<!-- Type -->
						<td class="col-type">
							<NodeTypeSelect
								value={row.type}
								onChange={(newType) => updateRow(row.rowNumber, 'type', newType)}
							/>
						</td>

						<!-- Label -->
						<td class="col-label">
							<input
								type="text"
								value={row.label}
								oninput={(e) => updateRow(row.rowNumber, 'label', e.currentTarget.value)}
								placeholder="Nombre de la actividad"
								class="input-cell"
							/>
						</td>

						<!-- Responsables -->
						<td class="col-responsable">
							<MultiValueCell
								values={row.responsables}
								placeholder="Responsable"
								onChange={(newValues) => updateRow(row.rowNumber, 'responsables', newValues)}
							/>
						</td>

						<!-- Suppliers -->
						<td class="col-supplier">
							<MultiValueCell
								values={row.suppliers}
								placeholder="Proveedor"
								onChange={(newValues) => updateRow(row.rowNumber, 'suppliers', newValues)}
							/>
						</td>

						<!-- Inputs -->
						<td class="col-input">
							<MultiValueCell
								values={row.inputs}
								placeholder="Input"
								onChange={(newValues) => updateRow(row.rowNumber, 'inputs', newValues)}
							/>
						</td>

						<!-- Outputs -->
						<td class="col-output">
							<MultiValueCell
								values={row.outputs}
								placeholder="Output"
								onChange={(newValues) => updateRow(row.rowNumber, 'outputs', newValues)}
							/>
						</td>

						<!-- Connections -->
						<td class="col-connections">
							<ConnectionsCell
								connections={row.connectsTo}
								{availableNodeIds}
								currentNodeId={row.id}
								onChange={(newConnections) =>
									updateRow(row.rowNumber, 'connectsTo', newConnections)}
							/>
						</td>

						<!-- Actions -->
						<td class="col-actions">
							<div class="action-buttons">
								<button
									onclick={() => moveRowUp(row.rowNumber)}
									class="btn-reorder"
									disabled={row.rowNumber === 1}
									title="Mover arriba"
								>
									▲
								</button>
								<button
									onclick={() => moveRowDown(row.rowNumber)}
									class="btn-reorder"
									disabled={row.rowNumber === rows.length}
									title="Mover abajo"
								>
									▼
								</button>
								<button
									onclick={() => deleteRow(row.rowNumber)}
									class="btn-delete"
									title="Eliminar actividad"
								>
									🗑️
								</button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		{#if rows.length === 0}
			<div class="empty-table">
				<p>No hay actividades. Haz click en "+ Agregar Actividad" para empezar.</p>
			</div>
		{/if}
	</div>

	<!-- Auto-Sort Confirmation Dialog -->
	{#if showAutoSortDialog}
		<div class="dialog-overlay" onclick={() => (showAutoSortDialog = false)}>
			<div class="dialog" onclick={(e) => e.stopPropagation()}>
				<h3>🔄 Ordenar por flujo lógico</h3>
				<p>
					¿Deseas reordenar automáticamente todas las actividades siguiendo la secuencia de conexiones del proceso?
				</p>
				<p class="dialog-note">
					⚠️ Esta acción reorganizará todas las filas según el flujo lógico (StartEvent → actividades → EndEvent).
				</p>
				<div class="dialog-actions">
					<button class="btn-cancel" onclick={() => (showAutoSortDialog = false)}>
						Cancelar
					</button>
					<button
						class="btn-confirm"
						onclick={() => {
							autoSortByLogic();
							showAutoSortDialog = false;
						}}
					>
						Ordenar
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.flow-table-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}

	.table-actions {
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #e2e8f0;
		background: #fafafa;
	}

	.btn-add {
		padding: 0.5rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
		font-size: 0.875rem;
	}

	.btn-add:hover {
		background: #2563eb;
	}

	.btn-auto-sort {
		padding: 0.5rem 1rem;
		background: #10b981;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
		font-size: 0.875rem;
	}

	.btn-auto-sort:hover {
		background: #059669;
	}

	.table-wrapper {
		flex: 1;
		overflow: auto;
		padding: 1rem;
	}

	.flow-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.flow-table thead {
		position: sticky;
		top: 0;
		background: #f8fafc;
		z-index: 10;
	}

	.flow-table th {
		text-align: left;
		padding: 0.75rem 0.5rem;
		font-weight: 600;
		color: #475569;
		border-bottom: 2px solid #e2e8f0;
		white-space: nowrap;
	}

	.flow-table td {
		padding: 0.5rem 0.5rem;
		border-bottom: 1px solid #e2e8f0;
		vertical-align: middle;
	}

	.flow-table tbody tr:hover {
		background: #f8fafc;
	}

	/* Column widths */
	.col-number {
		width: 50px;
		text-align: center;
		color: #94a3b8;
		font-weight: 500;
	}

	.col-id {
		width: 120px;
	}

	.col-type {
		width: 180px;
	}

	.col-label {
		min-width: 200px;
	}

	.col-responsable {
		min-width: 150px;
		width: 180px;
	}

	.col-supplier {
		min-width: 150px;
		width: 180px;
	}

	.col-input {
		min-width: 150px;
		width: 180px;
	}

	.col-output {
		min-width: 150px;
		width: 180px;
	}

	.col-connections {
		min-width: 200px;
	}

	.col-actions {
		width: 120px;
		text-align: center;
	}

	/* Input cells */
	.input-cell {
		width: 100%;
		padding: 0.375rem 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		transition: border-color 0.2s;
	}

	.input-cell:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 1px #3b82f6;
	}

	.input-cell::placeholder {
		color: #cbd5e1;
	}

	.input-cell.error {
		border-color: #ef4444;
		background-color: #fef2f2;
	}

	.input-cell.error:focus {
		border-color: #dc2626;
		box-shadow: 0 0 0 1px #dc2626;
	}

	/* Action buttons */
	.action-buttons {
		display: flex;
		gap: 0.25rem;
		justify-content: center;
		align-items: center;
	}

	.btn-reorder {
		background: none;
		border: 1px solid #cbd5e1;
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 0.75rem;
		padding: 0.25rem 0.375rem;
		color: #64748b;
		transition:
			all 0.2s;
		line-height: 1;
	}

	.btn-reorder:hover:not(:disabled) {
		background: #f1f5f9;
		color: #334155;
		border-color: #94a3b8;
	}

	.btn-reorder:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.btn-delete {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1.125rem;
		padding: 0.25rem;
		opacity: 0.6;
		transition:
			opacity 0.2s,
			transform 0.1s;
	}

	.btn-delete:hover {
		opacity: 1;
		transform: scale(1.1);
	}

	/* Row animations */
	@keyframes flash-highlight {
		0%,
		100% {
			background-color: transparent;
		}
		50% {
			background-color: #fef3c7;
		}
	}

	.row-moved {
		animation: flash-highlight 0.6s ease-out;
	}

	/* Empty state */
	.empty-table {
		text-align: center;
		padding: 3rem;
		color: #94a3b8;
	}

	/* Dialog styles */
	.dialog-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(2px);
	}

	.dialog {
		background: white;
		border-radius: 0.5rem;
		padding: 1.5rem;
		max-width: 500px;
		width: 90%;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.dialog h3 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		color: #1e293b;
	}

	.dialog p {
		margin: 0 0 1rem 0;
		color: #475569;
		line-height: 1.6;
	}

	.dialog-note {
		background: #fef3c7;
		border-left: 3px solid #f59e0b;
		padding: 0.75rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		color: #92400e;
	}

	.dialog-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		margin-top: 1.5rem;
	}

	.btn-cancel {
		padding: 0.5rem 1rem;
		background: #e2e8f0;
		color: #475569;
		border: none;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-cancel:hover {
		background: #cbd5e1;
	}

	.btn-confirm {
		padding: 0.5rem 1rem;
		background: #10b981;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-confirm:hover {
		background: #059669;
	}
</style>
