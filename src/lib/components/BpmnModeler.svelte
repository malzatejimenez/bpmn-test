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
		editable?: boolean;
		onChange?: (xml: string) => void;
	}

	let { flowDefinition, xml, class: className, editable = true, onChange }: Props = $props();

	// State
	let container: HTMLDivElement;
	let modeler = $state<any>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	/**
	 * Initialize BPMN modeler or viewer
	 */
	async function initModeler() {
		if (!container || !browser) return;

		try {
			// Dynamically import Modeler or Viewer based on editable prop
			if (editable) {
				const { default: Modeler } = await import('bpmn-js/lib/Modeler');
				modeler = new Modeler({
					container: container,
					height: '100%'
				});

				// Listen to changes if editable
				modeler.on('commandStack.changed', async () => {
					if (onChange) {
						const { xml: currentXml } = await modeler.saveXML({ format: true });
						onChange(currentXml);
					}
				});
			} else {
				const BpmnJS = (await import('bpmn-js')).default;
				modeler = new BpmnJS({
					container: container,
					height: '100%'
				});
			}

			loading = false;

			// Load initial diagram if provided
			if (xml) {
				await loadXML(xml);
			} else if (flowDefinition) {
				await loadFlowDefinition(flowDefinition);
			}
		} catch (err) {
			console.error('Error initializing BPMN modeler:', err);
			error = err instanceof Error ? err.message : 'Failed to initialize modeler';
			loading = false;
		}
	}

	/**
	 * Load XML into modeler
	 */
	async function loadXML(xmlString: string) {
		if (!modeler) return;

		try {
			await modeler.importXML(xmlString);

			// Fit viewport to diagram
			const canvas = modeler.get('canvas');
			canvas.zoom('fit-viewport');

			error = null;
		} catch (err) {
			console.error('Error loading BPMN XML:', err);
			error = err instanceof Error ? err.message : 'Failed to load diagram';
			throw err;
		}
	}

	/**
	 * Load flow definition into modeler
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
	 * Load XML into modeler (public API)
	 */
	export async function loadDiagramXML(xmlString: string) {
		await loadXML(xmlString);
	}

	/**
	 * Export diagram as XML
	 */
	export async function exportXML(): Promise<string | null> {
		if (!modeler) return null;

		try {
			const result = await modeler.saveXML({ format: true });
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
		if (!modeler) return null;

		try {
			const result = await modeler.saveSVG();
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
		if (!modeler) return;

		const canvas = modeler.get('canvas');
		canvas.zoom('fit-viewport');
	}

	/**
	 * Set zoom level
	 */
	export function setZoom(level: number) {
		if (!modeler) return;

		const canvas = modeler.get('canvas');
		canvas.zoom(level);
	}

	// Lifecycle
	onMount(() => {
		initModeler();
	});

	onDestroy(() => {
		if (modeler) {
			modeler.destroy();
			modeler = null;
		}
	});

	// Watch for changes in props and reload when they change
	$effect(() => {
		// Track both modeler readiness and flowDefinition changes
		if (!modeler || !flowDefinition) return;

		loadFlowDefinition(flowDefinition);
	});

	$effect(() => {
		// Track both modeler readiness and xml changes
		if (!modeler || !xml) return;

		loadXML(xml);
	});

	// Watch for editable changes - need to recreate modeler
	let previousEditable = editable;
	$effect(() => {
		if (previousEditable !== editable && modeler) {
			// Save current XML before destroying
			const preserveXml = async () => {
				const currentXml = await modeler.saveXML({ format: true });
				modeler.destroy();
				modeler = null;
				previousEditable = editable;

				// Reinitialize with preserved XML
				await initModeler();
				if (currentXml?.xml) {
					await loadXML(currentXml.xml);
				}
			};
			preserveXml();
		}
	});
</script>

<div class="bpmn-modeler-wrapper {className || ''}" class:editable>
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
	.bpmn-modeler-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 400px;
		background-color: #fafafa;
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		overflow: hidden;
	}

	.bpmn-modeler-wrapper.editable {
		border-color: #3b82f6;
		box-shadow: 0 0 0 1px #3b82f6;
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

	/* Modeler-specific styles */
	:global(.bpmn-modeler-wrapper.editable .djs-palette) {
		border-right: 1px solid #ccc;
	}

	:global(.bpmn-modeler-wrapper.editable .djs-context-pad) {
		display: block;
	}
</style>
