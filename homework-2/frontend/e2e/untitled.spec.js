import { test, expect } from '@playwright/test';

test.describe('Untitled File Workflow', () => {
    test('should create untitled file, save as python, and persist', async ({ page }) => {
        // 1. Setup Interview
        await page.goto('/');
        const interviewName = 'UntitledTest ' + Date.now();
        await page.getByPlaceholder('Interview Name').fill(interviewName);
        await page.getByRole('button', { name: 'Create' }).click();

        // 2. Click New File (no input now)
        await page.getByRole('button', { name: '+ New File' }).click();

        // 3. Verify Untitled Tab
        await expect(page.getByText('Untitled-1')).toBeVisible();
        await expect(page.locator('.cm-content')).toBeVisible(); // Editor active

        // 4. Type content
        await page.locator('.cm-content').fill('print("Hello World")');

        // 5. Click Save -> Expect Dialog
        await page.getByRole('button', { name: 'Save' }).click();
        await expect(page.getByText('Save As')).toBeVisible();

        // 6. Try Invalid Name
        await page.getByPlaceholder('filename.js or .py').fill('test');
        await page.getByRole('button', { name: 'Save', exact: true }).click(); // "Save" in dialog
        await expect(page.getByText('File must end with .py or .js')).toBeVisible();

        // 7. Try Valid Name
        const filename = 'hello.py';
        await page.getByPlaceholder('filename.js or .py').fill(filename);
        await page.getByRole('button', { name: 'Save', exact: true }).click();

        // 8. Verify Saved
        await expect(page.getByText('Saved as ' + filename)).toBeVisible(); // Toast
        await expect(page.getByText(filename, { exact: true })).toBeVisible(); // Tab name updated
        await expect(page.getByText('Untitled-1')).not.toBeVisible();

        // 9. Verify URL
        expect(page.url()).toContain('doc=');
    });

    test('should warn when closing dirty untitled file', async ({ page }) => {
        // 1. Setup
        await page.goto('/');
        const interviewName = 'DirtyTest ' + Date.now();
        await page.getByPlaceholder('Interview Name').fill(interviewName);
        await page.getByRole('button', { name: 'Create' }).click();

        // 2. New File
        await page.getByRole('button', { name: '+ New File' }).click();

        // 3. Edit (Dirty)
        await page.locator('.cm-content').fill('dirty content');

        // 4. Handle Dialog
        let dialogMessage = '';
        page.on('dialog', async dialog => {
            dialogMessage = dialog.message();
            await dialog.dismiss(); // Cancel close
        });

        // 5. Try Close
        await page.getByTitle('Close tab').click();
        expect(dialogMessage).toBe('You have unsaved changes. Close without saving?');
        await expect(page.getByText('Untitled-1')).toBeVisible(); // Still open because dismissed

        // 6. Accept Dialog
        page.on('dialog', async dialog => {
            await dialog.accept();
        });
        await page.getByTitle('Close tab').click();
        await expect(page.getByText('Untitled-1')).not.toBeVisible();
    });
});
