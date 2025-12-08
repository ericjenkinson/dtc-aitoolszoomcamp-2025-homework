import { test, expect } from '@playwright/test';

test.describe('Interview Project Structure', () => {
    test('should manage interviews and scope files', async ({ page }) => {
        // 1. Landing on Interview Manager
        await page.goto('/');
        await expect(page.getByText('Interview Manager')).toBeVisible();
        await expect(page.getByText('Create a new file')).not.toBeVisible();

        // 2. Create Interview A
        const interviewName = 'Test Interview ' + Date.now();
        await page.getByPlaceholder('Interview Name').fill(interviewName);
        await page.getByRole('button', { name: 'Create' }).click();

        // 3. Verify redirected to Editor
        await expect(page.getByText(`Interview: ${interviewName}`)).toBeVisible();
        await expect(page.getByText('Create a new file')).toBeVisible();

        // 4. Create File in Interview A
        await page.getByRole('button', { name: '+ New File' }).click();
        await page.getByPlaceholder('filename.js or .py').fill('testA.js');
        await page.getByRole('button', { name: 'Check' }).click();
        await expect(page.getByText('Created testA.js')).toBeVisible();

        // 5. Verify file is in list
        await page.getByTestId('load-file-button').click();
        await expect(page.getByTestId('file-row-testA.js')).toBeVisible();
        await page.getByRole('button', { name: '×' }).click(); // Close dialog

        // 6. Switch Interview
        await page.getByText('Switch Interview').click();
        await expect(page.getByText('Interview Manager')).toBeVisible();

        // 7. Create Interview B
        const interviewNameB = 'Second Interview ' + Date.now();
        await page.getByPlaceholder('Interview Name').fill(interviewNameB);
        await page.getByRole('button', { name: 'Create' }).click();
        await expect(page.getByText(`Interview: ${interviewNameB}`)).toBeVisible();

        // 8. Verify File A is NOT visible in Interview B
        await page.getByTestId('load-file-button').click();
        await expect(page.getByTestId('file-row-testA.js')).not.toBeVisible();
        await expect(page.getByText('No files found')).toBeVisible();
        await page.getByRole('button', { name: '×' }).click();

        // 9. Switch back to A
        await page.getByText('Switch Interview').click();
        await page.getByText(interviewName).click();
        await expect(page.getByText(`Interview: ${interviewName}`)).toBeVisible();

        // 10. Verify File A available again
        await page.getByTestId('load-file-button').click();
        await expect(page.getByTestId('file-row-testA.js')).toBeVisible();
    });
});
