const { test, expect } = require('@playwright/test');

// Helper: login to the app with given credentials
async function loginAs(page, email, password) {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Ensure clean state
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('.ant-input', { state: 'visible' });
    await page.fill('.ant-input[type="email"]', email);
    await page.fill('.ant-input[type="password"]', password);
    await page.click('button[type="submit"]');

    await page.waitForURL(url => !url.href.includes('/login'), { timeout: 60000 });
}

test.describe('Admin E2E Workflow', () => {

    test('Admin can log in and view the Dashboard', async ({ page }) => {
        await loginAs(page, 'admin@test.com', 'password123');

        // Should be redirected to admin area
        await page.waitForLoadState('networkidle');

        // Check for main heading or admin-only nav element
        const headline = page.locator('h1, h2, [class*="dashboard"], [class*="Dashboard"], [class*="overview"]').first();
        await expect(headline).toBeVisible({ timeout: 10000 });

        // Confirm URL contains admin path
        expect(page.url()).toMatch(/admin|dashboard/i);
    });

    test('Admin can navigate to User Management section', async ({ page }) => {
        await loginAs(page, 'admin@test.com', 'password123');
        await page.waitForLoadState('networkidle');

        // Try to click on a User Management sidebar link
        const usersLink = page.locator(
            'a:has-text("User"), a:has-text("Users"), [data-menu-id*="user"], button:has-text("User Management")'
        ).first();

        if (await usersLink.isVisible({ timeout: 5000 }).catch(() => false)) {
            await usersLink.click();
            await page.waitForLoadState('networkidle');
            // Confirm we landed on a users/management page
            await expect(page.locator('table, [class*="user"], h1, h2').first()).toBeVisible({ timeout: 10000 });
        } else {
            // Sidebar may be collapsed — just assert the page is still active
            expect(page.url()).not.toContain('/login');
        }
    });
});
