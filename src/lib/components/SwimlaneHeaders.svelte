<script lang="ts">
	interface Swimlane {
		responsable: string;
		yPosition: number;
		height: number;
	}

	interface Props {
		swimlanes: Swimlane[];
	}

	let { swimlanes }: Props = $props();
</script>

<div class="swimlane-headers">
	{#each swimlanes as lane}
		<div
			class="swimlane-header"
			style="top: {lane.yPosition}px; height: {lane.height}px;"
		>
			<div class="header-content">
				<span class="responsable-icon">👤</span>
				<span class="responsable-name">{lane.responsable}</span>
			</div>
		</div>
	{/each}
</div>

<style>
	.swimlane-headers {
		position: absolute;
		left: 0;
		top: 0;
		width: 180px;
		height: 100%;
		pointer-events: none;
		z-index: 10;
	}

	.swimlane-header {
		position: absolute;
		left: 0;
		width: 100%;
		border-bottom: 2px solid #cbd5e1;
		background: linear-gradient(to right, rgba(248, 250, 252, 0.95) 0%, rgba(248, 250, 252, 0) 100%);
		display: flex;
		align-items: center;
		padding: 0.75rem;
		backdrop-filter: blur(4px);
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		font-size: 0.875rem;
		color: #475569;
		background: white;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		pointer-events: auto;
		white-space: nowrap;
	}

	.responsable-icon {
		font-size: 1rem;
	}

	.responsable-name {
		max-width: 120px;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
