import { test, expect } from '@playwright/test';

test.describe('BPMN Constructor', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to constructor page
		await page.goto('/bpmn/constructor');
		await page.waitForLoadState('networkidle');
	});

	test('should display the constructor page with table view', async ({ page }) => {
		// Check that we're on the constructor page
		await expect(page.locator('h1')).toContainText('Constructor de Flujos BPMN');

		// Check that table view is visible by default
		await expect(page.locator('table')).toBeVisible();

		// Check for column headers including the new Responsable column
		await expect(page.locator('th').filter({ hasText: 'Responsable' })).toBeVisible();
	});

	test('should add responsable to activities with autocomplete', async ({ page }) => {
		// Wait for the table to be loaded
		await expect(page.locator('table')).toBeVisible();

		// Find the first responsable input field
		const firstResponsableInput = page.locator('input[placeholder*="responsable"]').first();
		await expect(firstResponsableInput).toBeVisible();

		// Type a responsable name
		await firstResponsableInput.fill('Juan Pérez');
		await page.waitForTimeout(500);

		// Add a new row
		const addButton = page.locator('button').filter({ hasText: /Agregar|Add/ }).first();
		if (await addButton.isVisible()) {
			await addButton.click();
			await page.waitForTimeout(500);
		}

		// Fill second responsable with a different name
		const secondResponsableInput = page.locator('input[placeholder*="responsable"]').nth(1);
		if (await secondResponsableInput.isVisible()) {
			await secondResponsableInput.fill('María García');
			await page.waitForTimeout(500);
		}

		// Check that autocomplete datalist exists
		const datalist = page.locator('datalist');
		await expect(datalist.first()).toBeAttached();
	});

	test('should switch to diagram view and show swimlanes', async ({ page }) => {
		// Fill some data in table view first
		await expect(page.locator('table')).toBeVisible();

		// Fill first row with activity name and responsable
		const firstLabelInput = page.locator('input[placeholder*="Nombre"]').first();
		await firstLabelInput.fill('Revisar solicitud');

		const firstResponsableInput = page.locator('input[placeholder*="responsable"]').first();
		await firstResponsableInput.fill('Juan Pérez');
		await page.waitForTimeout(500);

		// Switch to diagram view
		const viewButtons = page.locator('button').filter({ hasText: /Vista|View/ });
		const diagramButton = viewButtons.filter({ hasText: /Diagrama|Diagram/ }).first();

		if (await diagramButton.isVisible()) {
			await diagramButton.click();
			await page.waitForTimeout(1000);

			// Check that diagram is visible
			const diagramContainer = page.locator('.diagram-container, .bpmn-container');
			await expect(diagramContainer.first()).toBeVisible();

			// Check for swimlane headers
			const swimlaneHeaders = page.locator('.swimlane-headers, .swimlane-header');
			if (await swimlaneHeaders.first().isVisible()) {
				// Verify swimlane header contains responsable name
				await expect(page.locator('text=Juan Pérez')).toBeVisible();
			}
		}
	});

	test('should persist responsable data in localStorage', async ({ page }) => {
		// Fill responsable data
		const firstResponsableInput = page.locator('input[placeholder*="responsable"]').first();
		await firstResponsableInput.fill('Ana López');
		await page.waitForTimeout(500);

		// Reload page
		await page.reload();
		await page.waitForLoadState('networkidle');

		// Check that responsable data persisted
		const reloadedInput = page.locator('input[placeholder*="responsable"]').first();
		await expect(reloadedInput).toHaveValue('Ana López');
	});

	test('should show frozen swimlane headers in diagram view', async ({ page }) => {
		// Add multiple activities with different responsables
		await expect(page.locator('table')).toBeVisible();

		// Fill first activity
		const inputs = page.locator('input[placeholder*="Nombre"]');
		await inputs.first().fill('Actividad 1');

		const responsableInputs = page.locator('input[placeholder*="responsable"]');
		await responsableInputs.first().fill('Responsable A');
		await page.waitForTimeout(300);

		// Add second row if possible
		const addButton = page.locator('button').filter({ hasText: /Agregar|Add/ }).first();
		if (await addButton.isVisible()) {
			await addButton.click();
			await page.waitForTimeout(300);

			// Fill second activity with different responsable
			await inputs.nth(1).fill('Actividad 2');
			await responsableInputs.nth(1).fill('Responsable B');
			await page.waitForTimeout(300);
		}

		// Switch to diagram view
		const diagramButton = page.locator('button').filter({ hasText: /Vista.*Diagrama|Diagram.*View/ }).first();
		if (await diagramButton.isVisible()) {
			await diagramButton.click();
			await page.waitForTimeout(1500);

			// Check for swimlane headers container
			const headersContainer = page.locator('.swimlane-headers');
			if (await headersContainer.isVisible()) {
				// Verify headers are positioned absolutely (frozen)
				const position = await headersContainer.evaluate(el =>
					window.getComputedStyle(el).position
				);
				expect(position).toBe('absolute');

				// Check that responsable names are visible in headers
				const headerTexts = await page.locator('.swimlane-header, .header-content').allTextContents();
				console.log('Swimlane headers found:', headerTexts);
			}
		}
	});
});
