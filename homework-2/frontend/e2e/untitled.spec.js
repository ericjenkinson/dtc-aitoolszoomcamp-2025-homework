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
        await page.getByTitle('New File').click();

        // 3. Edit (Dirty)
        await page.locator('.cm-content').fill('dirty content');

        // Check for * indicator
        await expect(page.getByText('Untitled-1*')).toBeVisible();

        // 5. Try Close
        await page.getByTitle('Close tab').click();

        // Expect Custom Dialog
        await expect(page.getByText('Unsaved Changes')).toBeVisible();
        await expect(page.getByText('Close without saving?')).toBeVisible();

        // Cancel
        await page.getByRole('button', { name: 'Cancel' }).click();
        await expect(page.getByText('Untitled-1')).toBeVisible(); // Still open

        // 6. Close and Confirm
        await page.getByTitle('Close tab').click();
        await page.getByRole('button', { name: 'Confirm' }).click();

        // 7. Verify Gone
        await expect(page.getByText('Untitled-1')).not.toBeVisible();
    });
});
