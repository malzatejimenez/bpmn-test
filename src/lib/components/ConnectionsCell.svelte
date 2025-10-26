<script lang="ts">
	import type { TableConnection } from '$lib/types/flow-table.types';

	interface Props {
		connections: TableConnection[];
		availableNodeIds: Array<{ id: string; label: string }>;
		currentNodeId: string;
		onChange: (connections: TableConnection[]) => void;
	}

	let { connections, availableNodeIds, currentNodeId, onChange }: Props = $props();

	let isEditing = $state(false);
	let editingConnections = $state<TableConnection[]>([]);

	// Filter out current node from available targets
	let filteredNodeIds = $derived(availableNodeIds.filter((n) => n.id !== currentNodeId));

	// Add new connection
	function addConnection() {
		const newConn: TableConnection = {
			targetId: '',
			label: '',
			condition: ''
		};
		editingConnections = [...editingConnections, newConn];
	}

	// Remove connection
	function removeConnection(index: number) {
		editingConnections = editingConnections.filter((_, i) => i !== index);
	}

	// Update connection field
	function updateConnection(index: number, field: keyof TableConnection, value: string) {
		editingConnections = editingConnections.map((conn, i) =>
			i === index ? { ...conn, [field]: value } : conn
		);
	}

	// Start editing
	function startEdit() {
		editingConnections = JSON.parse(JSON.stringify(connections));
		isEditing = true;
	}

	// Cancel editing
	function cancel() {
		isEditing = false;
		editingConnections = [];
	}

	// Save changes
	function save() {
		// Filter out connections with no target
		const validConnections = editingConnections.filter((c) => c.targetId.trim() !== '');
		onChange(validConnections);
		isEditing = false;
		editingConnections = [];
	}

	// Quick add connection (for simple cases)
	function quickAddConnection(targetId: string) {
		const newConn: TableConnection = { targetId, label: '', condition: '' };
		onChange([...connections, newConn]);
	}
</script>

<div class="connections-cell">
	{#if !isEditing}
		<!-- Display mode -->
		<div class="connections-display">
			{#if connections.length === 0}
				<span class="no-connections">—</span>
			{:else}
				<div class="connection-tags">
					{#each connections as conn}
						<span class="connection-tag" title={conn.label || 'Sin etiqueta'}>
							→ {conn.targetId}
							{#if conn.label}
								<span class="tag-label">({conn.label})</span>
							{/if}
						</span>
					{/each}
				</div>
			{/if}

			<button onclick={startEdit} class="btn-edit" title="Editar conexiones">✏️</button>
		</div>
	{:else}
		<!-- Edit mode -->
		<div class="connections-editor">
			<div class="editor-header">
				<span class="editor-title">Conexiones</span>
				<button onclick={addConnection} class="btn-add-small">+ Agregar</button>
			</div>

			<div class="connections-list">
				{#each editingConnections as conn, index}
					<div class="connection-row">
						<select
							bind:value={conn.targetId}
							onchange={(e) => updateConnection(index, 'targetId', e.currentTarget.value)}
							class="connection-select"
						>
							<option value="">-- Seleccionar --</option>
							{#each filteredNodeIds as node}
								<option value={node.id}>{node.id} - {node.label || 'Sin nombre'}</option>
							{/each}
						</select>

						<input
							type="text"
							bind:value={conn.label}
							oninput={(e) => updateConnection(index, 'label', e.currentTarget.value)}
							placeholder="Etiqueta (opcional)"
							class="connection-input"
						/>

						<button onclick={() => removeConnection(index)} class="btn-remove-small" title="Eliminar">
							×
						</button>
					</div>
				{/each}

				{#if editingConnections.length === 0}
					<p class="no-connections-editing">Sin conexiones. Click en "+ Agregar" para crear una.</p>
				{/if}
			</div>

			<div class="editor-actions">
				<button onclick={cancel} class="btn-cancel">Cancelar</button>
				<button onclick={save} class="btn-save">Guardar</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.connections-cell {
		position: relative;
		min-height: 36px;
	}

	/* Display mode */
	.connections-display {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.no-connections {
		color: #cbd5e1;
		font-style: italic;
	}

	.connection-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		flex: 1;
	}

	.connection-tag {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.5rem;
		background: #dbeafe;
		color: #1e40af;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
	}

	.tag-label {
		margin-left: 0.25rem;
		color: #3b82f6;
		font-weight: 400;
	}

	.btn-edit {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.875rem;
		padding: 0.25rem;
		opacity: 0.5;
		transition: opacity 0.2s;
		flex-shrink: 0;
	}

	.btn-edit:hover {
		opacity: 1;
	}

	/* Edit mode */
	.connections-editor {
		position: absolute;
		top: -8px;
		left: -8px;
		right: -8px;
		background: white;
		border: 2px solid #3b82f6;
		border-radius: 0.375rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		z-index: 100;
		padding: 0.75rem;
		min-width: 400px;
	}

	.editor-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.editor-title {
		font-weight: 600;
		color: #1e293b;
		font-size: 0.875rem;
	}

	.btn-add-small {
		padding: 0.25rem 0.5rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		cursor: pointer;
		font-weight: 500;
	}

	.btn-add-small:hover {
		background: #2563eb;
	}

	.connections-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		max-height: 200px;
		overflow-y: auto;
	}

	.connection-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.connection-select {
		flex: 2;
		padding: 0.375rem 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.25rem;
		font-size: 0.75rem;
	}

	.connection-select:focus {
		outline: none;
		border-color: #3b82f6;
	}

	.connection-input {
		flex: 1;
		padding: 0.375rem 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.25rem;
		font-size: 0.75rem;
	}

	.connection-input:focus {
		outline: none;
		border-color: #3b82f6;
	}

	.connection-input::placeholder {
		color: #cbd5e1;
		font-style: italic;
	}

	.btn-remove-small {
		background: #ef4444;
		color: white;
		border: none;
		border-radius: 0.25rem;
		width: 24px;
		height: 24px;
		cursor: pointer;
		font-size: 1.125rem;
		line-height: 1;
		flex-shrink: 0;
	}

	.btn-remove-small:hover {
		background: #dc2626;
	}

	.no-connections-editing {
		color: #94a3b8;
		font-size: 0.75rem;
		text-align: center;
		padding: 1rem;
		margin: 0;
	}

	.editor-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid #e2e8f0;
	}

	.btn-cancel,
	.btn-save {
		padding: 0.375rem 0.75rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
	}

	.btn-cancel {
		background: #f1f5f9;
		color: #475569;
	}

	.btn-cancel:hover {
		background: #e2e8f0;
	}

	.btn-save {
		background: #3b82f6;
		color: white;
	}

	.btn-save:hover {
		background: #2563eb;
	}
</style>
