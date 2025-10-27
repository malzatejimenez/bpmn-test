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
		onViewportChange?: (viewbox: any) => void;
		onModelerReady?: (modelerInstance: any) => void;
		onElementChanged?: (elementId: string, properties: any) => void;
		onElementMoved?: (
			elementId: string,
			newPosition: { x: number; y: number },
			oldPosition: { x: number; y: number }
		) => void;
	}

	let {
		flowDefinition,
		xml,
		class: className,
		editable = true,
		onChange,
		onViewportChange,
		onModelerReady,
		onElementChanged,
		onElementMoved
	}: Props = $props();

	// State
	let container: HTMLDivElement;
	let modeler = $state<any>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let isRelayouting = false;
	let changeListener: any = null;
	let viewportListener: any = null;
	let elementChangedListener: any = null;
	let elementMovedListener: any = null;

	/**
	 * Setup read-only mode by hiding palette and context pad
	 */
	function setupReadOnlyMode() {
		if (!modeler || editable) return;

		try {
			// Close palette and context pad in read-only mode
			const palette = modeler.get('palette');
			const contextPad = modeler.get('contextPad');

			if (palette) {
				palette.close();
			}

			if (contextPad) {
				contextPad.close();
			}
		} catch (err) {
			console.warn('Error setting up read-only mode:', err);
		}
	}

	/**
	 * Setup or remove change listener based on editable state
	 */
	function setupChangeListener() {
		if (!modeler) return;

		// Remove existing listener if any
		if (changeListener) {
			modeler.off('commandStack.changed', changeListener);
			changeListener = null;
		}

		// Add listener whenever onChange callback exists (regardless of editable state)
		if (onChange) {
			changeListener = async () => {
				// Skip onChange during relayout to avoid infinite loops
				if (!isRelayouting) {
					try {
						const { xml: currentXml } = await modeler.saveXML({ format: true });
						onChange(currentXml);
					} catch (err) {
						console.error('Error saving XML on change:', err);
					}
				}
			};
			modeler.on('commandStack.changed', changeListener);
		}
	}

	/**
	 * Setup viewport change listener
	 */
	function setupViewportListener() {
		if (!modeler) return;

		// Remove existing listener if any
		if (viewportListener) {
			modeler.off('canvas.viewbox.changed', viewportListener);
			viewportListener = null;
		}

		// Add listener if onViewportChange callback exists
		if (onViewportChange) {
			viewportListener = (event: any) => {
				const canvas = modeler.get('canvas');
				const viewbox = canvas.viewbox();
				onViewportChange(viewbox);
			};
			modeler.on('canvas.viewbox.changed', viewportListener);
		}
	}

	/**
	 * Setup element changed listener for bidirectional sync
	 */
	function setupElementChangedListener() {
		if (!modeler) return;

		// Remove existing listener if any
		if (elementChangedListener) {
			modeler.off('element.changed', elementChangedListener);
			elementChangedListener = null;
		}

		// Add listener if onElementChanged callback exists
		if (onElementChanged) {
			elementChangedListener = (event: any) => {
				// Skip during relayout to avoid loops
				if (isRelayouting) return;

				const element = event.element;

				// Only track changes to flow nodes (not connections, labels, etc.)
				if (!element || !element.businessObject) return;
				if (element.type && element.type.includes('SequenceFlow')) return;
				if (element.type && element.type.includes('Label')) return;

				// Extract relevant properties from business object
				const properties = {
					name: element.businessObject.name || '',
					responsable: element.businessObject.responsable || ''
				};

				onElementChanged(element.id, properties);
			};
			modeler.on('element.changed', elementChangedListener);
		}
	}

	/**
	 * Setup element moved listener to detect column changes
	 */
	function setupElementMovedListener() {
		if (!modeler) return;

		// Remove existing listeners if any
		if (elementMovedListener) {
			modeler.off('shape.move.end', elementMovedListener);
			elementMovedListener = null;
		}

		// Store original positions when move starts
		let originalPositions = new Map<string, { x: number; y: number }>();

		// Capture original position on move start
		const moveStartListener = (event: any) => {
			const shape = event.shape;
			if (!shape || !shape.businessObject) return;
			if (shape.type && shape.type.includes('SequenceFlow')) return;
			if (shape.type && shape.type.includes('Label')) return;

			originalPositions.set(shape.id, { x: shape.x, y: shape.y });
		};

		// Handle move end with both old and new positions
		elementMovedListener = (event: any) => {
			// Skip during relayout to avoid loops
			if (isRelayouting) return;

			const shape = event.shape;

			// Only track flow nodes (not connections, labels, etc.)
			if (!shape || !shape.businessObject) return;
			if (shape.type && shape.type.includes('SequenceFlow')) return;
			if (shape.type && shape.type.includes('Label')) return;

			// Get positions
			const oldPosition = originalPositions.get(shape.id) || { x: shape.x, y: shape.y };
			const newPosition = {
				x: shape.x,
				y: shape.y
			};

			// Clean up
			originalPositions.delete(shape.id);

			// Call callback if provided
			if (onElementMoved) {
				onElementMoved(shape.id, newPosition, oldPosition);
			}
		};

		modeler.on('shape.move.start', moveStartListener);
		modeler.on('shape.move.end', elementMovedListener);
	}

	/**
	 * Initialize BPMN modeler or viewer
	 */
	async function initModeler() {
		if (!container || !browser) return;

		try {
			// Always use Modeler to have access to modeling features for relayout
			const { default: Modeler } = await import('bpmn-js/lib/Modeler');
			modeler = new Modeler({
				container: container,
				height: '100%'
			});

			// Setup change listener based on editable state
			setupChangeListener();

			// Setup viewport listener
			setupViewportListener();

			// Setup element changed listener for bidirectional sync
			setupElementChangedListener();

			// Setup element moved listener for column change detection
			setupElementMovedListener();

			loading = false;

			// Load initial diagram if provided
			if (xml) {
				await loadXML(xml);
			} else if (flowDefinition) {
				await loadFlowDefinition(flowDefinition);
			}

			// Setup read-only mode after diagram is loaded
			setupReadOnlyMode();

			// Notify parent that modeler is ready
			if (onModelerReady && modeler) {
				onModelerReady(modeler);
			}
		} catch (err) {
			console.error('Error initializing BPMN modeler:', err);
			error = err instanceof Error ? err.message : 'Failed to initialize modeler';
			loading = false;
		}
	}

	/**
	 * Relayout all connections to use Manhattan routing
	 * by simulating a micro-movement of each shape element
	 */
	function relayoutConnections() {
		if (!modeler) return;

		// Disable change listener temporarily
		isRelayouting = true;

		try {
			const elementRegistry = modeler.get('elementRegistry');
			const modeling = modeler.get('modeling');

			// Get all shape elements (tasks, events, gateways, etc.)
			const shapes = elementRegistry.filter(
				(element: any) =>
					element.type &&
					!element.type.includes('SequenceFlow') &&
					!element.type.includes('Label') &&
					element.waypoints === undefined
			);

			// Move each shape by 1px and back to trigger connection re-layout
			shapes.forEach((shape: any) => {
				if (shape.x !== undefined && shape.y !== undefined) {
					// Move element 1px
					modeling.moveElements([shape], { x: 1, y: 0 });
					// Move back immediately
					modeling.moveElements([shape], { x: -1, y: 0 });
				}
			});

			// Clear the undo stack to hide these micro-movements
			const commandStack = modeler.get('commandStack');
			commandStack.clear();
		} catch (err) {
			console.error('Error relayouting connections:', err);
		} finally {
			// Re-enable change listener
			isRelayouting = false;
		}
	}

	/**
	 * Load XML into modeler
	 */
	async function loadXML(xmlString: string) {
		if (!modeler) return;

		try {
			await modeler.importXML(xmlString);

			// Relayout connections for better visuals
			relayoutConnections();

			// Fit viewport to diagram
			const canvas = modeler.get('canvas');
			canvas.zoom('fit-viewport');

			// Save the loaded XML via onChange callback (for persistence)
			if (onChange) {
				const { xml: currentXml } = await modeler.saveXML({ format: true });
				onChange(currentXml);
			}

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
			// Clean up listeners
			if (changeListener) {
				modeler.off('commandStack.changed', changeListener);
			}
			if (viewportListener) {
				modeler.off('canvas.viewbox.changed', viewportListener);
			}
			modeler.destroy();
			modeler = null;
		}
	});

	// Watch for changes in props and reload when they change
	$effect(() => {
		// Track both modeler readiness and diagram source changes
		// Priority: xml > flowDefinition (xml is the edited version)
		if (!modeler) return;

		if (xml) {
			// Load from XML if available (user has edited the diagram)
			loadXML(xml);
		} else if (flowDefinition) {
			// Load from flowDefinition if no XML (auto-generated from table)
			loadFlowDefinition(flowDefinition);
		}
	});

	// Watch for editable changes - update listener and read-only mode
	let previousEditable = editable;
	$effect(() => {
		if (previousEditable !== editable && modeler) {
			previousEditable = editable;
			setupChangeListener();
			setupReadOnlyMode();
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

	/* Disable interactions in read-only mode */
	.bpmn-modeler-wrapper:not(.editable) :global(.djs-palette),
	.bpmn-modeler-wrapper:not(.editable) :global(.djs-context-pad),
	.bpmn-modeler-wrapper:not(.editable) :global(.djs-popup) {
		display: none !important;
	}

	/* Prevent element manipulation in read-only mode */
	.bpmn-modeler-wrapper:not(.editable) :global(.djs-element) {
		pointer-events: none !important;
	}

	/* Allow canvas pan/zoom in read-only mode */
	.bpmn-modeler-wrapper:not(.editable) :global(.djs-container) {
		pointer-events: auto !important;
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
		display: block;
		border-right: 1px solid #ccc;
	}

	:global(.bpmn-modeler-wrapper.editable .djs-context-pad) {
		display: block;
	}

	/* Hide palette and context pad in readonly mode */
	:global(.bpmn-modeler-wrapper:not(.editable) .djs-palette) {
		display: none;
	}

	:global(.bpmn-modeler-wrapper:not(.editable) .djs-context-pad) {
		display: none;
	}
</style>
