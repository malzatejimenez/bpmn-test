<script lang="ts">
	interface Props {
		value: string;
		availableResponsables: string[];
		onChange: (value: string) => void;
		placeholder?: string;
	}

	let {
		value = '',
		availableResponsables,
		onChange,
		placeholder = 'Nombre del responsable'
	}: Props = $props();

	// Generate unique ID for datalist
	const datalistId = `responsables-${Math.random().toString(36).substr(2, 9)}`;

	function handleInput(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		onChange(target.value);
	}
</script>

<div class="responsable-autocomplete">
	<input
		type="text"
		{value}
		oninput={handleInput}
		{placeholder}
		list={datalistId}
		class="input-responsable"
		autocomplete="off"
	/>
	<datalist id={datalistId}>
		{#each availableResponsables as responsable}
			<option value={responsable}></option>
		{/each}
	</datalist>
</div>

<style>
	.responsable-autocomplete {
		position: relative;
		width: 100%;
	}

	.input-responsable {
		width: 100%;
		padding: 0.375rem 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		transition: border-color 0.2s;
		background-color: white;
	}

	.input-responsable:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 1px #3b82f6;
	}

	.input-responsable::placeholder {
		color: #cbd5e1;
	}

	/* Style for datalist suggestions */
	.input-responsable::-webkit-calendar-picker-indicator {
		display: none;
	}
</style>
