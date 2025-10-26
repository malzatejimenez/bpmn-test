import { chromium } from 'playwright';

(async () => {
	const browser = await chromium.launch({ headless: false });
	const page = await browser.newPage();

	// Listen to console
	page.on('console', (msg) => {
		console.log(`CONSOLE: ${msg.type()}`, msg.text());
	});

	console.log('Navegando a /bpmn/crear...');
	await page.goto('http://localhost:5173/bpmn/crear');
	await page.waitForTimeout(2000);

	// Verificar que el diagrama se cargue
	console.log('✓ Página cargada');

	// Verificar modo readonly inicial
	const djsContainer = await page.locator('.djs-container').count();
	console.log(`✓ Diagrama renderizado: ${djsContainer} contenedor(es)`);

	// Verificar que NO hay palette en modo readonly
	let paletteCount = await page.locator('.djs-palette').count();
	console.log(`Palette en modo readonly: ${paletteCount} (debería ser 0)`);

	// Activar modo edición
	console.log('\nActivando modo edición...');
	await page.click('input[type="checkbox"]:near(:text("Solo lectura"))');
	await page.waitForTimeout(3000); // Esperar a que se reinicialice el modeler

	// Verificar que AHORA sí hay palette
	paletteCount = await page.locator('.djs-palette').count();
	console.log(`✓ Palette en modo edición: ${paletteCount} (debería ser 1)`);

	// Verificar context pad (aparece al seleccionar elemento)
	console.log('\nSeleccionando un elemento...');
	await page.click('.djs-element[data-element-id="inicio"]');
	await page.waitForTimeout(500);

	const contextPadCount = await page.locator('.djs-context-pad').count();
	console.log(`✓ Context pad visible: ${contextPadCount} (debería ser 1)`);

	// Probar drag & drop de un elemento
	console.log('\nProbando drag & drop...');
	const elemento = await page.locator('.djs-element[data-element-id="tarea1"]').boundingBox();
	if (elemento) {
		await page.mouse.move(elemento.x + elemento.width / 2, elemento.y + elemento.height / 2);
		await page.mouse.down();
		await page.mouse.move(elemento.x + 150, elemento.y + 50, { steps: 10 });
		await page.mouse.up();
		console.log('✓ Elemento movido con drag & drop');
	}

	// Probar botón Auto-organizar
	console.log('\nProbando auto-organizar...');
	await page.click('button:has-text("Auto-organizar")');
	await page.waitForTimeout(2000);
	console.log('✓ Auto-organizar ejecutado');

	// Screenshot final
	await page.screenshot({ path: 'test-modeler-final.png', fullPage: true });
	console.log('\n✓ Screenshot guardado como test-modeler-final.png');

	console.log('\n=== PRUEBA COMPLETADA ===');
	console.log('Presiona Ctrl+C para cerrar...');
	await page.waitForTimeout(60000);
})();
