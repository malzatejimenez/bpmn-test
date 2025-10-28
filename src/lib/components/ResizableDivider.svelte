<script lang="ts">
	import { browser } from '$app/environment';

	interface Props {
		onResize?: (width: number) => void;
	}

	let { onResize }: Props = $props();

	let isDragging = $state(false);
	let isHovering = $state(false);

	function handleMouseDown(e: MouseEvent) {
		e.preventDefault();
		isDragging = true;
		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';

		// Add listeners to document for smooth dragging
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging || !browser) return;

		// Calculate percentage based on viewport width
		const containerWidth = window.innerWidth - 32; // minus padding (1rem * 2)
		const leftWidth = ((e.clientX - 16) / containerWidth) * 100; // minus left padding

		// Clamp between 30% and 70%
		const clampedWidth = Math.max(30, Math.min(70, leftWidth));

		onResize?.(clampedWidth);
	}

	function handleMouseUp() {
		isDragging = false;
		document.body.style.cursor = '';
		document.body.style.userSelect = '';

		// Remove listeners
		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', handleMouseUp);
	}

	function handleDoubleClick() {
		// Reset to 50/50
		onResize?.(50);
	}

	function handleMouseEnter() {
		isHovering = true;
	}

	function handleMouseLeave() {
		if (!isDragging) {
			isHovering = false;
		}
	}
</script>

<div
	class="resizable-divider"
	class:dragging={isDragging}
	class:hovering={isHovering}
	role="separator"
	aria-orientation="vertical"
	aria-label="Divisor redimensionable"
	onmousedown={handleMouseDown}
	ondblclick={handleDoubleClick}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
>
	<div class="grip">
		<span></span>
		<span></span>
		<span></span>
	</div>
</div>

<style>
	.resizable-divider {
		width: 8px;
		height: 100%;
		background: #e2e8f0;
		cursor: col-resize;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: background-color 0.2s ease;
		user-select: none;
	}

	.resizable-divider:hover,
	.resizable-divider.hovering {
		background: #cbd5e1;
	}

	.resizable-divider.dragging,
	.resizable-divider:active {
		background: #3b82f6;
	}

	.grip {
		display: flex;
		gap: 2px;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.grip span {
		width: 2px;
		height: 24px;
		background: rgba(100, 116, 139, 0.4);
		border-radius: 1px;
		transition: background-color 0.2s ease;
	}

	.resizable-divider:hover .grip span,
	.resizable-divider.hovering .grip span {
		background: rgba(71, 85, 105, 0.6);
	}

	.resizable-divider.dragging .grip span,
	.resizable-divider:active .grip span {
		background: rgba(255, 255, 255, 0.9);
	}

	/* Increase hit area for easier grabbing */
	.resizable-divider::before {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		left: -4px;
		right: -4px;
		cursor: col-resize;
	}
</style>
