<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type { BPMNFlowDefinition } from '$lib/types/bpmn.types';
	import { bpmnBuilder } from '$lib/services/bpmn-builder';
	import * as m from '$lib/paraglide/messages';

	// Props
	interface Props {
		flowDefinition?: BPMNFlowDefinition;
		xml?: string;
		class?: string;
	}

	let { flowDefinition, xml, class: className }: Props = $props();

	// State
	let container: HTMLDivElement;
	let viewer = $state<any>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	/**
	 * Initialize BPMN viewer
	 */
	async function initViewer() {
		if (!container || !browser) return;

		try {
			// Dynamically import bpmn-js only on client side
			const BpmnJS = (await import('bpmn-js')).default;

			// Create viewer instance
			viewer = new BpmnJS({
				container: container,
				height: '100%'
			});

			loading = false;

			// Load initial diagram if provided
			if (xml) {
				await loadXML(xml);
			} else if (flowDefinition) {
				await loadFlowDefinition(flowDefinition);
			}
		} catch (err) {
			console.error('Error initializing BPMN viewer:', err);
			error = err instanceof Error ? err.message : 'Failed to initialize viewer';
			loading = false;
		}
	}

	/**
	 * Load XML into viewer
	 */
	async function loadXML(xmlString: string) {
		if (!viewer) return;

		try {
			await viewer.importXML(xmlString);

			// Fit viewport to diagram
			const canvas = viewer.get('canvas');
			canvas.zoom('fit-viewport');

			error = null;
		} catch (err) {
			console.error('Error loading BPMN XML:', err);
			error = err instanceof Error ? err.message : 'Failed to load diagram';
			throw err;
		}
	}

	/**
	 * Load flow definition into viewer
	 */
	async function loadFlowDefinition(flow: BPMNFlowDefinition) {
		try {
			const xmlString = await bpmnBuilder.buildXML(flow);
			await loadXML(xmlString);
		} catch (err) {
			console.error('Error loading flow definition:', err);
			error = err instanceof Error ? err.message : 'Failed to load flow definition';
			throw err;
		}
	}

	/**
	 * Export diagram as XML
	 */
	export async function exportXML(): Promise<string | null> {
		if (!viewer) return null;

		try {
			const result = await viewer.saveXML({ format: true });
			return result.xml;
		} catch (err) {
			console.error('Error exporting XML:', err);
			return null;
		}
	}

	/**
	 * Export diagram as SVG
	 */
	export async function exportSVG(): Promise<string | null> {
		if (!viewer) return null;

		try {
			const result = await viewer.saveSVG();
			return result.svg;
		} catch (err) {
			console.error('Error exporting SVG:', err);
			return null;
		}
	}

	/**
	 * Zoom to fit viewport
	 */
	export function zoomToFit() {
		if (!viewer) return;

		const canvas = viewer.get('canvas');
		canvas.zoom('fit-viewport');
	}

	/**
	 * Set zoom level
	 */
	export function setZoom(level: number) {
		if (!viewer) return;

		const canvas = viewer.get('canvas');
		canvas.zoom(level);
	}

	// Lifecycle
	onMount(() => {
		initViewer();
	});

	onDestroy(() => {
		if (viewer) {
			viewer.destroy();
			viewer = null;
		}
	});

	// Watch for changes in props and reload when they change
	$effect(() => {
		// Track both viewer readiness and flowDefinition changes
		if (!viewer || !flowDefinition) return;

		loadFlowDefinition(flowDefinition);
	});

	$effect(() => {
		// Track both viewer readiness and xml changes
		if (!viewer || !xml) return;

		loadXML(xml);
	});
</script>

<div class="bpmn-viewer-wrapper {className || ''}">
	{#if loading}
		<div class="loading-container">
			<div class="loading-spinner"></div>
			<p>{m.bpmn_loading()}</p>
		</div>
	{/if}

	{#if error}
		<div class="error-container">
			<div class="error-icon">⚠️</div>
			<p class="error-message">{error}</p>
		</div>
	{/if}

	<div bind:this={container} class="bpmn-container" class:hidden={loading || error}></div>
</div>

<style>
	.bpmn-viewer-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 400px;
		background-color: #fafafa;
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		overflow: hidden;
	}

	.bpmn-container {
		width: 100%;
		height: 100%;
	}

	.bpmn-container.hidden {
		display: none;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #666;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e0e0e0;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.loading-container p {
		margin-top: 16px;
		font-size: 14px;
	}

	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 24px;
		text-align: center;
	}

	.error-icon {
		font-size: 48px;
		margin-bottom: 16px;
	}

	.error-message {
		color: #dc2626;
		font-size: 14px;
		max-width: 400px;
	}

	/* Import BPMN.js styles */
	:global(.bpmn-container .djs-container) {
		background-color: white;
	}
</style>
