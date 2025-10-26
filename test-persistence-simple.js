// Simple test to verify localStorage is being saved
import { chromium } from '@playwright/test';

const url = 'http://localhost:5173/bpmn/constructor';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

try {
	await page.goto(url);
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(3000);

	console.log('✅ Page loaded');

	// Check what's in localStorage after initial load
	const storage = await page.evaluate(() => {
		return {
			rows: localStorage.getItem('bpmn-constructor-rows'),
			xml: localStorage.getItem('bpmn-constructor-xml'),
			viewMode: localStorage.getItem('bpmn-view-mode'),
			editMode: localStorage.getItem('bpmn-edit-mode')
		};
	});

	console.log('\n📦 Current localStorage:');
	console.log('Rows:', storage.rows ? `${JSON.parse(storage.rows).length} rows` : 'empty');
	console.log('XML:', storage.xml ? `${storage.xml.length} chars` : 'empty');
	console.log('View Mode:', storage.viewMode || 'not set');
	console.log('Edit Mode:', storage.editMode || 'not set');

	console.log('\n✅ Test completed - check console output above');
	console.log('The page is still open. Manually test by:');
	console.log('1. Add some rows to the table');
	console.log('2. Switch between view modes');
	console.log('3. Enable edit mode');
	console.log('4. Reload the page (F5)');
	console.log('5. Verify everything is restored\n');

	await page.waitForTimeout(60000); // Wait 1 minute

} catch (error) {
	console.error('❌ Error:', error);
} finally {
	await browser.close();
}
