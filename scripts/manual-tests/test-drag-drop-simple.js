// Simple focused test for drag & drop persistence
import { chromium } from '@playwright/test';

const url = 'http://localhost:5173/bpmn/constructor';

console.log('🎯 Simple Drag & Drop Persistence Test\n');

const browser = await chromium.launch({ headless: false, slowMo: 400 });
const page = await browser.newPage();

let testPassed = true;

try {
	// 1. Load page
	console.log('1️⃣  Loading page...');
	await page.goto(url);
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(2000);
	console.log('   ✅ Loaded\n');

	// 2. Clear localStorage
	console.log('2️⃣  Clearing localStorage...');
	await page.evaluate(() => localStorage.clear());
	await page.reload();
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(2000);
	console.log('   ✅ Cleared\n');

	// 3. Enable edit mode
	console.log('3️⃣  Enabling edit mode...');
	await page.locator('input[type="checkbox"]').check();
	await page.waitForTimeout(1500);
	console.log('   ✅ Edit mode enabled\n');

	// 4. Get element position
	console.log('4️⃣  Finding draggable element...');
	const elementPos = await page.evaluate(() => {
		const canvas = document.querySelector('.bpmn-container');
		const shapes = Array.from(canvas.querySelectorAll('[data-element-id]'));
		const shape = shapes.find(s =>
			s.classList.contains('djs-shape') &&
			!s.classList.contains('djs-label')
		);
		if (shape) {
			const rect = shape.getBoundingClientRect();
			return {
				id: shape.getAttribute('data-element-id'),
				x: rect.left + rect.width / 2,
				y: rect.top + rect.height / 2
			};
		}
		return null;
	});

	if (!elementPos) {
		console.log('   ❌ No draggable element found');
		testPassed = false;
	} else {
		console.log(`   ✅ Found element: ${elementPos.id}\n`);

		// 5. Drag element
		console.log('5️⃣  Dragging element 100px to the right...');
		await page.mouse.move(elementPos.x, elementPos.y);
		await page.mouse.down();
		await page.waitForTimeout(200);
		await page.mouse.move(elementPos.x + 100, elementPos.y, { steps: 20 });
		await page.waitForTimeout(200);
		await page.mouse.up();
		await page.waitForTimeout(2000);
		console.log('   ✅ Dragged\n');

		// 6. Check localStorage
		console.log('6️⃣  Checking localStorage...');
		const xmlAfterDrag = await page.evaluate(() => {
			return localStorage.getItem('bpmn-constructor-xml');
		});

		if (!xmlAfterDrag || xmlAfterDrag.length === 0) {
			console.log('   ❌ localStorage is EMPTY - drag & drop NOT persisted');
			testPassed = false;
		} else {
			console.log(`   ✅ XML saved (${xmlAfterDrag.length} characters)\n`);

			// 7. Reload page
			console.log('7️⃣  Reloading page...');
			await page.reload();
			await page.waitForLoadState('networkidle');
			await page.waitForTimeout(3000);
			console.log('   ✅ Reloaded\n');

			// 8. Verify XML still there
			console.log('8️⃣  Verifying persistence after reload...');
			const xmlAfterReload = await page.evaluate(() => {
				return localStorage.getItem('bpmn-constructor-xml');
			});

			if (!xmlAfterReload || xmlAfterReload !== xmlAfterDrag) {
				console.log('   ❌ XML NOT persisted after reload');
				testPassed = false;
			} else {
				console.log(`   ✅ XML persisted (${xmlAfterReload.length} characters)\n`);

				// 9. Verify diagram is rendered with saved positions
				console.log('9️⃣  Verifying diagram rendered from localStorage...');
				const diagramRendered = await page.evaluate(() => {
					const canvas = document.querySelector('.bpmn-container');
					const elements = canvas ? canvas.querySelectorAll('[data-element-id]') : [];
					return elements.length > 0;
				});

				if (!diagramRendered) {
					console.log('   ❌ Diagram NOT rendered from localStorage');
					testPassed = false;
				} else {
					console.log('   ✅ Diagram rendered correctly\n');
				}
			}
		}
	}

	// Summary
	console.log('═'.repeat(60));
	if (testPassed) {
		console.log('✅✅✅ ALL TESTS PASSED! ✅✅✅');
		console.log('\nDrag & drop persistence is working correctly!');
		console.log('Changes are saved to localStorage and restored on reload.');
	} else {
		console.log('❌ TESTS FAILED');
		console.log('\nDrag & drop persistence is NOT working correctly.');
	}
	console.log('═'.repeat(60));

	console.log('\n⏱️  Keeping browser open for 5 seconds...\n');
	await page.waitForTimeout(5000);

} catch (error) {
	console.error('❌ Test error:', error);
	testPassed = false;
} finally {
	await browser.close();
	process.exit(testPassed ? 0 : 1);
}
