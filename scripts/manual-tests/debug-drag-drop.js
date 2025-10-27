// Debug drag & drop persistence issue
import { chromium } from '@playwright/test';

const url = 'http://localhost:5173/bpmn/constructor';

console.log('🔍 Debugging drag & drop persistence...\n');

const browser = await chromium.launch({ headless: false, slowMo: 500 });
const page = await browser.newPage();

// Capture console logs from the page
page.on('console', (msg) => {
	const type = msg.type();
	const text = msg.text();
	const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'log' ? '📝' : 'ℹ️';
	console.log(`${prefix} [Browser Console] ${text}`);
});

try {
	// Navigate to constructor
	await page.goto(url);
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(2000);

	console.log('✅ Page loaded\n');

	// Clear localStorage to start fresh
	await page.evaluate(() => {
		localStorage.clear();
		console.log('🧹 localStorage cleared');
	});
	await page.reload();
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(2000);

	console.log('📝 Step 1: Checking if diagram exists...');

	// Check if diagram is rendered
	const diagramExists = await page.evaluate(() => {
		const canvas = document.querySelector('.bpmn-container');
		const elements = canvas ? canvas.querySelectorAll('[data-element-id]') : [];
		console.log(`Found ${elements.length} BPMN elements`);
		return elements.length > 0;
	});

	if (!diagramExists) {
		console.log('❌ No diagram found! Stopping test.');
		await browser.close();
		process.exit(1);
	}

	console.log('✅ Diagram exists\n');

	console.log('📝 Step 2: Enabling edit mode...');
	const editToggle = page.locator('input[type="checkbox"]');
	await editToggle.check();
	await page.waitForTimeout(2000);

	console.log('✅ Edit mode enabled\n');

	console.log('📝 Step 3: Checking if change listener is attached...');
	await page.waitForTimeout(1000);

	console.log('\n📝 Step 4: Attempting to drag an element...');

	// Find the first BPMN shape (not a label or connection)
	const elementInfo = await page.evaluate(() => {
		const canvas = document.querySelector('.bpmn-container');
		if (!canvas) return null;

		const elements = canvas.querySelectorAll('[data-element-id]');
		for (const el of elements) {
			const id = el.getAttribute('data-element-id');
			const classList = Array.from(el.classList);

			// Look for shapes (tasks, events, etc.) but not labels or connections
			if (
				!classList.includes('djs-connection') &&
				!classList.includes('djs-label') &&
				classList.some((c) => c.includes('djs-shape'))
			) {
				const rect = el.getBoundingClientRect();
				console.log(`Found draggable element: ${id} at (${rect.left}, ${rect.top})`);
				return {
					id,
					x: rect.left + rect.width / 2,
					y: rect.top + rect.height / 2,
					width: rect.width,
					height: rect.height
				};
			}
		}
		return null;
	});

	if (!elementInfo) {
		console.log('❌ No draggable element found! Stopping test.');
		await browser.close();
		process.exit(1);
	}

	console.log(`✅ Found element: ${elementInfo.id}`);
	console.log(`   Position: (${elementInfo.x}, ${elementInfo.y})`);

	// Perform drag operation
	console.log('\n📝 Step 5: Dragging element 50px to the right...');
	await page.mouse.move(elementInfo.x, elementInfo.y);
	await page.mouse.down();
	await page.waitForTimeout(200);
	await page.mouse.move(elementInfo.x + 50, elementInfo.y, { steps: 10 });
	await page.waitForTimeout(200);
	await page.mouse.up();
	await page.waitForTimeout(2000);

	console.log('✅ Drag completed\n');

	console.log('📝 Step 6: Checking localStorage...');
	const storageContent = await page.evaluate(() => {
		const xml = localStorage.getItem('bpmn-constructor-xml');
		console.log('localStorage content:', xml ? `${xml.length} chars` : 'empty');
		return xml;
	});

	if (storageContent) {
		console.log(`✅ localStorage has XML (${storageContent.length} chars)\n`);
	} else {
		console.log('❌ localStorage is EMPTY - onChange is NOT being called!\n');
	}

	console.log('📝 Step 7: Reloading page to test persistence...');
	await page.reload();
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(3000);

	const restoredXml = await page.evaluate(() => {
		return localStorage.getItem('bpmn-constructor-xml');
	});

	if (restoredXml) {
		console.log('✅ XML persisted after reload\n');
	} else {
		console.log('❌ XML NOT persisted\n');
	}

	console.log('🔍 Test complete. Keeping browser open for 10 seconds...');
	await page.waitForTimeout(10000);
} catch (error) {
	console.error('❌ Test failed:', error);
} finally {
	await browser.close();
}
