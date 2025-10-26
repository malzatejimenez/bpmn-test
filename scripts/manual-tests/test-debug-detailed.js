import { chromium } from 'playwright';

(async () => {
	const browser = await chromium.launch({ headless: false });
	const page = await browser.newPage();

	// Listen to all console messages
	page.on('console', (msg) => {
		const type = msg.type();
		console.log(`CONSOLE: ${type}`, msg.text());
	});

	// Navigate to the page
	console.log('Navegando a /bpmn/crear...');
	await page.goto('http://localhost:5173/bpmn/crear');

	// Wait for page to load
	await page.waitForTimeout(2000);

	// Check initial state
	const initialContainer = await page.locator('.bpmn-container').count();
	console.log(`Elementos .bpmn-container encontrados: ${initialContainer}`);

	const initialDjs = await page.locator('.djs-container').count();
	console.log(`Elementos .djs-container ANTES de click: ${initialDjs}`);

	// Check if empty state is visible
	const emptyState = await page.locator('.empty-state').count();
	console.log(`Elementos .empty-state encontrados: ${emptyState}`);

	// Check if viewer is visible
	const viewerVisible = await page.locator('.bpmn-container').isVisible();
	console.log(`¿.bpmn-container es visible?: ${viewerVisible}`);

	// Check if it has the hidden class
	const hasHidden = await page.locator('.bpmn-container.hidden').count();
	console.log(`¿.bpmn-container tiene clase .hidden?: ${hasHidden > 0}`);

	// Click the update button
	console.log('Haciendo click en Actualizar...');
	await page.click('button:has-text("Actualizar")');

	// Wait for any effects to run
	await page.waitForTimeout(2000);

	// Check after click
	const afterDjs = await page.locator('.djs-container').count();
	console.log(`Elementos .djs-container DESPUÉS de click: ${afterDjs}`);

	const afterEmpty = await page.locator('.empty-state').count();
	console.log(`Elementos .empty-state DESPUÉS de click: ${afterEmpty}`);

	const afterViewerVisible = await page.locator('.bpmn-container').isVisible();
	console.log(`¿.bpmn-container es visible DESPUÉS?: ${afterViewerVisible}`);

	const afterHidden = await page.locator('.bpmn-container.hidden').count();
	console.log(`¿.bpmn-container tiene clase .hidden DESPUÉS?: ${afterHidden > 0}`);

	// Check loading state
	const loading = await page.locator('.loading-container').count();
	console.log(`Elementos .loading-container: ${loading}`);

	// Check for errors
	const errorElements = await page.locator('.error-container').count();
	console.log(`Mensajes de error: ${errorElements}`);

	// Screenshot
	await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
	console.log('Screenshot guardado como debug-screenshot.png');

	console.log('\nPresiona Ctrl+C para cerrar...');
	await page.waitForTimeout(60000);
})();
