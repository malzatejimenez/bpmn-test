// Test localStorage persistence for BPMN constructor
import { chromium } from '@playwright/test';

const url = 'http://localhost:5173/bpmn/constructor';

console.log('🧪 Testing localStorage persistence...\n');

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

try {
	// Navigate to constructor
	await page.goto(url);
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(2000);

	console.log('✅ Page loaded\n');

	// Step 1: Clear localStorage to start fresh
	await page.evaluate(() => {
		localStorage.clear();
	});
	await page.reload();
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(1500);

	console.log('📝 Step 1: Starting with fresh state...');

	// Step 2: Add a new row to the table
	console.log('📝 Step 2: Adding a new activity to the table...');
	const addButton = page.locator('button').filter({ hasText: '➕ Agregar' }).first();
	await addButton.click();
	await page.waitForTimeout(500);

	// Fill in the new row
	const inputs = page.locator('input[type="text"]');
	const lastIdInput = inputs.nth(-3); // ID input
	const lastLabelInput = inputs.nth(-2); // Label input

	await lastIdInput.fill('task1');
	await lastLabelInput.fill('Mi Primera Tarea');
	await page.waitForTimeout(500);

	console.log('   ✅ Added activity: "Mi Primera Tarea"\n');

	// Step 3: Switch to edit mode and make changes to diagram
	console.log('📝 Step 3: Switching to edit mode...');
	const editToggle = page.locator('input[type="checkbox"]');
	await editToggle.check();
	await page.waitForTimeout(1000);

	console.log('   ✅ Edit mode enabled\n');

	// Step 4: Switch view mode to "Solo Gráfica"
	console.log('📝 Step 4: Switching to diagram-only view...');
	const diagramButton = page.locator('button').filter({ hasText: '📊 Gráfica' });
	await diagramButton.click();
	await page.waitForTimeout(1000);

	console.log('   ✅ View mode changed to diagram-only\n');

	// Step 5: Check what's in localStorage
	console.log('💾 Step 5: Checking localStorage content...');
	const storageData = await page.evaluate(() => {
		return {
			rows: localStorage.getItem('bpmn-constructor-rows'),
			xml: localStorage.getItem('bpmn-constructor-xml'),
			viewMode: localStorage.getItem('bpmn-view-mode'),
			editMode: localStorage.getItem('bpmn-edit-mode')
		};
	});

	console.log('   📦 Stored data:');
	console.log(`   - Rows: ${storageData.rows ? 'Found (' + JSON.parse(storageData.rows).length + ' rows)' : 'Not found'}`);
	console.log(`   - XML: ${storageData.xml ? 'Found (' + storageData.xml.length + ' chars)' : 'Not found'}`);
	console.log(`   - View Mode: ${storageData.viewMode || 'Not found'}`);
	console.log(`   - Edit Mode: ${storageData.editMode || 'Not found'}\n`);

	// Step 6: Reload the page
	console.log('🔄 Step 6: Reloading page to test persistence...');
	await page.reload();
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(2000);

	// Step 7: Verify data was restored
	console.log('✅ Step 7: Verifying restored data...\n');

	// Check view mode
	const diagramButtonActive = await page.locator('button').filter({ hasText: '📊 Gráfica' }).evaluate((el) => {
		return el.classList.contains('active');
	});
	console.log(`   - View Mode (diagram-only): ${diagramButtonActive ? '✅ RESTORED' : '❌ NOT RESTORED'}`);

	// Check edit mode
	const editModeChecked = await page.locator('input[type="checkbox"]').isChecked();
	console.log(`   - Edit Mode: ${editModeChecked ? '✅ RESTORED' : '❌ NOT RESTORED'}`);

	// Switch back to split view to check table
	await page.locator('button').filter({ hasText: '🔀 Ambas' }).click();
	await page.waitForTimeout(500);

	// Check if our custom row exists
	const taskInput = page.locator('input[value="Mi Primera Tarea"]');
	const taskExists = await taskInput.count() > 0;
	console.log(`   - Table Data: ${taskExists ? '✅ RESTORED' : '❌ NOT RESTORED'}`);

	// Check if diagram has elements
	const diagramElements = await page.evaluate(() => {
		const canvas = document.querySelector('.bpmn-container');
		if (!canvas) return 0;
		const elements = canvas.querySelectorAll('[data-element-id]');
		return elements.length;
	});
	console.log(`   - Diagram: ${diagramElements > 0 ? `✅ RESTORED (${diagramElements} elements)` : '❌ NOT RESTORED'}`);

	console.log('\n🎉 Persistence test completed!');

	if (diagramButtonActive && editModeChecked && taskExists && diagramElements > 0) {
		console.log('✅ ALL DATA PERSISTED SUCCESSFULLY\n');
	} else {
		console.log('⚠️ SOME DATA WAS NOT PERSISTED CORRECTLY\n');
	}

} catch (error) {
	console.error('❌ Test failed:', error);
} finally {
	await page.waitForTimeout(3000);
	await browser.close();
}
