<script lang="ts">
	import BpmnViewer from '$lib/components/BpmnViewer.svelte';
	import { exampleFlows } from '$lib/data/example-flows';
	import type { BPMNFlowDefinition } from '$lib/types/bpmn.types';
	import '$lib/styles/bpmn.css';
	import * as m from '$lib/paraglide/messages';

	type FlowKey = keyof typeof exampleFlows;

	// State
	let selectedFlow = $state<FlowKey>('simpleApproval');
	let currentFlow = $derived(exampleFlows[selectedFlow]);
	let viewer = $state<any>(null);

	// Change selected flow
	function selectFlow(flowKey: FlowKey) {
		selectedFlow = flowKey;
		currentFlow = exampleFlows[flowKey];
	}

	// Export functions
	async function handleExportXML() {
		if (!viewer) return;

		const xml = await viewer.exportXML();
		if (xml) {
			downloadFile(xml, `${selectedFlow}.bpmn`, 'application/xml');
		}
	}

	async function handleExportSVG() {
		if (!viewer) return;

		const svg = await viewer.exportSVG();
		if (svg) {
			downloadFile(svg, `${selectedFlow}.svg`, 'image/svg+xml');
		}
	}

	// Helper to download file
	function downloadFile(content: string, filename: string, mimeType: string) {
		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	// Zoom controls
	function zoomIn() {
		viewer?.setZoom(1.2);
	}

	function zoomOut() {
		viewer?.setZoom(0.8);
	}

	function zoomReset() {
		viewer?.zoomToFit();
	}
</script>

<div class="bpmn-page">
	<header class="page-header">
		<h1>{m.bpmn_title()}</h1>
		<p class="subtitle">{m.bpmn_subtitle()}</p>
	</header>

	<div class="content-wrapper">
		<!-- Sidebar -->
		<aside class="sidebar">
			<h2>{m.bpmn_exampleFlows()}</h2>

			<nav class="flow-nav">
				<button
					class="flow-button"
					class:active={selectedFlow === 'simpleApproval'}
					onclick={() => selectFlow('simpleApproval')}
				>
					<span class="flow-label">{m.bpmn_flows_simpleApproval_name()}</span>
					<span class="flow-description">{m.bpmn_flows_simpleApproval_description()}</span>
				</button>
				<button
					class="flow-button"
					class:active={selectedFlow === 'parallelProcessing'}
					onclick={() => selectFlow('parallelProcessing')}
				>
					<span class="flow-label">{m.bpmn_flows_parallelProcessing_name()}</span>
					<span class="flow-description">{m.bpmn_flows_parallelProcessing_description()}</span>
				</button>
				<button
					class="flow-button"
					class:active={selectedFlow === 'orderFulfillment'}
					onclick={() => selectFlow('orderFulfillment')}
				>
					<span class="flow-label">{m.bpmn_flows_orderFulfillment_name()}</span>
					<span class="flow-description">{m.bpmn_flows_orderFulfillment_description()}</span>
				</button>
			</nav>

			<div class="info-section">
				<h3>{m.bpmn_currentFlow()}</h3>
				<dl class="flow-stats">
					<div>
						<dt>{m.bpmn_name()}:</dt>
						<dd>{currentFlow.name}</dd>
					</div>
					<div>
						<dt>{m.bpmn_nodes()}:</dt>
						<dd>{currentFlow.nodes.length}</dd>
					</div>
					<div>
						<dt>{m.bpmn_connections()}:</dt>
						<dd>{currentFlow.connections.length}</dd>
					</div>
					{#if currentFlow.metadata?.version}
						<div>
							<dt>{m.bpmn_version()}:</dt>
							<dd>{currentFlow.metadata.version}</dd>
						</div>
					{/if}
				</dl>
			</div>
		</aside>

		<!-- Main viewer -->
		<main class="main-content">
			<div class="viewer-header">
				<h2>{currentFlow.name}</h2>

				<div class="controls">
					<div class="zoom-controls">
						<button class="control-btn" onclick={zoomIn} title={m.bpmn_zoomIn()}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<circle cx="11" cy="11" r="8"></circle>
								<path d="m21 21-4.35-4.35"></path>
								<line x1="11" y1="8" x2="11" y2="14"></line>
								<line x1="8" y1="11" x2="14" y2="11"></line>
							</svg>
						</button>
						<button class="control-btn" onclick={zoomReset} title={m.bpmn_zoomReset()}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<circle cx="11" cy="11" r="8"></circle>
								<path d="m21 21-4.35-4.35"></path>
							</svg>
						</button>
						<button class="control-btn" onclick={zoomOut} title={m.bpmn_zoomOut()}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<circle cx="11" cy="11" r="8"></circle>
								<path d="m21 21-4.35-4.35"></path>
								<line x1="8" y1="11" x2="14" y2="11"></line>
							</svg>
						</button>
					</div>

					<div class="export-controls">
						<button class="control-btn" onclick={handleExportXML} title={m.bpmn_exportXML()}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
								<polyline points="7 10 12 15 17 10"></polyline>
								<line x1="12" y1="15" x2="12" y2="3"></line>
							</svg>
							XML
						</button>
						<button class="control-btn" onclick={handleExportSVG} title={m.bpmn_exportSVG()}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
								<polyline points="7 10 12 15 17 10"></polyline>
								<line x1="12" y1="15" x2="12" y2="3"></line>
							</svg>
							SVG
						</button>
					</div>
				</div>
			</div>

			<div class="viewer-container">
				<BpmnViewer bind:this={viewer} flowDefinition={currentFlow} class="diagram-viewer" />
			</div>

			{#if currentFlow.metadata?.description}
				<div class="description">
					<p>{currentFlow.metadata.description}</p>
				</div>
			{/if}
		</main>
	</div>
</div>

<style>
	.bpmn-page {
		min-height: 100vh;
		background: linear-gradient(to bottom, #f8fafc, #e2e8f0);
	}

	.page-header {
		padding: 2rem;
		background: white;
		border-bottom: 1px solid #e2e8f0;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.page-header h1 {
		font-size: 2rem;
		font-weight: 700;
		color: #1e293b;
		margin: 0;
	}

	.subtitle {
		margin-top: 0.5rem;
		color: #64748b;
		font-size: 0.975rem;
	}

	.content-wrapper {
		display: grid;
		grid-template-columns: 320px 1fr;
		gap: 0;
		height: calc(100vh - 120px);
	}

	.sidebar {
		background: white;
		border-right: 1px solid #e2e8f0;
		padding: 1.5rem;
		overflow-y: auto;
	}

	.sidebar h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 1rem 0;
	}

	.flow-nav {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 2rem;
	}

	.flow-button {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
		padding: 0.875rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: white;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
	}

	.flow-button:hover {
		border-color: #3b82f6;
		background: #eff6ff;
	}

	.flow-button.active {
		border-color: #3b82f6;
		background: #dbeafe;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.flow-label {
		font-weight: 600;
		color: #1e293b;
		font-size: 0.925rem;
	}

	.flow-description {
		font-size: 0.75rem;
		color: #64748b;
		line-height: 1.3;
	}

	.info-section {
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e2e8f0;
	}

	.info-section h3 {
		font-size: 1rem;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 0.75rem 0;
	}

	.flow-stats {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 0;
	}

	.flow-stats div {
		display: grid;
		grid-template-columns: 100px 1fr;
		gap: 0.5rem;
	}

	.flow-stats dt {
		font-size: 0.875rem;
		color: #64748b;
		font-weight: 500;
	}

	.flow-stats dd {
		font-size: 0.875rem;
		color: #1e293b;
		margin: 0;
	}

	.main-content {
		display: flex;
		flex-direction: column;
		background: white;
		overflow: hidden;
	}

	.viewer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.viewer-header h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1e293b;
		margin: 0;
	}

	.controls {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.zoom-controls,
	.export-controls {
		display: flex;
		gap: 0.5rem;
	}

	.control-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.875rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: white;
		color: #475569;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.control-btn:hover {
		background: #f8fafc;
		border-color: #cbd5e1;
		color: #1e293b;
	}

	.viewer-container {
		flex: 1;
		overflow: hidden;
	}

	:global(.diagram-viewer) {
		height: 100% !important;
		border: none !important;
		border-radius: 0 !important;
	}

	.description {
		padding: 1rem 1.5rem;
		background: #f8fafc;
		border-top: 1px solid #e2e8f0;
		color: #64748b;
		font-size: 0.875rem;
	}

	.description p {
		margin: 0;
	}
</style>
