import { chromium } from 'playwright';

(async () => {
	const browser = await chromium.launch({ headless: false });
	const page = await browser.newPage();

	page.on('console', (msg) => {
		console.log(`CONSOLE: ${msg.type()}`, msg.text());
	});

	console.log('=== TEST: Auto-organizar ===\n');

	console.log('1. Navegando a /bpmn/crear...');
	await page.goto('http://localhost:5173/bpmn/crear');
	await page.waitForTimeout(2000);

	// Screenshot antes
	await page.screenshot({ path: 'before-auto-layout.png', fullPage: true });
	console.log('✓ Screenshot ANTES guardado');

	// Contar elementos antes
	const beforeElements = await page.evaluate(() => {
		const elements = document.querySelectorAll('[data-element-id]');
		return elements.length;
	});
	console.log(`✓ Elementos antes: ${beforeElements}`);

	console.log('\n2. Haciendo click en Auto-organizar...');
	await page.click('button:has-text("Auto-organizar")');
	await page.waitForTimeout(3000);

	// Contar elementos después
	const afterElements = await page.evaluate(() => {
		const elements = document.querySelectorAll('[data-element-id]');
		return elements.length;
	});
	console.log(`✓ Elementos después: ${afterElements}`);

	// Screenshot después
	await page.screenshot({ path: 'after-auto-layout.png', fullPage: true });
	console.log('✓ Screenshot DESPUÉS guardado');

	// Verificar si hay errores visibles
	const errorContainer = await page.locator('.error-container').count();
	console.log(`\nErrores visibles: ${errorContainer}`);

	console.log('\n=== RESULTADO ===');
	if (errorContainer > 0) {
		const errorText = await page.locator('.error-message').textContent();
		console.log('❌ ERROR:', errorText);
	} else if (afterElements !== beforeElements) {
		console.log('❌ PROBLEMA: Número de elementos cambió');
		console.log(`   Antes: ${beforeElements}, Después: ${afterElements}`);
	} else if (afterElements === 0) {
		console.log('❌ PROBLEMA: El diagrama desapareció');
	} else {
		console.log('✅ Auto-layout ejecutado sin errores aparentes');
		console.log('   Revisar screenshots para verificar visualmente');
	}

	console.log('\nPresiona Ctrl+C para cerrar...');
	await page.waitForTimeout(60000);
})();
