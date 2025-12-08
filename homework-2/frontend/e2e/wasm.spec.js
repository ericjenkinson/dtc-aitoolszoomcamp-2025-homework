import { test, expect } from '@playwright/test';

test.describe('WASM Python Execution', () => {
    test('should execute python code', async ({ page }) => {
        // Increase timeout for WASM download
        test.setTimeout(60000);

        page.on('console', msg => console.log('PAGE LOG:', msg.text()));

        // Mock backend for file creation
        await page.route('**/files/', async route => {
            const json = { id: 999, name: 'test.py', content: '' };
            await route.fulfill({ json });
        });

        // Mock get file for join session
        await page.route('**/files/999', async route => {
            const json = { id: 999, name: 'test.py', content: '' };
            await route.fulfill({ json });
        });

        await page.goto('/');

        // Create Interview context
        const interviewName = 'WASM Interview ' + Date.now();
        await page.getByPlaceholder('Interview Name').fill(interviewName);
        await page.getByRole('button', { name: 'Create' }).click();

        // Wait for Pyodide to be ready. 
        // The button text changes from "Loading WASM..." to "▶ Run"
        // Create a file first
        await page.click('button:has-text("+ New File")');
        await page.fill('input[placeholder="filename.js or .py"]', 'test.py');
        await page.keyboard.press('Enter');

        // Wait for Pyodide to be ready. 
        // The button text changes from "Loading WASM..." to "▶ Run"
        await expect(page.getByTestId('run-button')).toBeEnabled({ timeout: 30000 });

        // Enter code
        await page.click('.cm-content');
        await page.keyboard.type('print("WASM Test Success")');

        // Run
        await page.click('button:has-text("▶ Run")');

        // Check output
        await expect(page.locator('text=WASM Test Success')).toBeVisible();
    });
});
