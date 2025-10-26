import { chromium } from '@playwright/test';

async function testViewSwitcher() {
	const browser = await chromium.launch({ headless: false });
	const page = await browser.newPage();

	console.log('🚀 Navegando a /bpmn/constructor');
	await page.goto('http://localhost:5173/bpmn/constructor');
	await page.waitForTimeout(2000);

	console.log('✅ Página cargada');

	// Verificar que existe el view switcher
	const switcherExists = await page.locator('.view-switcher').count();
	console.log(`🔀 View switcher encontrado: ${switcherExists > 0 ? 'Sí' : 'No'}`);

	// Verificar modo inicial (split)
	const activeSplit = await page.locator('.view-switcher button.active:has-text("Ambas")').count();
	console.log(`📊 Modo inicial (Ambas): ${activeSplit > 0 ? 'Activo ✓' : 'No activo ✗'}`);

	// Verificar que ambos paneles están visibles
	const editorVisible = await page.locator('.editor-panel').isVisible();
	const previewVisible = await page.locator('.preview-panel').isVisible();
	console.log(`📝 Panel editor visible: ${editorVisible ? 'Sí' : 'No'}`);
	console.log(`📊 Panel gráfica visible: ${previewVisible ? 'Sí' : 'No'}`);

	// Cambiar a modo "Solo Tabla"
	console.log('\n🔄 Cambiando a modo "Solo Tabla"...');
	await page.click('.view-switcher button:has-text("Tabla")');
	await page.waitForTimeout(500);

	const editorVisibleTable = await page.locator('.editor-panel').isVisible();
	const previewVisibleTable = await page.locator('.preview-panel').isVisible();
	console.log(`📝 Panel editor visible: ${editorVisibleTable ? 'Sí' : 'No'}`);
	console.log(`📊 Panel gráfica visible: ${previewVisibleTable ? 'Sí' : 'No'} (debería estar oculto)`);

	// Cambiar a modo "Solo Gráfica"
	console.log('\n🔄 Cambiando a modo "Solo Gráfica"...');
	await page.click('.view-switcher button:has-text("Gráfica")');
	await page.waitForTimeout(500);

	const editorVisibleDiagram = await page.locator('.editor-panel').isVisible();
	const previewVisibleDiagram = await page.locator('.preview-panel').isVisible();
	console.log(`📝 Panel editor visible: ${editorVisibleDiagram ? 'Sí' : 'No'} (debería estar oculto)`);
	console.log(`📊 Panel gráfica visible: ${previewVisibleDiagram ? 'Sí' : 'No'}`);

	// Volver a modo "Ambas"
	console.log('\n🔄 Cambiando a modo "Ambas"...');
	await page.click('.view-switcher button:has-text("Ambas")');
	await page.waitForTimeout(500);

	const editorVisibleBoth = await page.locator('.editor-panel').isVisible();
	const previewVisibleBoth = await page.locator('.preview-panel').isVisible();
	console.log(`📝 Panel editor visible: ${editorVisibleBoth ? 'Sí' : 'No'}`);
	console.log(`📊 Panel gráfica visible: ${previewVisibleBoth ? 'Sí' : 'No'}`);

	// Verificar localStorage
	const localStorageValue = await page.evaluate(() => {
		return localStorage.getItem('bpmn-view-mode');
	});
	console.log(`\n💾 Valor en localStorage: "${localStorageValue}" (debería ser "split")`);

	console.log('\n✅ Test completado - Revisa visualmente las transiciones');
	console.log('💡 Presiona Ctrl+C para cerrar');

	await page.waitForTimeout(10000);
	await browser.close();
}

testViewSwitcher().catch(console.error);
