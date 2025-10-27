<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import BpmnModeler from '$lib/components/BpmnModeler.svelte';
	import FlowTable from '$lib/components/FlowTable.svelte';
	import ViewSwitcher from '$lib/components/ViewSwitcher.svelte';
	import SwimlaneHeaders from '$lib/components/SwimlaneHeaders.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import type { TableRow } from '$lib/types/flow-table.types';
	import type { BPMNFlowDefinition } from '$lib/types/bpmn.types';
	import { bpmnBuilder } from '$lib/services/bpmn-builder';
	import { bpmnIncrementalUpdater } from '$lib/services/bpmn-incremental-updater';
	import '$lib/styles/bpmn.css';

	type ViewMode = 'table' | 'split' | 'diagram';

	// localStorage keys
	const STORAGE_KEYS = {
		ROWS: 'bpmn-constructor-rows',
		XML: 'bpmn-constructor-xml',
		VIEW_MODE: 'bpmn-view-mode',
		EDIT_MODE: 'bpmn-edit-mode'
	};

	// Default initial row
	const DEFAULT_ROWS: TableRow[] = [
		{
			rowNumber: 1,
			id: 'start',
			type: 'startEvent',
			label: 'Inicio',
			connectsTo: []
		}
	];

	// State
	let rows = $state<TableRow[]>(DEFAULT_ROWS);
	let previousRows = $state<TableRow[]>(DEFAULT_ROWS); // Track previous state for incremental updates
	let flujoActual = $state<BPMNFlowDefinition | null>(null);
	let currentXml = $state<string | null>(null);
	let modoEdicion = $state(false);
	let viewMode = $state<ViewMode>('split');
	let viewportX = $state(0);
	let diagramKey = $state(0); // Key to force diagram re-render
	let modelerInstance = $state<any>(null); // Reference to BpmnModeler instance
	let isApplyingIncrementalUpdate = $state(false); // Flag to prevent update loops

	// State for confirmation dialogs
	let showConfirmDialog = $state(false);
	let pendingChange = $state<{
		elementId: string;
		oldPosition: { x: number; y: number };
		newPosition: { x: number; y: number };
		newResponsable: string;
		currentResponsable: string;
	} | null>(null);
	let elementPositions = $state<Map<string, { x: number; y: number }>>(new Map());
	let showRebuildConfirmDialog = $state(false);

	// Convert table rows to BPMN flow definition
	function rowsToFlowDefinition(tableRows: TableRow[]): BPMNFlowDefinition {
		// Create nodes with auto-layout positions
		const nodes = tableRows.map((row, index) => ({
			id: row.id,
			type: row.type,
			label: row.label,
			responsable: row.responsable
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
			if (browser) {
				localStorage.removeItem(STORAGE_KEYS.XML);
			}
			return;
		}

		try {
			const flowDef = rowsToFlowDefinition(rows);
			flujoActual = flowDef;
			// Reset XML to force re-render from flowDefinition
			currentXml = null;
			// Remove saved XML so diagram regenerates from table data
			if (browser) {
				localStorage.removeItem(STORAGE_KEYS.XML);
			}
			// Increment key to force BpmnModeler re-render
			diagramKey++;
		} catch (err) {
			console.error('Error updating diagram:', err);
		}
	}

	// Rebuild diagram with automatic layout (discards manual positions)
	function rebuildDiagramLayout() {
		showRebuildConfirmDialog = true;
	}

	// Confirm and execute diagram rebuild
	function confirmRebuildLayout() {
		updateDiagram();
		showRebuildConfirmDialog = false;
	}

	// Cancel diagram rebuild
	function cancelRebuildLayout() {
		showRebuildConfirmDialog = false;
	}

	// Handle table changes
	async function handleTableChange(newRows: TableRow[]) {
		if (isApplyingIncrementalUpdate) return; // Prevent loops

		const oldRows = rows;
		rows = newRows;

		// Try incremental update if we have a modeler instance and existing XML
		if (modelerInstance && currentXml && previousRows.length > 0) {
			const changes = bpmnIncrementalUpdater.detectChanges(previousRows, newRows);

			if (changes.length > 0) {
				const success = await bpmnIncrementalUpdater.applyChanges(modelerInstance, changes);

				if (success) {
					previousRows = JSON.parse(JSON.stringify(newRows));
					return; // Don't regenerate the diagram
				}
			}
		}

		// Fall back to full regeneration
		previousRows = JSON.parse(JSON.stringify(newRows));
		updateDiagram();
	}

	// Handle diagram changes from visual editor
	function handleDiagramChange(xml: string) {
		currentXml = xml;
		// Immediately save to localStorage when diagram changes
		if (browser) {
			localStorage.setItem(STORAGE_KEYS.XML, xml);
		}
	}

	// Handle viewport changes (pan/zoom/scroll)
	function handleViewportChange(viewbox: any) {
		viewportX = viewbox.x;
	}

	// Handle modeler ready (receive modeler instance reference)
	function handleModelerReady(modelerRef: any) {
		modelerInstance = modelerRef;
	}

	// Determine responsable from X position in diagram
	function determineResponsableFromPosition(x: number): string {
		const swimlaneWidth = 300;
		const startX = 100;

		// Determine column index based on X position
		const columnIndex = Math.floor((x - startX) / swimlaneWidth);

		// Map index to responsable from swimlanes array
		const swimlanesList = swimlanes();
		if (columnIndex >= 0 && columnIndex < swimlanesList.length) {
			return swimlanesList[columnIndex].responsable;
		}

		return 'Sin asignar'; // Default
	}

	// Handle element moved in diagram (detect column changes)
	function handleElementMoved(
		elementId: string,
		newPosition: { x: number; y: number },
		oldPosition: { x: number; y: number }
	) {
		// Note: We do NOT check isApplyingIncrementalUpdate here because
		// element moves in the diagram should ALWAYS update the table,
		// regardless of whether we're in the middle of an incremental update

		// Find the row with this element ID
		const rowIndex = rows.findIndex((r) => r.id === elementId);
		if (rowIndex === -1) {
			return;
		}

		// Determine new responsable based on X position
		const newResponsable = determineResponsableFromPosition(newPosition.x);
		const currentResponsable = rows[rowIndex].responsable || 'Sin asignar';

		// If responsable changed, show confirmation dialog
		if (newResponsable !== currentResponsable) {
			pendingChange = {
				elementId,
				oldPosition,
				newPosition,
				newResponsable,
				currentResponsable
			};
			showConfirmDialog = true;
		}
	}

	// Apply the pending responsable change
	function applyResponsableChange() {
		if (!pendingChange) return;

		const change = pendingChange; // Local variable for type narrowing
		const rowIndex = rows.findIndex((r) => r.id === change.elementId);
		if (rowIndex === -1) return;

		const updatedRows = [...rows];
		updatedRows[rowIndex].responsable =
			change.newResponsable === 'Sin asignar' ? '' : change.newResponsable;

		// Set flag to prevent triggering incremental update back to diagram
		isApplyingIncrementalUpdate = true;

		// Update rows
		rows = updatedRows;
		previousRows = JSON.parse(JSON.stringify(updatedRows));

		// Reset flag after a short delay
		setTimeout(() => {
			isApplyingIncrementalUpdate = false;
		}, 100);

		// Clear pending change
		pendingChange = null;
	}

	// Cancel the pending responsable change
	function cancelResponsableChange() {
		if (!pendingChange || !modelerInstance) {
			pendingChange = null;
			return;
		}

		// Revert the element position in the diagram using bpmn-js modeling API
		const modeling = modelerInstance.get('modeling');
		const elementRegistry = modelerInstance.get('elementRegistry');

		const element = elementRegistry.get(pendingChange.elementId);
		if (element) {
			// Calculate delta to move back to old position
			const delta = {
				x: pendingChange.oldPosition.x - element.x,
				y: pendingChange.oldPosition.y - element.y
			};

			// Move element back
			modeling.moveElements([element], delta);
		}

		pendingChange = null;
	}

	// Handle element changed in diagram (bidirectional sync: diagram → table)
	function handleElementChanged(elementId: string, properties: any) {
		if (isApplyingIncrementalUpdate) return; // Prevent loops

		// Find the row with this element ID
		const rowIndex = rows.findIndex((r) => r.id === elementId);
		if (rowIndex === -1) {
			return;
		}

		// Update the row with new properties
		const updatedRows = [...rows];
		const row = updatedRows[rowIndex];

		let hasChanges = false;

		// Set flag to prevent triggering incremental update back to diagram
		isApplyingIncrementalUpdate = true;

		// Update properties that changed (only if they have a real value or explicitly changed)
		// For 'name': update if different
		if (properties.name !== undefined && properties.name !== row.label) {
			row.label = properties.name;
			hasChanges = true;
		}

		// For 'responsable': only update if it's not empty OR if it was explicitly cleared
		// Don't overwrite existing responsable with empty value from diagram edits
		if (properties.responsable !== undefined && properties.responsable !== row.responsable) {
			// Only update if new value is non-empty, OR if old value exists and new is explicitly empty
			if (properties.responsable !== '' || row.responsable === '') {
				row.responsable = properties.responsable;
				hasChanges = true;
			}
		}

		// Only update if there were actual changes
		if (hasChanges) {
			// Update rows (this will trigger handleTableChange but isApplyingIncrementalUpdate prevents loop)
			rows = updatedRows;
			previousRows = JSON.parse(JSON.stringify(updatedRows));
		}

		// Reset flag after a short delay
		setTimeout(() => {
			isApplyingIncrementalUpdate = false;
		}, 100);
	}

	// Calculate swimlanes based on responsables (vertical columns)
	let swimlanes = $derived(() => {
		if (!rows || rows.length === 0) return [];

		// Group by responsable
		const responsableGroups = new Map<string, TableRow[]>();
		const defaultResponsable = 'Sin asignar';

		rows.forEach((row) => {
			const responsable =
				row.responsable && row.responsable.trim() !== '' ? row.responsable : defaultResponsable;

			if (!responsableGroups.has(responsable)) {
				responsableGroups.set(responsable, []);
			}
			responsableGroups.get(responsable)!.push(row);
		});

		// Create vertical swimlane columns matching auto-layout
		const swimlaneWidth = 300; // Width of each column
		const swimlanePadding = 50; // Horizontal padding within swimlane
		let currentXBase = 100;

		return Array.from(responsableGroups.keys()).map((responsable, index) => {
			const xPos = currentXBase + index * swimlaneWidth + swimlanePadding;
			return {
				responsable,
				xPosition: xPos,
				width: swimlaneWidth
			};
		});
	});

	// Load data from localStorage
	function loadFromStorage() {
		if (!browser) return;

		try {
			// Load view mode
			const savedMode = localStorage.getItem(STORAGE_KEYS.VIEW_MODE);
			if (
				savedMode &&
				(savedMode === 'table' || savedMode === 'split' || savedMode === 'diagram')
			) {
				viewMode = savedMode as ViewMode;
			}

			// Load edit mode
			const savedEditMode = localStorage.getItem(STORAGE_KEYS.EDIT_MODE);
			if (savedEditMode !== null) {
				modoEdicion = savedEditMode === 'true';
			}

			// Load table rows
			const savedRows = localStorage.getItem(STORAGE_KEYS.ROWS);
			if (savedRows) {
				const parsed = JSON.parse(savedRows);
				if (Array.isArray(parsed) && parsed.length > 0) {
					rows = parsed;
				}
			}

			// Load diagram XML
			const savedXml = localStorage.getItem(STORAGE_KEYS.XML);
			if (savedXml) {
				currentXml = savedXml;
			}
		} catch (err) {
			console.error('Error loading from localStorage:', err);
		}
	}

	// Save data to localStorage
	function saveToStorage() {
		if (!browser) return;

		try {
			localStorage.setItem(STORAGE_KEYS.ROWS, JSON.stringify(rows));
			localStorage.setItem(STORAGE_KEYS.VIEW_MODE, viewMode);
			localStorage.setItem(STORAGE_KEYS.EDIT_MODE, String(modoEdicion));

			if (currentXml) {
				localStorage.setItem(STORAGE_KEYS.XML, currentXml);
			}
		} catch (err) {
			console.error('Error saving to localStorage:', err);
		}
	}

	// Initialize
	onMount(() => {
		loadFromStorage();

		// Update diagram if no saved XML
		if (!currentXml) {
			updateDiagram();
		}
	});

	// Auto-save rows when they change
	$effect(() => {
		if (browser && rows) {
			localStorage.setItem(STORAGE_KEYS.ROWS, JSON.stringify(rows));
		}
	});

	// Auto-save view mode when it changes
	$effect(() => {
		if (browser) {
			localStorage.setItem(STORAGE_KEYS.VIEW_MODE, viewMode);
		}
	});

	// Auto-save edit mode when it changes
	$effect(() => {
		if (browser) {
			localStorage.setItem(STORAGE_KEYS.EDIT_MODE, String(modoEdicion));
		}
	});
</script>

<div class="constructor-container">
	<header class="page-header">
		<h1>🏗️ Constructor de Flujos BPMN</h1>
		<p class="subtitle">Crea flujos BPMN usando una tabla simple - sin código</p>

		<!-- View Mode Switcher -->
		<ViewSwitcher bind:viewMode />
	</header>

	<div
		class="content-layout"
		class:table={viewMode === 'table'}
		class:split={viewMode === 'split'}
		class:diagram={viewMode === 'diagram'}
	>
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
					{#if rows.length > 1}
						<button
							class="rebuild-button"
							onclick={rebuildDiagramLayout}
							title="Reconstruir diagrama con layout automático"
						>
							🔄 Reconstruir Layout
						</button>
					{/if}
					<label class="mode-toggle">
						<input type="checkbox" bind:checked={modoEdicion} />
						<span class="toggle-label">{modoEdicion ? '🔓 Edición' : '🔒 Solo lectura'}</span>
					</label>
				</div>
			</div>

			<div class="diagram-container">
				{#if flujoActual || currentXml}
					<!-- Swimlane Headers Overlay -->
					{#if swimlanes().length > 0}
						<SwimlaneHeaders swimlanes={swimlanes()} {viewportX} />
					{/if}

					{#key diagramKey}
						<BpmnModeler
							flowDefinition={currentXml ? undefined : (flujoActual ?? undefined)}
							xml={currentXml ?? undefined}
							editable={modoEdicion}
							onChange={handleDiagramChange}
							onViewportChange={handleViewportChange}
							onModelerReady={handleModelerReady}
							onElementChanged={handleElementChanged}
							onElementMoved={handleElementMoved}
							class="diagram-viewer"
						/>
					{/key}
				{:else}
					<div class="empty-state">
						<p>⚠️ Agrega actividades en la tabla para ver el diagrama</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Confirmation Dialogs -->
<ConfirmDialog
	bind:open={showConfirmDialog}
	title="Cambiar Responsable"
	description={pendingChange
		? `¿Desea cambiar el responsable de "${pendingChange.currentResponsable}" a "${pendingChange.newResponsable}"?`
		: ''}
	confirmText="Sí, cambiar"
	cancelText="Cancelar"
	onConfirm={applyResponsableChange}
	onCancel={cancelResponsableChange}
/>

<ConfirmDialog
	bind:open={showRebuildConfirmDialog}
	title="Reconstruir Layout Automático"
	description="¿Desea reconstruir el diagrama con layout automático? Se perderán todas las posiciones personalizadas de los elementos."
	confirmText="Sí, reconstruir"
	cancelText="Cancelar"
	onConfirm={confirmRebuildLayout}
	onCancel={cancelRebuildLayout}
/>

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
		position: relative;
		display: grid;
		gap: 2rem;
		height: calc(100vh - 250px);
		transition: grid-template-columns 0.3s ease;
	}

	/* Split view (default) - both panels */
	.content-layout.split {
		grid-template-columns: 1fr 1fr;
	}

	/* Table only view - hide preview but keep it mounted */
	.content-layout.table {
		grid-template-columns: 1fr;
	}

	.content-layout.table .preview-panel {
		position: absolute;
		visibility: hidden;
		pointer-events: none;
		left: -9999px;
	}

	/* Diagram only view - hide editor but keep it mounted */
	.content-layout.diagram {
		grid-template-columns: 1fr;
	}

	.content-layout.diagram .editor-panel {
		position: absolute;
		visibility: hidden;
		pointer-events: none;
		left: -9999px;
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

	.rebuild-button {
		padding: 0.5rem 1rem;
		background: #f8fafc;
		border: 1px solid #cbd5e1;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #475569;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.rebuild-button:hover {
		background: #f1f5f9;
		border-color: #94a3b8;
		color: #334155;
	}

	.rebuild-button:active {
		transform: scale(0.98);
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
		position: relative;
		flex: 1;
		min-height: 0;
		background: #fafafa;
		overflow: hidden;
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
