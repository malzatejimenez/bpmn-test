<script lang="ts">
	type ViewMode = 'table' | 'split' | 'diagram';

	interface Props {
		viewMode: ViewMode;
	}

	let { viewMode = $bindable() }: Props = $props();
</script>

<div class="view-switcher">
	<button
		class:active={viewMode === 'table'}
		onclick={() => (viewMode = 'table')}
		title="Ver solo tabla (1)"
	>
		📝 Tabla
	</button>
	<button
		class:active={viewMode === 'split'}
		onclick={() => (viewMode = 'split')}
		title="Ver tabla y gráfica (2)"
	>
		🔀 Ambas
	</button>
	<button
		class:active={viewMode === 'diagram'}
		onclick={() => (viewMode = 'diagram')}
		title="Ver solo gráfica (3)"
	>
		📊 Gráfica
	</button>
</div>

<style>
	.view-switcher {
		display: inline-flex;
		background: #f1f5f9;
		border-radius: 0.5rem;
		padding: 0.25rem;
		gap: 0.25rem;
		margin-top: 1.5rem;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.view-switcher button {
		padding: 0.5rem 1.25rem;
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #64748b;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.view-switcher button.active {
		background: white;
		color: #3b82f6;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		transform: scale(1.02);
	}

	.view-switcher button:hover:not(.active) {
		color: #1e293b;
		background: rgba(255, 255, 255, 0.5);
	}

	.view-switcher button:active {
		transform: scale(0.98);
	}

	/* Keyboard shortcuts hint on hover */
	.view-switcher button:hover::after {
		content: attr(title);
		position: absolute;
		bottom: -2.5rem;
		left: 50%;
		transform: translateX(-50%);
		background: #1e293b;
		color: white;
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		white-space: nowrap;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.2s;
		z-index: 1000;
	}

	.view-switcher button:hover::after {
		opacity: 1;
	}

	.view-switcher button {
		position: relative;
	}
</style>
