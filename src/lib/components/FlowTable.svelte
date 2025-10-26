<script lang="ts">
	import type { TableRow } from '$lib/types/flow-table.types';
	import { NODE_TYPE_ICONS } from '$lib/types/flow-table.types';
	import NodeTypeSelect from './NodeTypeSelect.svelte';
	import ConnectionsCell from './ConnectionsCell.svelte';
	import ResponsableAutocomplete from './ResponsableAutocomplete.svelte';

	interface Props {
		rows: TableRow[];
		onChange: (rows: TableRow[]) => void;
	}

	let { rows, onChange }: Props = $props();

	let nextRowNumber = $derived(rows.length > 0 ? Math.max(...rows.map((r) => r.rowNumber)) + 1 : 1);

	// Add new row
	function addRow() {
		const newRow: TableRow = {
			rowNumber: nextRowNumber,
			id: generateId('node', nextRowNumber),
			type: 'task',
			label: '',
			responsable: '',
			connectsTo: []
		};

		onChange([...rows, newRow]);
	}

	// Delete row
	function deleteRow(rowNumber: number) {
		const filtered = rows.filter((r) => r.rowNumber !== rowNumber);
		onChange(filtered);
	}

	// Update row field
	function updateRow(rowNumber: number, field: keyof TableRow, value: any) {
		const updated = rows.map((r) => (r.rowNumber === rowNumber ? { ...r, [field]: value } : r));
		onChange(updated);
	}

	// Generate auto ID
	function generateId(prefix: string, number: number): string {
		return `${prefix}_${number}`;
	}

	// Get all available node IDs for connection dropdowns
	let availableNodeIds = $derived(rows.map((r) => ({ id: r.id, label: r.label })));

	// Get unique responsables for autocomplete
	let availableResponsables = $derived(
		Array.from(new Set(rows.map((r) => r.responsable).filter((r): r is string => !!r && r.trim() !== '')))
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
	</div>

	<div class="table-wrapper">
		<table class="flow-table">
			<thead>
				<tr>
					<th class="col-number">#</th>
					<th class="col-id">ID</th>
					<th class="col-type">Tipo</th>
					<th class="col-label">Nombre</th>
					<th class="col-responsable">Responsable</th>
					<th class="col-connections">Conecta a</th>
					<th class="col-actions">Acciones</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as row (row.rowNumber)}
					<tr>
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

						<!-- Responsable -->
						<td class="col-responsable">
							<ResponsableAutocomplete
								value={row.responsable || ''}
								{availableResponsables}
								onChange={(newValue) => updateRow(row.rowNumber, 'responsable', newValue)}
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
							<button
								onclick={() => deleteRow(row.rowNumber)}
								class="btn-delete"
								title="Eliminar actividad"
							>
								🗑️
							</button>
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

	.col-connections {
		min-width: 200px;
	}

	.col-actions {
		width: 80px;
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
	.btn-delete {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1.125rem;
		padding: 0.25rem;
		opacity: 0.6;
		transition: opacity 0.2s, transform 0.1s;
	}

	.btn-delete:hover {
		opacity: 1;
		transform: scale(1.1);
	}

	/* Empty state */
	.empty-table {
		text-align: center;
		padding: 3rem;
		color: #94a3b8;
	}
</style>
