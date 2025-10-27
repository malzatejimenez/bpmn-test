<script lang="ts">
	interface Props {
		open: boolean;
		title: string;
		description: string;
		confirmText?: string;
		cancelText?: string;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let {
		open = $bindable(),
		title,
		description,
		confirmText = 'Confirmar',
		cancelText = 'Cancelar',
		onConfirm,
		onCancel
	}: Props = $props();

	function handleConfirm() {
		onConfirm();
		open = false;
	}

	function handleCancel() {
		onCancel();
		open = false;
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleCancel();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleCancel();
		}
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="dialog-title"
		tabindex="-1"
	>
		<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
			<h2 id="dialog-title" class="mb-2 text-lg font-semibold text-gray-900">
				{title}
			</h2>
			<p class="mb-6 text-sm text-gray-600">
				{description}
			</p>
			<div class="flex justify-end gap-3">
				<button
					type="button"
					class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
					onclick={handleCancel}
				>
					{cancelText}
				</button>
				<button
					type="button"
					class="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
					onclick={handleConfirm}
				>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}
