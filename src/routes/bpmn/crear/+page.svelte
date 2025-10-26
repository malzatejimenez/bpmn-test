<script lang="ts">
	import { onMount } from 'svelte';
	import BpmnModeler from '$lib/components/BpmnModeler.svelte';
	import type { BPMNFlowDefinition } from '$lib/types/bpmn.types';
	import { bpmnBuilder } from '$lib/services/bpmn-builder';
	import '$lib/styles/bpmn.css';

	// Ejemplo básico que puedes modificar
	let codigoFlujo = $state(`{
  id: 'Process_MiPrimerFlujo',
  name: 'Mi Primer Flujo',
  nodes: [
    {
      id: 'inicio',
      type: 'startEvent',
      label: 'Inicio',
      position: { x: 100, y: 200 }
    },
    {
      id: 'tarea1',
      type: 'userTask',
      label: 'Revisar Solicitud',
      position: { x: 300, y: 180 }
    },
    {
      id: 'decision',
      type: 'exclusiveGateway',
      label: '¿Aprobado?',
      position: { x: 500, y: 175 }
    },
    {
      id: 'tareaAprobado',
      type: 'serviceTask',
      label: 'Procesar Aprobación',
      position: { x: 650, y: 100 }
    },
    {
      id: 'tareaRechazado',
      type: 'sendTask',
      label: 'Enviar Rechazo',
      position: { x: 650, y: 280 }
    },
    {
      id: 'finAprobado',
      type: 'endEvent',
      label: 'Aprobado',
      position: { x: 850, y: 118 }
    },
    {
      id: 'finRechazado',
      type: 'endEvent',
      label: 'Rechazado',
      position: { x: 850, y: 298 }
    }
  ],
  connections: [
    { id: 'f1', from: 'inicio', to: 'tarea1' },
    { id: 'f2', from: 'tarea1', to: 'decision' },
    {
      id: 'f3',
      from: 'decision',
      to: 'tareaAprobado',
      label: 'Sí',
      condition: '\${aprobado == true}'
    },
    {
      id: 'f4',
      from: 'decision',
      to: 'tareaRechazado',
      label: 'No',
      condition: '\${aprobado == false}'
    },
    { id: 'f5', from: 'tareaAprobado', to: 'finAprobado' },
    { id: 'f6', from: 'tareaRechazado', to: 'finRechazado' }
  ]
}`);

	let flujoActual = $state<BPMNFlowDefinition | null>(null);
	let error = $state<string | null>(null);
	let autoLayoutEnabled = $state(false);
	let modoEdicion = $state(false);
	let modelerRef = $state<any>(null);

	// Parsear y actualizar el flujo
	function actualizarFlujo() {
		try {
			error = null;
			// Evaluar el código como objeto JavaScript
			const flujo = eval(`(${codigoFlujo})`);

			// Aplicar auto-layout si está habilitado
			if (autoLayoutEnabled) {
				flujoActual = bpmnBuilder.autoLayout(flujo);
			} else {
				flujoActual = flujo;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Error al parsear el flujo';
			console.error('Error en actualizarFlujo:', e);
		}
	}

	// Cargar ejemplos
	function cargarEjemplo(tipo: string) {
		if (tipo === 'basico') {
			codigoFlujo = `{
  id: 'Process_Basico',
  name: 'Flujo Básico',
  nodes: [
    { id: 'start', type: 'startEvent', label: 'Inicio', position: { x: 100, y: 200 } },
    { id: 'task', type: 'task', label: 'Hacer algo', position: { x: 300, y: 180 } },
    { id: 'end', type: 'endEvent', label: 'Fin', position: { x: 500, y: 200 } }
  ],
  connections: [
    { id: 'f1', from: 'start', to: 'task' },
    { id: 'f2', from: 'task', to: 'end' }
  ]
}`;
		} else if (tipo === 'decision') {
			codigoFlujo = `{
  id: 'Process_Decision',
  name: 'Flujo con Decisión',
  nodes: [
    { id: 'start', type: 'startEvent', label: 'Inicio', position: { x: 100, y: 200 } },
    { id: 'task', type: 'userTask', label: 'Evaluar', position: { x: 300, y: 180 } },
    { id: 'gateway', type: 'exclusiveGateway', label: '¿OK?', position: { x: 500, y: 175 } },
    { id: 'taskSi', type: 'task', label: 'Continuar', position: { x: 650, y: 100 } },
    { id: 'taskNo', type: 'task', label: 'Corregir', position: { x: 650, y: 280 } },
    { id: 'endSi', type: 'endEvent', label: 'Éxito', position: { x: 850, y: 118 } },
    { id: 'endNo', type: 'endEvent', label: 'Error', position: { x: 850, y: 298 } }
  ],
  connections: [
    { id: 'f1', from: 'start', to: 'task' },
    { id: 'f2', from: 'task', to: 'gateway' },
    { id: 'f3', from: 'gateway', to: 'taskSi', label: 'Sí' },
    { id: 'f4', from: 'gateway', to: 'taskNo', label: 'No' },
    { id: 'f5', from: 'taskSi', to: 'endSi' },
    { id: 'f6', from: 'taskNo', to: 'endNo' }
  ]
}`;
		} else if (tipo === 'paralelo') {
			codigoFlujo = `{
  id: 'Process_Paralelo',
  name: 'Procesamiento Paralelo',
  nodes: [
    { id: 'start', type: 'startEvent', label: 'Inicio', position: { x: 100, y: 200 } },
    { id: 'fork', type: 'parallelGateway', label: 'Dividir', position: { x: 300, y: 180 } },
    { id: 'taskA', type: 'serviceTask', label: 'Proceso A', position: { x: 450, y: 80 } },
    { id: 'taskB', type: 'serviceTask', label: 'Proceso B', position: { x: 450, y: 180 } },
    { id: 'taskC', type: 'serviceTask', label: 'Proceso C', position: { x: 450, y: 280 } },
    { id: 'join', type: 'parallelGateway', label: 'Unir', position: { x: 650, y: 180 } },
    { id: 'end', type: 'endEvent', label: 'Fin', position: { x: 850, y: 198 } }
  ],
  connections: [
    { id: 'f1', from: 'start', to: 'fork' },
    { id: 'f2', from: 'fork', to: 'taskA' },
    { id: 'f3', from: 'fork', to: 'taskB' },
    { id: 'f4', from: 'fork', to: 'taskC' },
    { id: 'f5', from: 'taskA', to: 'join' },
    { id: 'f6', from: 'taskB', to: 'join' },
    { id: 'f7', from: 'taskC', to: 'join' },
    { id: 'f8', from: 'join', to: 'end' }
  ]
}`;
		}
		actualizarFlujo();
	}

	// Aplicar auto-layout avanzado al diagrama actual
	async function aplicarAutoLayout() {
		if (!modelerRef) return;

		try {
			const xmlActual = await modelerRef.exportXML();
			if (!xmlActual) return;

			const xmlConLayout = await bpmnBuilder.applyAdvancedLayout(xmlActual);
			await modelerRef.loadDiagramXML(xmlConLayout);
		} catch (err) {
			console.error('Error aplicando auto-layout:', err);
			error = 'Error al aplicar auto-layout';
		}
	}

	// Manejar cambios en el diagrama cuando está en modo edición
	function handleDiagramChange(xml: string) {
		// Aquí puedes actualizar el código si lo deseas
		console.log('Diagrama modificado');
	}

	// Inicializar con el flujo por defecto cuando el componente monta
	onMount(() => {
		actualizarFlujo();
	});
</script>

<div class="page-container">
	<header class="page-header">
		<h1>🏗️ Constructor de Flujos BPMN</h1>
		<p class="subtitle">Crea y visualiza tus propios diagramas BPMN en tiempo real</p>
	</header>

	<div class="content-grid">
		<!-- Editor de código -->
		<div class="editor-panel">
			<div class="panel-header">
				<h2>📝 Editor</h2>
				<div class="header-actions">
					<label class="auto-layout-toggle">
						<input type="checkbox" bind:checked={autoLayoutEnabled} onchange={actualizarFlujo} />
						Auto-layout básico
					</label>
					<button onclick={actualizarFlujo} class="btn-primary">▶️ Actualizar</button>
				</div>
			</div>

			<div class="examples">
				<span class="examples-label">Ejemplos:</span>
				<button onclick={() => cargarEjemplo('basico')} class="btn-example">Básico</button>
				<button onclick={() => cargarEjemplo('decision')} class="btn-example"
					>Con Decisión</button
				>
				<button onclick={() => cargarEjemplo('paralelo')} class="btn-example">Paralelo</button>
			</div>

			<textarea bind:value={codigoFlujo} class="code-editor" spellcheck="false"></textarea>

			{#if error}
				<div class="error-message">
					<strong>❌ Error:</strong>
					{error}
				</div>
			{/if}

			<div class="help-text">
				<p><strong>💡 Consejo:</strong> Modifica el código y presiona "Actualizar" para ver los cambios.</p>
				<p>
					<a href="/GUIA_CONSTRUCCION_FLUJOS.md" target="_blank"
						>📘 Ver guía completa de construcción</a
					>
				</p>
			</div>
		</div>

		<!-- Visualizador / Editor -->
		<div class="viewer-panel">
			<div class="panel-header">
				<h2>{modoEdicion ? '✏️ Editor Visual' : '👁️ Vista Previa'}</h2>
				<div class="header-actions">
					<button onclick={aplicarAutoLayout} class="btn-secondary" disabled={!flujoActual}>
						🎯 Auto-organizar
					</button>
					<label class="mode-toggle">
						<input type="checkbox" bind:checked={modoEdicion} />
						<span class="toggle-label">{modoEdicion ? '🔓 Edición' : '🔒 Solo lectura'}</span>
					</label>
				</div>
			</div>

			<div class="viewer-container">
				{#if flujoActual}
					<BpmnModeler
						bind:this={modelerRef}
						flowDefinition={flujoActual}
						class="preview-viewer"
						editable={modoEdicion}
						onChange={handleDiagramChange}
					/>
				{:else}
					<div class="empty-state">
						<p>⚠️ No hay flujo para mostrar</p>
						<p style="font-size: 0.875rem; margin-top: 1rem">
							Presiona el botón "▶️ Actualizar" arriba
						</p>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Referencia rápida -->
	<div class="quick-reference">
		<h3>📚 Referencia Rápida</h3>
		<div class="ref-grid">
			<div class="ref-section">
				<h4>Eventos</h4>
				<ul>
					<li><code>startEvent</code> - Inicio</li>
					<li><code>endEvent</code> - Fin</li>
				</ul>
			</div>
			<div class="ref-section">
				<h4>Tareas</h4>
				<ul>
					<li><code>task</code> - Genérica</li>
					<li><code>userTask</code> - Manual</li>
					<li><code>serviceTask</code> - Automática</li>
					<li><code>sendTask</code> - Enviar mensaje</li>
				</ul>
			</div>
			<div class="ref-section">
				<h4>Compuertas</h4>
				<ul>
					<li><code>exclusiveGateway</code> - Decisión (XOR)</li>
					<li><code>parallelGateway</code> - Paralelo (AND)</li>
					<li><code>inclusiveGateway</code> - Inclusivo (OR)</li>
				</ul>
			</div>
		</div>
	</div>
</div>

<style>
	.page-container {
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

	.content-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.editor-panel,
	.viewer-panel {
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #e2e8f0;
		background: #f8fafc;
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

	.auto-layout-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #64748b;
		cursor: pointer;
	}

	.btn-primary {
		padding: 0.5rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-primary:hover {
		background: #2563eb;
	}

	.btn-secondary {
		padding: 0.5rem 1rem;
		background: #10b981;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-secondary:hover:not(:disabled) {
		background: #059669;
	}

	.btn-secondary:disabled {
		background: #9ca3af;
		cursor: not-allowed;
		opacity: 0.6;
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

	.examples {
		padding: 1rem 1.5rem;
		background: #fffbeb;
		border-bottom: 1px solid #fef3c7;
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.examples-label {
		font-weight: 600;
		color: #92400e;
		font-size: 0.875rem;
	}

	.btn-example {
		padding: 0.375rem 0.75rem;
		background: white;
		border: 1px solid #fbbf24;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		color: #92400e;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-example:hover {
		background: #fef3c7;
		border-color: #f59e0b;
	}

	.code-editor {
		width: 100%;
		height: 500px;
		padding: 1rem;
		border: none;
		font-family: 'Courier New', monospace;
		font-size: 0.875rem;
		resize: vertical;
		background: #1e293b;
		color: #e2e8f0;
		line-height: 1.6;
	}

	.code-editor:focus {
		outline: none;
	}

	.error-message {
		padding: 1rem 1.5rem;
		background: #fee2e2;
		border-top: 2px solid #ef4444;
		color: #991b1b;
		font-size: 0.875rem;
	}

	.help-text {
		padding: 1rem 1.5rem;
		background: #f0fdf4;
		border-top: 1px solid #bbf7d0;
		font-size: 0.875rem;
		color: #166534;
	}

	.help-text p {
		margin: 0.5rem 0;
	}

	.help-text a {
		color: #16a34a;
		text-decoration: underline;
	}

	.viewer-container {
		height: 600px;
		background: #fafafa;
	}

	:global(.preview-viewer) {
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

	.quick-reference {
		background: white;
		padding: 2rem;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.quick-reference h3 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 1.5rem 0;
	}

	.ref-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
	}

	.ref-section h4 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #475569;
		margin: 0 0 0.75rem 0;
	}

	.ref-section ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.ref-section li {
		padding: 0.5rem 0;
		font-size: 0.875rem;
		color: #64748b;
	}

	.ref-section code {
		background: #f1f5f9;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-family: 'Courier New', monospace;
		color: #3b82f6;
		font-size: 0.8125rem;
	}
</style>
