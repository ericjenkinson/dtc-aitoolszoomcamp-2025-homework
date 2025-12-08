import { test, expect } from '@playwright/test';

test.describe('Real-time Collaboration', () => {
    test('should sync content between two users', async ({ browser }) => {
        // Create two isolated browser contexts
        const user1Context = await browser.newContext();
        const user2Context = await browser.newContext();

        const page1 = await user1Context.newPage();
        const page2 = await user2Context.newPage();

        // 1. User 1 creates interview and file
        await page1.goto('/');
        await page1.getByPlaceholder('Interview Name').fill('Collab Interview');
        await page1.getByRole('button', { name: 'Create Interview' }).click();
        await expect(page1.getByText('Collab Interview')).toBeVisible();
        await page1.getByText('Collab Interview').click();

        await page1.getByTitle('New File').click();
        await expect(page1.getByText('Untitled-1*')).toBeVisible();

        // Save file to have a permalink
        await page1.getByRole('button', { name: 'Save', exact: true }).click();
        await page1.getByPlaceholder('Enter file name').fill('collab.py');
        await page1.getByRole('button', { name: 'Save' }).click();
        await expect(page1.getByText('collab.py')).toBeVisible();

        // Get URL
        const url = page1.url();
        console.log('Shared URL:', url);

        // 2. User 2 joins
        await page2.goto(url);
        await expect(page2.getByText('collab.py')).toBeVisible();

        // 3. User 1 types
        // Need to target CodeMirror content
        const editor1 = page1.locator('.cm-content');
        await editor1.click();
        await page1.keyboard.type('print("Hello from User 1")');

        // 4. Verify User 2 sees it
        // Wait for sync (WebSocket latency)
        await expect(page2.locator('.cm-content')).toHaveText('print("Hello from User 1")');

        // 5. User 2 types
        const editor2 = page2.locator('.cm-content');
        await editor2.click();
        await page2.keyboard.press('Enter');
        await page2.keyboard.type('print("Hello from User 2")');

        // 6. Verify User 1 sees it
        await expect(page1.locator('.cm-content')).toContainText('print("Hello from User 2")');

        // 7. Verify Action Sync: Create File
        await page1.getByTitle('New File').click();
        await expect(page1.getByText('Untitled-2*')).toBeVisible();
        // User 2 should see it immediately
        await expect(page2.getByText('Untitled-2*')).toBeVisible();

        // 8. Verify Action Sync: Switch Tab
        // User 1 switches back to collab.py
        await page1.getByText('collab.py').click();
        // User 2 should switch automatically
        // Wait for switch
        await expect(page2.locator('.cm-content')).toContainText('print("Hello from User 2")');

        await user1Context.close();
        await user2Context.close();
    });
});

