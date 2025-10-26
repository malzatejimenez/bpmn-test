import { chromium } from 'playwright';

(async () => {
	const browser = await chromium.launch({ headless: false });
	const page = await browser.newPage();

	page.on('console', (msg) => {
		if (msg.text().includes('modificado')) {
			console.log(`✓ ${msg.text()}`);
		}
	});

	console.log('=== TEST: Preservar cambios al cambiar modo ===\n');

	console.log('1. Navegando a /bpmn/crear...');
	await page.goto('http://localhost:5173/bpmn/crear');
	await page.waitForTimeout(2000);

	console.log('2. Activando modo edición...');
	await page.click('input[type="checkbox"]:near(:text("Solo lectura"))');
	await page.waitForTimeout(3000);

	// Contar elementos iniciales
	const initialElements = await page.evaluate(() => {
		const elements = document.querySelectorAll('[data-element-id]');
		return elements.length;
	});
	console.log(`   ✓ Elementos iniciales: ${initialElements}`);

	console.log('3. Agregando un nuevo elemento desde la palette...');
	// Hacer click en "Create Task" en la palette
	await page.click('.djs-palette .entry[data-action="create.task"]');
	await page.waitForTimeout(300);

	// Click en el canvas para crear el elemento
	await page.click('.djs-container', { position: { x: 400, y: 400 } });
	await page.waitForTimeout(1000);

	// Contar elementos después de agregar
	const afterAddElements = await page.evaluate(() => {
		const elements = document.querySelectorAll('[data-element-id]');
		return elements.length;
	});
	console.log(`   ✓ Elementos después de agregar: ${afterAddElements}`);
	console.log(`   ✓ Nuevo elemento agregado: ${afterAddElements > initialElements ? 'SÍ' : 'NO'}`);

	console.log('4. Desactivando modo edición (cambiar a readonly)...');
	await page.click('input[type="checkbox"]:near(:text("Edición"))');
	await page.waitForTimeout(3000);

	// Verificar que NO hay palette
	const paletteCount = await page.locator('.djs-palette').count();
	console.log(`   ✓ Palette en readonly: ${paletteCount} (debería ser 0)`);

	// Contar elementos después de cambiar a readonly
	const readonlyElements = await page.evaluate(() => {
		const elements = document.querySelectorAll('[data-element-id]');
		return elements.length;
	});
	console.log(`   ✓ Elementos en readonly: ${readonlyElements}`);
	console.log(`   ${readonlyElements === afterAddElements ? '✅ CAMBIOS PRESERVADOS' : '❌ CAMBIOS PERDIDOS'}`);

	console.log('\n5. Reactivando modo edición...');
	await page.click('input[type="checkbox"]:near(:text("Solo lectura"))');
	await page.waitForTimeout(3000);

	// Contar elementos después de volver a edición
	const finalElements = await page.evaluate(() => {
		const elements = document.querySelectorAll('[data-element-id]');
		return elements.length;
	});
	console.log(`   ✓ Elementos en edición (2da vez): ${finalElements}`);
	console.log(`   ${finalElements === afterAddElements ? '✅ CAMBIOS AÚN PRESERVADOS' : '❌ CAMBIOS PERDIDOS'}`);

	await page.screenshot({ path: 'test-preserve-final.png', fullPage: true });
	console.log('\n✓ Screenshot guardado como test-preserve-final.png');

	console.log('\n=== RESULTADO ===');
	if (readonlyElements === afterAddElements && finalElements === afterAddElements) {
		console.log('✅ ÉXITO: Los cambios se preservan al cambiar entre modos');
	} else {
		console.log('❌ FALLO: Los cambios NO se preservan correctamente');
	}

	console.log('\nPresiona Ctrl+C para cerrar...');
	await page.waitForTimeout(60000);
})();
