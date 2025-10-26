import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capturar errores de consola
  page.on('console', msg => {
    console.log('CONSOLE:', msg.type(), msg.text());
  });

  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  // Ir a la página
  console.log('Navegando a /bpmn/crear...');
  await page.goto('http://localhost:5173/bpmn/crear');

  // Esperar un poco
  await page.waitForTimeout(3000);

  // Verificar si hay un flujo
  const hasViewer = await page.locator('.bpmn-container').count();
  console.log('Elementos .bpmn-container encontrados:', hasViewer);

  // Hacer click en actualizar
  console.log('Haciendo click en Actualizar...');
  await page.click('text=Actualizar');

  await page.waitForTimeout(2000);

  // Verificar de nuevo
  const hasDiagram = await page.locator('.djs-container').count();
  console.log('Elementos .djs-container encontrados:', hasDiagram);

  // Verificar errores
  const errorMsg = await page.locator('.error-message').count();
  console.log('Mensajes de error:', errorMsg);

  if (errorMsg > 0) {
    const errorText = await page.locator('.error-message').textContent();
    console.log('ERROR:', errorText);
  }

  console.log('\nPresiona Ctrl+C para cerrar...');
  await page.waitForTimeout(30000);

  await browser.close();
})().catch(console.error);
