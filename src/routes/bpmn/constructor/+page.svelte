<script lang="ts">
	import { onMount } from 'svelte';
	import BpmnModeler from '$lib/components/BpmnModeler.svelte';
	import FlowTable from '$lib/components/FlowTable.svelte';
	import type { TableRow } from '$lib/types/flow-table.types';
	import type { BPMNFlowDefinition } from '$lib/types/bpmn.types';
	import { bpmnBuilder } from '$lib/services/bpmn-builder';
	import '$lib/styles/bpmn.css';

	// State
	let rows = $state<TableRow[]>([
		{
			rowNumber: 1,
			id: 'start',
			type: 'startEvent',
			label: 'Inicio',
			connectsTo: []
		}
	]);

	let flujoActual = $state<BPMNFlowDefinition | null>(null);
	let currentXml = $state<string | null>(null);
	let modoEdicion = $state(false);

	// Convert table rows to BPMN flow definition
	function rowsToFlowDefinition(tableRows: TableRow[]): BPMNFlowDefinition {
		// Create nodes with auto-layout positions
		const nodes = tableRows.map((row, index) => ({
			id: row.id,
			type: row.type,
			label: row.label
		}));

		// Create connections from all rows
		const connections = tableRows.flatMap((row) =>
			row.connectsTo.map((conn, connIndex) => ({
				id: `flow_${row.id}_${conn.targetId}_${connIndex}`,
				from: row.id,
				to: conn.targetId,
				label: conn.label,
				condition: conn.condition
			}))
		);

		const flowDef: BPMNFlowDefinition = {
			id: 'Process_Constructor',
			name: 'Flujo desde Constructor',
			nodes,
			connections
		};

		// Apply auto-layout to generate positions
		return bpmnBuilder.autoLayout(flowDef);
	}

	// Update diagram when rows change
	async function updateDiagram() {
		if (rows.length === 0) {
			flujoActual = null;
			currentXml = null;
			return;
		}

		try {
			const flowDef = rowsToFlowDefinition(rows);
			flujoActual = flowDef;
			// Reset XML to force re-render
			currentXml = null;
		} catch (err) {
			console.error('Error updating diagram:', err);
		}
	}

	// Handle table changes
	function handleTableChange(newRows: TableRow[]) {
		rows = newRows;
		updateDiagram();
	}

	// Handle diagram changes from visual editor
	function handleDiagramChange(xml: string) {
		currentXml = xml;
	}

	// Initialize
	onMount(() => {
		updateDiagram();
	});
</script>

<div class="constructor-container">
	<header class="page-header">
		<h1>🏗️ Constructor de Flujos BPMN</h1>
		<p class="subtitle">Crea flujos BPMN usando una tabla simple - sin código</p>
	</header>

	<div class="content-layout">
		<!-- Left panel: Table editor -->
		<div class="editor-panel">
			<div class="panel-header">
				<h2>📝 Actividades y Flujo</h2>
			</div>

			<FlowTable {rows} onChange={handleTableChange} />
		</div>

		<!-- Right panel: Visual preview -->
		<div class="preview-panel">
			<div class="panel-header">
				<h2>{modoEdicion ? '✏️ Editor Visual' : '👁️ Vista Previa'}</h2>
				<div class="header-actions">
					<label class="mode-toggle">
						<input type="checkbox" bind:checked={modoEdicion} />
						<span class="toggle-label">{modoEdicion ? '🔓 Edición' : '🔒 Solo lectura'}</span>
					</label>
				</div>
			</div>

			<div class="diagram-container">
				{#if flujoActual || currentXml}
					<BpmnModeler
						flowDefinition={currentXml ? undefined : flujoActual}
						xml={currentXml}
						editable={modoEdicion}
						onChange={handleDiagramChange}
						class="diagram-viewer"
					/>
				{:else}
					<div class="empty-state">
						<p>⚠️ Agrega actividades en la tabla para ver el diagrama</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.constructor-container {
		min-height: 100vh;
		background: linear-gradient(to bottom, #f8fafc, #e2e8f0);
		padding: 2rem;
	}

	.page-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.page-header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		color: #1e293b;
		margin: 0;
	}

	.subtitle {
		margin-top: 0.5rem;
		color: #64748b;
		font-size: 1.1rem;
	}

	.content-layout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		height: calc(100vh - 200px);
	}

	.editor-panel,
	.preview-panel {
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #e2e8f0;
		background: #f8fafc;
		flex-shrink: 0;
	}

	.panel-header h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1e293b;
		margin: 0;
	}

	.header-actions {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.mode-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		user-select: none;
	}

	.toggle-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #64748b;
		transition: color 0.2s;
	}

	.mode-toggle input:checked + .toggle-label {
		color: #3b82f6;
	}

	.diagram-container {
		flex: 1;
		min-height: 0;
		background: #fafafa;
	}

	:global(.diagram-viewer) {
		height: 100% !important;
		border: none !important;
		border-radius: 0 !important;
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #94a3b8;
		font-size: 1.125rem;
	}
</style>
