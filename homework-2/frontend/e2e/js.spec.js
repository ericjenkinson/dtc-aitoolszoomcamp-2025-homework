import { test, expect } from '@playwright/test';

test.describe('JavaScript Execution', () => {

    test('should execute javascript code', async ({ page }) => {
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));

        // Mock backend for file creation
        await page.route('**/files/', async route => {
            const json = { id: 888, name: 'test.js', content: '', language: 'javascript' };
            await route.fulfill({ json });
        });

        await page.route('**/files/888', async route => {
            const json = { id: 888, name: 'test.js', content: '', language: 'javascript' };
            await route.fulfill({ json });
        });

        await page.goto('/');

        // Create Interview context
        const interviewName = 'JS Interview ' + Date.now();
        await page.getByPlaceholder('Interview Name').fill(interviewName);
        await page.getByRole('button', { name: 'Create' }).click();

        // Create a file first
        await page.click('button:has-text("+ New File")');
        await page.fill('input[placeholder="filename.js or .py"]', 'test.js');
        await page.keyboard.press('Enter');

        // Check Run button is immediately available (no WASM loading)
        const runButton = page.getByTestId('run-button');
        await expect(runButton).toBeEnabled();
        await expect(runButton).toHaveText('▶ Run');

        // Enter code
        await page.click('.cm-content');
        await page.keyboard.type('console.log("Hello JS"); return 100 + 55;');

        // Run
        await runButton.click();

        // Verify Output
        await expect(page.getByTestId('output-panel')).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('output-panel')).toContainText('Hello JS');
        await expect(page.getByTestId('output-panel')).toContainText('155');
    });

});
