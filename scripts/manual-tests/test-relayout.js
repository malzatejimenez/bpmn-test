import { chromium } from '@playwright/test';

async function testRelayout() {
	const browser = await chromium.launch({ headless: false });
	const page = await browser.newPage();

	await page.goto('http://localhost:5173/bpmn/crear');
	await page.waitForTimeout(2000);

	// Cargar ejemplo básico
	await page.click('text=Básico');
	await page.waitForTimeout(500);

	// Actualizar
	await page.click('button:has-text("Actualizar")');
	await page.waitForTimeout(2000);

	console.log('✅ Diagrama cargado - revisa visualmente las conexiones');
	console.log('💡 Las conexiones deberían tener routing Manhattan automáticamente');

	await page.waitForTimeout(5000);
	await browser.close();
}

testRelayout().catch(console.error);
