<script lang="ts">
	import type { BPMNNodeType } from '$lib/types/bpmn.types';
	import {
		NODE_TYPE_CATEGORIES,
		NODE_TYPE_ICONS,
		NODE_TYPE_LABELS
	} from '$lib/types/flow-table.types';

	interface Props {
		value: BPMNNodeType;
		onChange: (newType: BPMNNodeType) => void;
	}

	let { value, onChange }: Props = $props();
</script>

<select
	bind:value
	onchange={(e) => onChange(e.currentTarget.value as BPMNNodeType)}
	class="type-select"
>
	<optgroup label="📅 Eventos">
		{#each NODE_TYPE_CATEGORIES.events as type}
			<option value={type}>
				{NODE_TYPE_ICONS[type]}
				{NODE_TYPE_LABELS[type]}
			</option>
		{/each}
	</optgroup>

	<optgroup label="📋 Tareas">
		{#each NODE_TYPE_CATEGORIES.tasks as type}
			<option value={type}>
				{NODE_TYPE_ICONS[type]}
				{NODE_TYPE_LABELS[type]}
			</option>
		{/each}
	</optgroup>

	<optgroup label="◇ Compuertas">
		{#each NODE_TYPE_CATEGORIES.gateways as type}
			<option value={type}>
				{NODE_TYPE_ICONS[type]}
				{NODE_TYPE_LABELS[type]}
			</option>
		{/each}
	</optgroup>

	<optgroup label="📦 Otros">
		{#each NODE_TYPE_CATEGORIES.other as type}
			<option value={type}>
				{NODE_TYPE_ICONS[type]}
				{NODE_TYPE_LABELS[type]}
			</option>
		{/each}
	</optgroup>
</select>

<style>
	.type-select {
		width: 100%;
		padding: 0.375rem 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		background: white;
		cursor: pointer;
		transition: border-color 0.2s;
	}

	.type-select:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 1px #3b82f6;
	}

	.type-select option {
		padding: 0.25rem;
	}

	optgroup {
		font-weight: 600;
		color: #475569;
	}
</style>
