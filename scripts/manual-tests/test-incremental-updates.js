/**
 * Manual test for FASE 2: Incremental updates
 * Tests that diagram updates incrementally instead of full regeneration
 * when editing existing activities
 */

import { chromium } from '@playwright/test';

async function testIncrementalUpdates() {
	const browser = await chromium.launch({ headless: false });
	const page = await browser.newPage();

	// Enable console logging to see "Applied incremental updates successfully"
	page.on('console', (msg) => {
		if (msg.text().includes('incremental') || msg.text().includes('Detected changes')) {
			console.log(`[BROWSER] ${msg.text()}`);
		}
	});

	await page.goto('http://localhost:5173/bpmn/constructor');
	await page.waitForLoadState('networkidle');

	console.log('Setting up initial diagram...');

	// Clear localStorage first
	await page.evaluate(() => {
		localStorage.clear();
	});
	await page.reload();
	await page.waitForLoadState('networkidle');

	// Create 3 activities
	const nameInputs = page.locator('input[placeholder*="Nombre"]');
	const responsableInputs = page.locator('input[placeholder*="responsable"]');

	// Activity 1
	await nameInputs.nth(0).fill('Actividad Original');
	await responsableInputs.nth(0).fill('Juan Pérez');
	await page.waitForTimeout(500);

	// Add Activity 2
	await page.locator('button:has-text("Agregar")').first().click();
	await page.waitForTimeout(300);

	await nameInputs.nth(1).fill('Segunda Actividad');
	await responsableInputs.nth(1).fill('Juan Pérez');
	await page.waitForTimeout(500);

	// Add connection Act1 -> Act2
	const rows = page.locator('table tbody tr');
	const editBtn = rows.nth(0).locator('button.btn-edit');
	await editBtn.click();
	await page.waitForTimeout(500);

	const addBtn = page.locator('.connections-editor button.btn-add-small');
	await addBtn.click();
	await page.waitForTimeout(300);

	const select = page.locator('.connection-select').last();
	await select.selectOption('node_2');
	await page.waitForTimeout(300);

	const saveBtn = page.locator('.connections-editor button.btn-save');
	await saveBtn.click();
	await page.waitForTimeout(2000);

	console.log('\n=== INITIAL DIAGRAM CREATED ===');
	console.log('Now testing incremental updates...\n');

	// TEST 1: Change activity name (should use incremental update)
	console.log('TEST 1: Changing activity name...');
	await nameInputs.nth(0).clear();
	await nameInputs.nth(0).fill('Actividad Modificada');
	await page.waitForTimeout(2000);
	console.log('✓ Check browser console for "Applied incremental updates successfully"\n');

	// TEST 2: Change responsable (should use incremental update)
	console.log('TEST 2: Changing responsable...');
	await responsableInputs.nth(0).clear();
	await responsableInputs.nth(0).fill('María García');
	await page.waitForTimeout(2000);
	console.log('✓ Check browser console for "Applied incremental updates successfully"\n');

	// TEST 3: Remove connection (should use incremental update)
	console.log('TEST 3: Removing connection...');
	await editBtn.click();
	await page.waitForTimeout(500);

	const removeBtn = page.locator('.connections-editor button.btn-remove-small');
	await removeBtn.click();
	await page.waitForTimeout(300);

	await saveBtn.click();
	await page.waitForTimeout(2000);
	console.log('✓ Check browser console for "Applied incremental updates successfully"\n');

	// TEST 4: Add connection back (should use incremental update)
	console.log('TEST 4: Adding connection back...');
	await editBtn.click();
	await page.waitForTimeout(500);

	await addBtn.click();
	await page.waitForTimeout(300);

	await select.last().selectOption('node_2');
	await page.waitForTimeout(300);

	await saveBtn.click();
	await page.waitForTimeout(2000);
	console.log('✓ Check browser console for "Applied incremental updates successfully"\n');

	console.log('\n=== ALL TESTS COMPLETED ===');
	console.log('If you saw "Applied incremental updates successfully" for each test,');
	console.log('then FASE 2 is working correctly!');
	console.log('\nPress Ctrl+C to exit...');

	// Keep browser open
	await page.waitForTimeout(300000);

	await browser.close();
}

testIncrementalUpdates().catch(console.error);
