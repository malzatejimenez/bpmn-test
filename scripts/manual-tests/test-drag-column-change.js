/**
 * Manual test for drag-to-change-column functionality
 * Tests that dragging an activity to a different column updates the responsable in the table
 */

import { chromium } from '@playwright/test';

async function testDragColumnChange() {
	const browser = await chromium.launch({ headless: false });
	const page = await browser.newPage();

	// Enable console logging
	page.on('console', (msg) => {
		const text = msg.text();
		if (
			text.includes('Element moved') ||
			text.includes('Column change') ||
			text.includes('Responsable updated')
		) {
			console.log(`[BROWSER] ${text}`);
		}
	});

	await page.goto('http://localhost:5173/bpmn/constructor');
	await page.waitForLoadState('networkidle');

	console.log('Clearing localStorage and reloading...');
	await page.evaluate(() => {
		localStorage.clear();
	});
	await page.reload();
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(1000);

	console.log('\n=== Creating test scenario ===');

	// Create Activity 1 with Juan Pérez
	const nameInputs = page.locator('input[placeholder*="Nombre"]');
	const responsableInputs = page.locator('input[placeholder*="responsable"]');

	console.log('Creating Activity 1: Tarea A (Juan Pérez)');
	await nameInputs.nth(0).fill('Tarea A');
	await responsableInputs.nth(0).fill('Juan Pérez');
	await page.waitForTimeout(500);

	// Add Activity 2
	await page.locator('button:has-text("Agregar")').first().click();
	await page.waitForTimeout(300);

	console.log('Creating Activity 2: Tarea B (María García)');
	await nameInputs.nth(1).fill('Tarea B');
	await responsableInputs.nth(1).fill('María García');
	await page.waitForTimeout(2000); // Wait for diagram to generate

	console.log('\n=== Enabling edit mode ===');
	// Enable edit mode
	const editCheckbox = page.locator('input[type="checkbox"]').first();
	await editCheckbox.check();
	await page.waitForTimeout(1000);

	console.log('\n=== Dragging Tarea A to María García column ===');

	// Get the bounding box of "Tarea A" element in the diagram
	// Since we can't easily select SVG elements by text, we'll use the canvas and calculate positions
	const canvas = page.locator('.bpmn-modeler-wrapper canvas').first();
	await canvas.waitFor({ state: 'visible' });

	// Get canvas bounding box
	const canvasBox = await canvas.boundingBox();
	if (!canvasBox) {
		throw new Error('Canvas not found');
	}

	console.log('Canvas position:', canvasBox);

	// Based on auto-layout, activities should be positioned at:
	// Column 1 (Juan Pérez): X ≈ 100 + 150 = 250 (center of column 0-300)
	// Column 2 (María García): X ≈ 400 + 150 = 550 (center of column 300-600)
	// Y positions: Activity 1 at Y ≈ 100, Activity 2 at Y ≈ 250

	// Position of "Tarea A" (in Juan Pérez column)
	const tareaAX = canvasBox.x + 250;
	const tareaAY = canvasBox.y + 140; // Center of the task

	// Target position in María García column
	const targetX = canvasBox.x + 550;
	const targetY = canvasBox.y + 140; // Same Y level

	console.log(`Dragging from (${tareaAX}, ${tareaAY}) to (${targetX}, ${targetY})`);

	// Perform drag and drop
	await page.mouse.move(tareaAX, tareaAY);
	await page.mouse.down();
	await page.waitForTimeout(200);

	// Move in steps to simulate realistic drag
	const steps = 10;
	for (let i = 1; i <= steps; i++) {
		const x = tareaAX + ((targetX - tareaAX) * i) / steps;
		const y = tareaAY + ((targetY - tareaAY) * i) / steps;
		await page.mouse.move(x, y);
		await page.waitForTimeout(20);
	}

	await page.mouse.up();
	await page.waitForTimeout(2000); // Wait for updates

	console.log('\n=== Verifying results ===');

	// Check the table to see if responsable changed
	const rows = page.locator('table tbody tr');
	const firstRowResponsable = rows.nth(0).locator('input[placeholder*="responsable"]');
	const responsableValue = await firstRowResponsable.inputValue();

	console.log(`\nResponsable in table for "Tarea A": "${responsableValue}"`);

	if (responsableValue === 'María García') {
		console.log('\n✅ SUCCESS! Responsable changed from "Juan Pérez" to "María García"');
		console.log('The drag-to-change-column functionality is working correctly!');
	} else {
		console.log('\n❌ FAILED! Expected "María García" but got "' + responsableValue + '"');
		console.log('The drag-to-change-column functionality did not work as expected.');
	}

	console.log('\n=== Test complete ===');
	console.log(
		'Check browser console logs above for "Element moved" and "Column change detected" messages'
	);
	console.log('\nPress Ctrl+C to exit...');

	// Keep browser open for inspection
	await page.waitForTimeout(300000);

	await browser.close();
}

testDragColumnChange().catch(console.error);
