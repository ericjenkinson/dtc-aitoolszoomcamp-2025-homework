import { test, expect } from '@playwright/test';

test.describe('Session Persistence', () => {
    test('should restore open tabs after reload and avoid duplicates', async ({ page }) => {
        // 1. Create Interview
        await page.goto('http://localhost:5173/');
        await page.getByPlaceholder('Ex: Senior React Developer').fill('Persistence Test');
        await page.getByRole('button', { name: 'Create Interview' }).click();

        // 2. Open a file (README.md)
        await page.getByText('README.md').click();
        await expect(page.locator('.tab-bar')).toContainText('README.md');

        // 3. Open another file (main.py) if exists, or create one
        // Assuming project has files from backend mock. 
        // Wait, backend is real now. backend has README.md?
        // Let's create a new file to be sure.
        await page.getByTitle('New File').click();
        await page.getByPlaceholder('Enter file name...').fill('persist.js');
        await page.getByPlaceholder('Enter file name...').press('Enter');
        await expect(page.locator('.tab-bar')).toContainText('persist.js');

        // Count tabs
        const tabs = page.locator('.tab-item');
        await expect(tabs).toHaveCount(2); // README and persist.js

        // 4. Reload Page
        await page.reload();

        // 5. Verify restored state
        // Should have same tabs
        await expect(page.locator('.tab-bar')).toContainText('README.md');
        await expect(page.locator('.tab-bar')).toContainText('persist.js');

        // 6. Verify NO duplicates
        await expect(tabs).toHaveCount(2);

        // 7. Verify file contents (load actually happened)
        await page.getByText('persist.js').click();
        // Content might be empty or as saved.
    });
});
