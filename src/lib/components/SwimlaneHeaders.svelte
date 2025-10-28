<script lang="ts">
	interface Swimlane {
		responsable: string;
		xPosition: number;
		width: number;
	}

	interface Props {
		swimlanes: Swimlane[];
		viewportX?: number;
		viewportScale?: number;
	}

	let { swimlanes, viewportX = 0, viewportScale = 1 }: Props = $props();
</script>

<div class="swimlane-columns">
	{#each swimlanes as lane}
		<div
			class="swimlane-column"
			style="left: {(lane.xPosition - viewportX) * viewportScale}px; width: {lane.width * viewportScale}px;"
		>
			<div class="column-header">
				<span class="responsable-icon">👤</span>
				<span class="responsable-name">{lane.responsable}</span>
			</div>
			<div class="column-border"></div>
		</div>
	{/each}
</div>

<style>
	.swimlane-columns {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 5;
	}

	.swimlane-column {
		position: absolute;
		top: 0;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.column-border {
		position: absolute;
		right: 0;
		top: 60px;
		bottom: 0;
		width: 2px;
		background: linear-gradient(to bottom, #cbd5e1 0%, rgba(203, 213, 225, 0.3) 100%);
	}

	.column-header {
		position: sticky;
		top: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.75rem 0.5rem;
		font-weight: 600;
		font-size: 0.875rem;
		color: #475569;
		background: linear-gradient(
			to bottom,
			rgba(248, 250, 252, 0.98) 0%,
			rgba(248, 250, 252, 0.95) 100%
		);
		border-bottom: 2px solid #cbd5e1;
		backdrop-filter: blur(8px);
		pointer-events: auto;
		z-index: 10;
		text-align: center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.responsable-icon {
		font-size: 1.25rem;
	}

	.responsable-name {
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		writing-mode: horizontal-tb;
	}
</style>
