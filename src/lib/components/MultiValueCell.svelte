<script lang="ts">
	interface Props {
		values?: string[];
		placeholder?: string;
		onChange: (values: string[]) => void;
	}

	let { values = [], placeholder = 'Agregar valor', onChange }: Props = $props();

	let isEditing = $state(false);
	let editingValues = $state<string[]>([]);
	let editButton = $state<HTMLButtonElement | undefined>(undefined);
	let editorPosition = $state({ top: 0, left: 0 });

	// Add new value
	function addValue() {
		editingValues = [...editingValues, ''];
	}

	// Remove value
	function removeValue(index: number) {
		editingValues = editingValues.filter((_, i) => i !== index);
	}

	// Update value
	function updateValue(index: number, value: string) {
		editingValues = editingValues.map((v, i) => (i === index ? value : v));
	}

	// Start editing
	function startEdit() {
		editingValues = JSON.parse(JSON.stringify(values));

		// Calculate position for the editor dialog
		if (editButton) {
			const rect = editButton.getBoundingClientRect();
			const viewportHeight = window.innerHeight;
			const viewportWidth = window.innerWidth;

			// Preferred position: below the button
			let top = rect.bottom + 4;
			let left = rect.left - 100;

			// Ensure dialog doesn't go off-screen horizontally
			const dialogWidth = 350;
			if (left + dialogWidth > viewportWidth) {
				left = viewportWidth - dialogWidth - 16;
			}
			if (left < 16) {
				left = 16;
			}

			// Ensure dialog doesn't go off-screen vertically
			const estimatedDialogHeight = 250;
			if (top + estimatedDialogHeight > viewportHeight) {
				top = rect.top - estimatedDialogHeight - 4;
				if (top < 16) {
					top = 16;
				}
			}

			editorPosition = { top, left };
		}

		isEditing = true;
	}

	// Cancel editing
	function cancel() {
		isEditing = false;
		editingValues = [];
	}

	// Save changes
	function save() {
		// Filter out empty values
		const validValues = editingValues.filter((v) => v.trim() !== '');
		onChange(validValues);
		isEditing = false;
		editingValues = [];
	}
</script>

<div class="multi-value-cell">
	{#if !isEditing}
		<!-- Display mode -->
		<div class="values-display">
			{#if values.length === 0}
				<span class="no-values">—</span>
			{:else}
				<div class="value-tags">
					{#each values as value}
						<span class="value-tag" title={value}>
							{value}
						</span>
					{/each}
				</div>
			{/if}

			<button bind:this={editButton} onclick={startEdit} class="btn-edit" title="Editar valores"
				>✏️</button
			>
		</div>
	{:else}
		<!-- Edit mode backdrop -->
		<div
			class="editor-backdrop"
			onclick={cancel}
			onkeydown={(e) => e.key === 'Escape' && cancel()}
			role="button"
			tabindex="-1"
			aria-label="Cerrar editor"
		></div>

		<!-- Edit mode dialog -->
		<div class="values-editor" style="top: {editorPosition.top}px; left: {editorPosition.left}px;">
			<div class="editor-header">
				<span class="editor-title">{placeholder}</span>
				<button onclick={addValue} class="btn-add-small">+ Agregar</button>
			</div>

			<div class="values-list">
				{#each editingValues as value, index}
					<div class="value-row">
						<input
							type="text"
							bind:value={editingValues[index]}
							oninput={(e) => updateValue(index, e.currentTarget.value)}
							placeholder={placeholder}
							class="value-input"
						/>

						<button
							onclick={() => removeValue(index)}
							class="btn-remove-small"
							title="Eliminar"
						>
							×
						</button>
					</div>
				{/each}

				{#if editingValues.length === 0}
					<p class="no-values-editing">Sin valores. Click en "+ Agregar" para crear uno.</p>
				{/if}
			</div>

			<div class="editor-actions">
				<button onclick={cancel} class="btn-cancel">Cancelar</button>
				<button onclick={save} class="btn-save">Guardar</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.multi-value-cell {
		position: relative;
		min-height: 36px;
	}

	/* Display mode */
	.values-display {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.no-values {
		color: #cbd5e1;
		font-style: italic;
	}

	.value-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		flex: 1;
	}

	.value-tag {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.5rem;
		background: #e0e7ff;
		color: #4338ca;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
		max-width: 150px;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.btn-edit {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.875rem;
		padding: 0.25rem;
		opacity: 0.5;
		transition: opacity 0.2s;
		flex-shrink: 0;
	}

	.btn-edit:hover {
		opacity: 1;
	}

	/* Backdrop overlay */
	.editor-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.3);
		z-index: 999;
		cursor: pointer;
	}

	/* Edit mode */
	.values-editor {
		position: fixed;
		background: white;
		border: 2px solid #6366f1;
		border-radius: 0.375rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
		z-index: 1000;
		padding: 0.75rem;
		width: 350px;
		max-height: calc(100vh - 32px);
		overflow-y: auto;
	}

	.editor-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.editor-title {
		font-weight: 600;
		color: #1e293b;
		font-size: 0.875rem;
	}

	.btn-add-small {
		padding: 0.25rem 0.5rem;
		background: #6366f1;
		color: white;
		border: none;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		cursor: pointer;
		font-weight: 500;
	}

	.btn-add-small:hover {
		background: #4f46e5;
	}

	.values-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		max-height: 250px;
		overflow-y: auto;
	}

	.value-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.value-input {
		flex: 1;
		padding: 0.375rem 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.25rem;
		font-size: 0.75rem;
	}

	.value-input:focus {
		outline: none;
		border-color: #6366f1;
	}

	.value-input::placeholder {
		color: #cbd5e1;
		font-style: italic;
	}

	.btn-remove-small {
		background: #ef4444;
		color: white;
		border: none;
		border-radius: 0.25rem;
		width: 24px;
		height: 24px;
		cursor: pointer;
		font-size: 1.125rem;
		line-height: 1;
		flex-shrink: 0;
	}

	.btn-remove-small:hover {
		background: #dc2626;
	}

	.no-values-editing {
		color: #94a3b8;
		font-size: 0.75rem;
		text-align: center;
		padding: 1rem;
		margin: 0;
	}

	.editor-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid #e2e8f0;
	}

	.btn-cancel,
	.btn-save {
		padding: 0.375rem 0.75rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
	}

	.btn-cancel {
		background: #f1f5f9;
		color: #475569;
	}

	.btn-cancel:hover {
		background: #e2e8f0;
	}

	.btn-save {
		background: #6366f1;
		color: white;
	}

	.btn-save:hover {
		background: #4f46e5;
	}
</style>
