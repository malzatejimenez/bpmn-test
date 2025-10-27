/**
 * Manual test for improved waypoint routing
 * Tests three scenarios:
 * 1. Vertical direct connection (Act1 -> Act2 in same column)
 * 2. Vertical with obstacle (Act1 -> Act3, skipping Act2 in same column)
 * 3. Horizontal/diagonal connection (Act1 -> Act4 in different column)
 */

import { chromium } from '@playwright/test';

async function testWaypointRouting() {
	const browser = await chromium.launch({ headless: false });
	const page = await browser.newPage();

	await page.goto('http://localhost:5173/bpmn/constructor');
	await page.waitForLoadState('networkidle');

	console.log('Setting up test scenario...');

	// Clear localStorage first
	await page.evaluate(() => {
		localStorage.clear();
	});
	await page.reload();
	await page.waitForLoadState('networkidle');

	// Fill activities with same responsable in same column
	const nameInputs = page.locator('input[placeholder*="Nombre"]');
	const responsableInputs = page.locator('input[placeholder*="responsable"]');

	// Activity 1
	await nameInputs.nth(0).fill('Actividad 1');
	await responsableInputs.nth(0).fill('Juan Pérez');
	await page.waitForTimeout(300);

	// Add Activity 2
	await page.locator('button').filter({ hasText: /Agregar|Add/ }).first().click();
	await page.waitForTimeout(300);

	await nameInputs.nth(1).fill('Actividad 2');
	await responsableInputs.nth(1).fill('Juan Pérez');
	await page.waitForTimeout(300);

	// Add Activity 3
	await page.locator('button').filter({ hasText: /Agregar|Add/ }).first().click();
	await page.waitForTimeout(300);

	await nameInputs.nth(2).fill('Actividad 3');
	await responsableInputs.nth(2).fill('Juan Pérez');
	await page.waitForTimeout(300);

	// Add Activity 4 in different column
	await page.locator('button').filter({ hasText: /Agregar|Add/ }).first().click();
	await page.waitForTimeout(300);

	await nameInputs.nth(3).fill('Actividad 4');
	await responsableInputs.nth(3).fill('María García');
	await page.waitForTimeout(300);

	console.log('Setting up connections...');

	// Get all rows
	const rows = page.locator('table tbody tr');

	// Helper function to add a connection
	async function addConnection(rowIndex, targetActivityId) {
		// Click the edit button (✏️) for the specified row
		const editBtn = rows.nth(rowIndex).locator('button.btn-edit');
		await editBtn.click();
		await page.waitForTimeout(500);

		// Click "Agregar" inside the dialog
		const addBtn = page.locator('.connections-editor button.btn-add-small');
		await addBtn.click();
		await page.waitForTimeout(300);

		// Select target from dropdown
		const select = page.locator('.connection-select').last();
		await select.selectOption(targetActivityId);
		await page.waitForTimeout(300);

		// Click "Guardar" to save connections
		const saveBtn = page.locator('.connections-editor button.btn-save');
		await saveBtn.click();
		await page.waitForTimeout(500);
	}

	// CONNECTION 1: Act1 -> Act2 (vertical direct)
	console.log('Creating connection: Act1 -> Act2');
	await addConnection(0, 'node_2'); // Row 0 (Act1) -> node_2 (Act2)

	// CONNECTION 2: Act1 -> Act3 (vertical with obstacle Act2)
	console.log('Creating connection: Act1 -> Act3');
	await addConnection(0, 'node_3'); // Row 0 (Act1) -> node_3 (Act3)

	// CONNECTION 3: Act1 -> Act4 (horizontal/diagonal to different column)
	console.log('Creating connection: Act1 -> Act4');
	await addConnection(0, 'node_4'); // Row 0 (Act1) -> node_4 (Act4)

	console.log('Waiting for diagram to auto-generate...');

	// The diagram auto-generates, just wait for it to render
	await page.waitForTimeout(3000);

	console.log('\n=== TEST RESULTS ===');
	console.log('Check the diagram for the following:');
	console.log('1. Act1 -> Act2 should be a STRAIGHT VERTICAL line (no obstacles)');
	console.log('2. Act1 -> Act3 should ROUTE AROUND Act2 (with obstacle)');
	console.log('3. Act1 -> Act4 should use clean MANHATTAN routing (horizontal/diagonal)');
	console.log('\nPress Ctrl+C in the terminal when done inspecting...');

	// Keep browser open for inspection
	await page.waitForTimeout(300000); // 5 minutes

	await browser.close();
}

testWaypointRouting().catch(console.error);
