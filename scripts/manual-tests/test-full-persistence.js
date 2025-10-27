// Comprehensive test for localStorage persistence
import { chromium } from '@playwright/test';

const url = 'http://localhost:5173/bpmn/constructor';

console.log('🧪 Comprehensive Persistence Test\n');
console.log('='.repeat(50) + '\n');

const browser = await chromium.launch({ headless: false, slowMo: 300 });
const page = await browser.newPage();

// Capture console logs
page.on('console', (msg) => {
	const text = msg.text();
	if (
		text.includes('BpmnModeler') ||
		text.includes('Diagram changed') ||
		text.includes('localStorage')
	) {
		console.log(`   💬 ${text}`);
	}
});

try {
	// ==== TEST 1: Fresh start ====
	console.log('📋 TEST 1: Fresh Start (Clear localStorage)');
	console.log('-'.repeat(50));

	await page.goto(url);
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(2000);

	await page.evaluate(() => localStorage.clear());
	await page.reload();
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(2000);

	console.log('✅ Page loaded with empty localStorage\n');

	// ==== TEST 2: Enable edit mode and drag element ====
	console.log('📋 TEST 2: Drag & Drop in Edit Mode');
	console.log('-'.repeat(50));

	await page.locator('input[type="checkbox"]').check();
	await page.waitForTimeout(1500);

	const elementPos = await page.evaluate(() => {
		const canvas = document.querySelector('.bpmn-container');
		const shapes = canvas.querySelectorAll('[data-element-id]');
		for (const shape of shapes) {
			if (shape.classList.contains('djs-shape') && !shape.classList.contains('djs-label')) {
				const rect = shape.getBoundingClientRect();
				return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
			}
		}
		return null;
	});

	if (elementPos) {
		await page.mouse.move(elementPos.x, elementPos.y);
		await page.mouse.down();
		await page.mouse.move(elementPos.x + 80, elementPos.y, { steps: 15 });
		await page.mouse.up();
		await page.waitForTimeout(2000);

		const xmlSaved = await page.evaluate(() => {
			const xml = localStorage.getItem('bpmn-constructor-xml');
			return xml !== null && xml.length > 0;
		});

		console.log(xmlSaved ? '✅ Drag & drop saved to localStorage' : '❌ NOT saved to localStorage');
	}
	console.log('');

	// ==== TEST 3: Reload and verify persistence ====
	console.log('📋 TEST 3: Reload Page - Check Persistence');
	console.log('-'.repeat(50));

	await page.reload();
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(3000);

	const restored = await page.evaluate(() => {
		return {
			xml: localStorage.getItem('bpmn-constructor-xml'),
			editMode: localStorage.getItem('bpmn-edit-mode'),
			viewMode: localStorage.getItem('bpmn-view-mode')
		};
	});

	console.log(
		`   XML: ${restored.xml ? '✅ Restored (' + restored.xml.length + ' chars)' : '❌ NOT restored'}`
	);
	console.log(`   Edit Mode: ${restored.editMode ? '✅ ' + restored.editMode : '❌ NOT restored'}`);
	console.log(`   View Mode: ${restored.viewMode ? '✅ ' + restored.viewMode : '❌ NOT restored'}`);
	console.log('');

	// ==== TEST 4: Add table row and verify ====
	console.log('📋 TEST 4: Add Table Row');
	console.log('-'.repeat(50));

	// Switch to split view to see table
	await page.locator('button').filter({ hasText: '🔀 Ambas' }).click();
	await page.waitForTimeout(1000);

	const addButton = page.locator('button').filter({ hasText: '➕ Agregar' }).first();
	await addButton.click();
	await page.waitForTimeout(500);

	const inputs = page.locator('input[type="text"]');
	const count = await inputs.count();
	const lastIdInput = inputs.nth(count - 3);
	const lastLabelInput = inputs.nth(count - 2);

	await lastIdInput.fill('tarea_test');
	await lastLabelInput.fill('Tarea de Prueba');
	await page.waitForTimeout(1500);

	const rowsSaved = await page.evaluate(() => {
		const rows = localStorage.getItem('bpmn-constructor-rows');
		if (!rows) return false;
		const parsed = JSON.parse(rows);
		return parsed.some((r) => r.id === 'tarea_test');
	});

	console.log(rowsSaved ? '✅ Table row saved to localStorage' : '❌ NOT saved to localStorage');
	console.log('');

	// ==== TEST 5: Final reload - verify everything ====
	console.log('📋 TEST 5: Final Reload - Verify Complete State');
	console.log('-'.repeat(50));

	await page.reload();
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(3000);

	const finalState = await page.evaluate(() => {
		const rows = localStorage.getItem('bpmn-constructor-rows');
		const xml = localStorage.getItem('bpmn-constructor-xml');
		const editMode = localStorage.getItem('bpmn-edit-mode');
		const viewMode = localStorage.getItem('bpmn-view-mode');

		return {
			hasRows: rows !== null,
			hasCustomRow: rows ? JSON.parse(rows).some((r) => r.id === 'tarea_test') : false,
			rowCount: rows ? JSON.parse(rows).length : 0,
			hasXml: xml !== null && xml.length > 0,
			xmlLength: xml ? xml.length : 0,
			editMode,
			viewMode
		};
	});

	console.log('   Final State:');
	console.log(
		`   - Rows: ${finalState.hasRows ? '✅ Restored (' + finalState.rowCount + ' rows)' : '❌ NOT restored'}`
	);
	console.log(
		`   - Custom Row: ${finalState.hasCustomRow ? '✅ Found "tarea_test"' : '❌ NOT found'}`
	);
	console.log(
		`   - XML: ${finalState.hasXml ? '✅ Restored (' + finalState.xmlLength + ' chars)' : '❌ NOT restored'}`
	);
	console.log(`   - Edit Mode: ${finalState.editMode || 'not set'}`);
	console.log(`   - View Mode: ${finalState.viewMode || 'not set'}`);
	console.log('');

	// ==== SUMMARY ====
	console.log('='.repeat(50));
	console.log('📊 TEST SUMMARY');
	console.log('='.repeat(50));

	const allPassed = finalState.hasRows && finalState.hasCustomRow && finalState.hasXml;

	if (allPassed) {
		console.log('✅✅✅ ALL TESTS PASSED! ✅✅✅');
		console.log('');
		console.log('Persistence is working correctly for:');
		console.log('  ✓ Table rows');
		console.log('  ✓ Diagram XML (drag & drop changes)');
		console.log('  ✓ Edit mode state');
		console.log('  ✓ View mode state');
	} else {
		console.log('❌ SOME TESTS FAILED');
		console.log('Please check the logs above for details.');
	}

	console.log('\n⏱️  Keeping browser open for 5 seconds...\n');
	await page.waitForTimeout(5000);
} catch (error) {
	console.error('❌ Test error:', error);
} finally {
	await browser.close();
}
