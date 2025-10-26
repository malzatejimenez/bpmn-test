import { chromium } from '@playwright/test';

async function testConstructor() {
	const browser = await chromium.launch({ headless: false });
	const page = await browser.newPage();

	console.log('🚀 Navegando a /bpmn/constructor');
	await page.goto('http://localhost:5173/bpmn/constructor');
	await page.waitForTimeout(2000);

	console.log('✅ Página cargada');

	// Verificar que existe la tabla
	const tableExists = await page.locator('.flow-table').count();
	console.log(`📊 Tabla encontrada: ${tableExists > 0 ? 'Sí' : 'No'}`);

	// Verificar que existe el nodo inicial
	const initialRow = await page.locator('.flow-table tbody tr').count();
	console.log(`📝 Filas iniciales: ${initialRow}`);

	// Agregar una nueva actividad
	console.log('➕ Agregando nueva actividad');
	await page.click('button:has-text("Agregar Actividad")');
	await page.waitForTimeout(500);

	const rowsAfterAdd = await page.locator('.flow-table tbody tr').count();
	console.log(`📝 Filas después de agregar: ${rowsAfterAdd}`);

	// Editar el tipo de la segunda actividad
	console.log('✏️ Editando tipo de actividad');
	await page.locator('.flow-table tbody tr').nth(1).locator('select').selectOption('userTask');
	await page.waitForTimeout(500);

	// Editar el label
	console.log('📝 Editando nombre de actividad');
	await page
		.locator('.flow-table tbody tr')
		.nth(1)
		.locator('input[placeholder="Nombre de la actividad"]')
		.fill('Mi primera tarea');
	await page.waitForTimeout(500);

	// Verificar que el diagrama se renderizó
	const diagramExists = await page.locator('.bpmn-container').count();
	console.log(`🎨 Diagrama renderizado: ${diagramExists > 0 ? 'Sí' : 'No'}`);

	console.log('\n✅ Test completado - Revisa visualmente la interfaz');
	console.log('💡 Presiona Ctrl+C para cerrar');

	await page.waitForTimeout(10000);
	await browser.close();
}

testConstructor().catch(console.error);
