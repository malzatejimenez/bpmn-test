import { expect, test } from '@playwright/test';

test.describe('BPMN Visualizer', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the BPMN visualizer page
		await page.goto('/bpmn');
		// Wait for the page to load completely
		await page.waitForLoadState('networkidle');
	});

	test('should load the BPMN visualizer page', async ({ page }) => {
		// Check that the main heading is present
		await expect(page.locator('h1')).toContainText('BPMN Visualizer');

		// Check that the subtitle is present
		await expect(page.locator('.subtitle')).toContainText('Interactive BPMN 2.0 diagram viewer');
	});

	test('should display sidebar with example flows', async ({ page }) => {
		// Check that the sidebar heading is present
		await expect(page.locator('.sidebar h2')).toContainText('Example Flows');

		// Check that there are 3 flow buttons
		const flowButtons = page.locator('.flow-button');
		await expect(flowButtons).toHaveCount(3);

		// Check flow names
		await expect(flowButtons.nth(0)).toContainText('Simple Approval');
		await expect(flowButtons.nth(1)).toContainText('Parallel Processing');
		await expect(flowButtons.nth(2)).toContainText('Order Fulfillment');
	});

	test('should load and display Simple Approval flow by default', async ({ page }) => {
		// Wait for the BPMN diagram to load
		await page.waitForSelector('.djs-container', { timeout: 10000 });

		// Check that the flow name is displayed
		await expect(page.locator('.viewer-header h2')).toContainText('Simple Approval Process');

		// Check that flow stats are displayed
		await expect(page.locator('.flow-stats')).toBeVisible();

		// Verify the diagram canvas is present
		const canvas = page.locator('.djs-container');
		await expect(canvas).toBeVisible();
	});

	test('should switch between different flows', async ({ page }) => {
		// Wait for initial flow to load
		await page.waitForSelector('.djs-container', { timeout: 10000 });

		// Click on Parallel Processing flow
		await page.locator('.flow-button').nth(1).click();

		// Wait a moment for the flow to change
		await page.waitForTimeout(500);

		// Check that the flow name has changed
		await expect(page.locator('.viewer-header h2')).toContainText('Parallel Processing');

		// Verify the active button changed
		await expect(page.locator('.flow-button').nth(1)).toHaveClass(/active/);

		// Click on Order Fulfillment flow
		await page.locator('.flow-button').nth(2).click();

		// Wait for the flow to change
		await page.waitForTimeout(500);

		// Check that the flow name has changed
		await expect(page.locator('.viewer-header h2')).toContainText('Order Fulfillment');
	});

	test('should display zoom controls', async ({ page }) => {
		// Check that zoom control buttons are present
		const zoomControls = page.locator('.zoom-controls .control-btn');
		await expect(zoomControls).toHaveCount(3);

		// Verify zoom buttons have correct titles
		await expect(zoomControls.nth(0)).toHaveAttribute('title', 'Zoom In');
		await expect(zoomControls.nth(1)).toHaveAttribute('title', 'Reset Zoom');
		await expect(zoomControls.nth(2)).toHaveAttribute('title', 'Zoom Out');
	});

	test('should display export controls', async ({ page }) => {
		// Check that export control buttons are present
		const exportControls = page.locator('.export-controls .control-btn');
		await expect(exportControls).toHaveCount(2);

		// Verify export buttons have correct titles
		await expect(exportControls.nth(0)).toHaveAttribute('title', 'Export XML');
		await expect(exportControls.nth(1)).toHaveAttribute('title', 'Export SVG');
	});

	test('should display current flow statistics', async ({ page }) => {
		// Wait for the diagram to load
		await page.waitForSelector('.djs-container', { timeout: 10000 });

		// Check that flow stats section is visible
		const flowStats = page.locator('.flow-stats');
		await expect(flowStats).toBeVisible();

		// Verify stats fields are present
		await expect(flowStats).toContainText('Name:');
		await expect(flowStats).toContainText('Nodes:');
		await expect(flowStats).toContainText('Connections:');
		await expect(flowStats).toContainText('Version:');
	});

	test('should work in Spanish (i18n)', async ({ page }) => {
		// Navigate to Spanish version
		await page.goto('/es/bpmn');
		await page.waitForLoadState('networkidle');

		// Check that the page loads successfully
		await expect(page.locator('h1')).toBeVisible();

		// Check that the diagram loads even in Spanish route
		await page.waitForSelector('.djs-container', { timeout: 10000 });
		await expect(page.locator('.djs-container')).toBeVisible();

		// Verify the sidebar is present
		await expect(page.locator('.sidebar')).toBeVisible();

		// Verify flow buttons are present
		const flowButtons = page.locator('.flow-button');
		await expect(flowButtons).toHaveCount(3);
	});

	test('should handle loading state', async ({ page }) => {
		// Before the diagram loads, there should be a loading indicator
		// (This might be very fast, so we just check it doesn't error)
		const loadingIndicator = page.locator('.loading-container');

		// After waiting, loading should be gone and diagram visible
		await page.waitForSelector('.djs-container', { timeout: 10000 });
		await expect(loadingIndicator).not.toBeVisible();
	});

	test('should display BPMN diagram elements', async ({ page }) => {
		// Wait for the diagram to load
		await page.waitForSelector('.djs-container', { timeout: 10000 });

		// Check that SVG elements are rendered
		const svg = page.locator('.djs-container svg');
		await expect(svg).toBeVisible();

		// Check that there are BPMN elements (shapes and connections)
		const bpmnElements = page.locator('.djs-container .djs-element');
		const count = await bpmnElements.count();
		expect(count).toBeGreaterThan(0);
	});

	test('should update flow stats when switching flows', async ({ page }) => {
		// Wait for initial flow
		await page.waitForSelector('.djs-container', { timeout: 10000 });

		// Get initial node count
		const initialNodes = await page.locator('.flow-stats dd').nth(1).textContent();

		// Switch to a different flow
		await page.locator('.flow-button').nth(1).click();
		await page.waitForTimeout(500);

		// Get new node count
		const newNodes = await page.locator('.flow-stats dd').nth(1).textContent();

		// Node counts should be different for different flows
		expect(initialNodes).not.toBe(newNodes);
	});
});
