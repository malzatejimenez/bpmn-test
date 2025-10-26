<script lang="ts">
	import { onMount } from 'svelte';
	import BpmnViewer from '$lib/components/BpmnViewer.svelte';
	import type { BPMNFlowDefinition } from '$lib/types/bpmn.types';
	import '$lib/styles/bpmn.css';

	// Flujo básico simple
	const flujoBasico: BPMNFlowDefinition = {
		id: 'Process_Basico',
		name: 'Mi Primer Flujo',
		nodes: [
			{
				id: 'inicio',
				type: 'startEvent',
				label: 'Inicio',
				position: { x: 100, y: 200 }
			},
			{
				id: 'tarea',
				type: 'task',
				label: 'Hacer algo',
				position: { x: 300, y: 180 }
			},
			{
				id: 'fin',
				type: 'endEvent',
				label: 'Fin',
				position: { x: 500, y: 200 }
			}
		],
		connections: [
			{ id: 'f1', from: 'inicio', to: 'tarea' },
			{ id: 'f2', from: 'tarea', to: 'fin' }
		]
	};

	let viewer: any;
</script>

<div class="page">
	<h1>Test Simple - Visualizador BPMN</h1>
	<p>Si ves un diagrama abajo, todo funciona correctamente.</p>

	<div class="viewer-wrapper">
		<BpmnViewer bind:this={viewer} flowDefinition={flujoBasico} />
	</div>

	<div class="info">
		<h2>Información del Flujo:</h2>
		<ul>
			<li><strong>ID:</strong> {flujoBasico.id}</li>
			<li><strong>Nombre:</strong> {flujoBasico.name}</li>
			<li><strong>Nodos:</strong> {flujoBasico.nodes.length}</li>
			<li><strong>Conexiones:</strong> {flujoBasico.connections.length}</li>
		</ul>
	</div>
</div>

<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	p {
		color: #666;
		margin-bottom: 2rem;
	}

	.viewer-wrapper {
		height: 600px;
		margin-bottom: 2rem;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		overflow: hidden;
	}

	.info {
		background: #f5f5f5;
		padding: 1.5rem;
		border-radius: 8px;
	}

	.info h2 {
		margin-top: 0;
		font-size: 1.25rem;
	}

	.info ul {
		list-style: none;
		padding: 0;
	}

	.info li {
		padding: 0.5rem 0;
		border-bottom: 1px solid #ddd;
	}

	.info li:last-child {
		border-bottom: none;
	}
</style>
