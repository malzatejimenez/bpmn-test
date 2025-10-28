<script lang="ts">
	type ViewMode = 'table' | 'split' | 'diagram';

	interface Props {
		viewMode: ViewMode;
	}

	let { viewMode = $bindable() }: Props = $props();
</script>

<div class="floating-view-switcher">
	<button
		class="view-btn"
		class:active={viewMode === 'table'}
		onclick={() => (viewMode = 'table')}
		title="Ver solo tabla"
		aria-label="Ver solo tabla"
	>
		📝
	</button>
	<button
		class="view-btn"
		class:active={viewMode === 'split'}
		onclick={() => (viewMode = 'split')}
		title="Ver tabla y gráfica"
		aria-label="Ver tabla y gráfica"
	>
		🔀
	</button>
	<button
		class="view-btn"
		class:active={viewMode === 'diagram'}
		onclick={() => (viewMode = 'diagram')}
		title="Ver solo gráfica"
		aria-label="Ver solo gráfica"
	>
		📊
	</button>
</div>

<style>
	.floating-view-switcher {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 1000;
		display: flex;
		gap: 0.5rem;
		padding: 0.5rem;
		background: white;
		border-radius: 1rem;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.08),
			0 2px 8px rgba(0, 0, 0, 0.04);
		border: 1px solid #e2e8f0;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.floating-view-switcher:hover {
		box-shadow:
			0 12px 48px rgba(0, 0, 0, 0.12),
			0 4px 12px rgba(0, 0, 0, 0.06);
		transform: translateY(-2px);
	}

	.view-btn {
		width: 2.75rem;
		height: 2.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		border-radius: 0.75rem;
		font-size: 1.25rem;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		color: #64748b;
	}

	.view-btn::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.05));
		border-radius: 0.75rem;
		opacity: 0;
		transition: opacity 0.2s;
	}

	.view-btn:hover {
		transform: scale(1.08);
		color: #3b82f6;
	}

	.view-btn:hover::before {
		opacity: 1;
	}

	.view-btn.active {
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		color: white;
		box-shadow:
			0 4px 12px rgba(59, 130, 246, 0.3),
			0 2px 4px rgba(59, 130, 246, 0.2);
		transform: scale(1.05);
	}

	.view-btn.active::before {
		opacity: 0;
	}

	.view-btn:active {
		transform: scale(0.95);
	}

	/* Tooltip */
	.view-btn::after {
		content: attr(title);
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-bottom: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: #1e293b;
		color: white;
		font-size: 0.75rem;
		white-space: nowrap;
		border-radius: 0.5rem;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.2s;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.view-btn:hover::after {
		opacity: 1;
	}

	/* Responsive: smaller on mobile */
	@media (max-width: 640px) {
		.floating-view-switcher {
			bottom: 1rem;
			right: 1rem;
			padding: 0.375rem;
			gap: 0.375rem;
		}

		.view-btn {
			width: 2.25rem;
			height: 2.25rem;
			font-size: 1rem;
		}
	}
</style>
