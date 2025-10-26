import { chromium } from '@playwright/test';

async function testViewSwitcher() {
	const browser = await chromium.launch({ headless: false });
	const page = await browser.newPage();

	console.log('🚀 Navegando a /bpmn/constructor');
	await page.goto('http://localhost:5173/bpmn/constructor');
	await page.waitForTimeout(2000);

	console.log('✅ Página cargada\n');

	// Helper para verificar si un panel está visible usando computed style
	async function isPanelVisible(selector) {
		return await page.locator(selector).evaluate((el) => {
			const style = window.getComputedStyle(el);
			return style.display !== 'none';
		});
	}

	// Verificar modo inicial (split)
	console.log('📊 MODO INICIAL (Ambas):');
	const editorVisible1 = await isPanelVisible('.editor-panel');
	const previewVisible1 = await isPanelVisible('.preview-panel');
	console.log(`   Editor: ${editorVisible1 ? '✅ Visible' : '❌ Oculto'}`);
	console.log(`   Gráfica: ${previewVisible1 ? '✅ Visible' : '❌ Oculto'}`);
	console.log(
		`   ${editorVisible1 && previewVisible1 ? '✅ CORRECTO' : '❌ ERROR'}\n`
	);

	// Cambiar a modo "Solo Tabla"
	console.log('🔄 Cambiando a modo "Solo Tabla"...');
	await page.click('.view-switcher button:has-text("Tabla")');
	await page.waitForTimeout(500);

	const editorVisible2 = await isPanelVisible('.editor-panel');
	const previewVisible2 = await isPanelVisible('.preview-panel');
	console.log(`   Editor: ${editorVisible2 ? '✅ Visible' : '❌ Oculto'}`);
	console.log(`   Gráfica: ${previewVisible2 ? '✅ Visible' : '❌ Oculto'}`);
	console.log(`   ${editorVisible2 && !previewVisible2 ? '✅ CORRECTO' : '❌ ERROR'}\n`);

	// Cambiar a modo "Solo Gráfica"
	console.log('🔄 Cambiando a modo "Solo Gráfica"...');
	await page.click('.view-switcher button:has-text("Gráfica")');
	await page.waitForTimeout(500);

	const editorVisible3 = await isPanelVisible('.editor-panel');
	const previewVisible3 = await isPanelVisible('.preview-panel');
	console.log(`   Editor: ${editorVisible3 ? '✅ Visible' : '❌ Oculto'}`);
	console.log(`   Gráfica: ${previewVisible3 ? '✅ Visible' : '❌ Oculto'}`);
	console.log(`   ${!editorVisible3 && previewVisible3 ? '✅ CORRECTO' : '❌ ERROR'}\n`);

	// Volver a modo "Ambas"
	console.log('🔄 Cambiando a modo "Ambas"...');
	await page.click('.view-switcher button:has-text("Ambas")');
	await page.waitForTimeout(500);

	const editorVisible4 = await isPanelVisible('.editor-panel');
	const previewVisible4 = await isPanelVisible('.preview-panel');
	console.log(`   Editor: ${editorVisible4 ? '✅ Visible' : '❌ Oculto'}`);
	console.log(`   Gráfica: ${previewVisible4 ? '✅ Visible' : '❌ Oculto'}`);
	console.log(`   ${editorVisible4 && previewVisible4 ? '✅ CORRECTO' : '❌ ERROR'}\n`);

	// Verificar localStorage
	const localStorageValue = await page.evaluate(() => {
		return localStorage.getItem('bpmn-view-mode');
	});
	console.log(`💾 Persistencia: "${localStorageValue}" ${localStorageValue === 'split' ? '✅' : '❌'}\n`);

	console.log('✅ Test completado');
	console.log('💡 Presiona Ctrl+C para cerrar');

	await page.waitForTimeout(10000);
	await browser.close();
}

testViewSwitcher().catch(console.error);
