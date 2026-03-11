const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    workers: 1,
    forbidOnly: !!process.env.CI,
    timeout: 60000,
    retries: 1,
    reporter: 'list',
    use: {
        baseURL: 'http://127.0.0.1:3000',
        trace: 'on-first-retry',
        viewport: { width: 1280, height: 720 },
        actionTimeout: 30000,
        navigationTimeout: 30000,
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    webServer: [
        {
            command: 'npm run dev',
            cwd: '../backend',
            url: 'http://127.0.0.1:5000',
            reuseExistingServer: !process.env.CI,
            timeout: 120000,
        },
        {
            command: 'npm run dev',
            url: 'http://127.0.0.1:3000',
            reuseExistingServer: !process.env.CI,
            timeout: 120000,
        }
    ],
});
