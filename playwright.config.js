const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: 'http://localhost:4173',
        trace: 'on-first-retry'
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
    ],
    webServer: {
        command: 'npm run serve',
        url: 'http://localhost:4173',
        reuseExistingServer: true
    }
});
