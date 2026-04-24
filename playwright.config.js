const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './e2e',
    timeout: 30000,
    use: {
        baseURL: 'https://localhost:8888',
        ignoreHTTPSErrors: true,
    },
    projects: [
        {
            name: 'chromium',
            use: { browserName: 'chromium' },
        },
    ],
    reporter: process.env.CI
        ? [['html', { open: 'never' }], ['list']]
        : [['list']],
    webServer: {
        command: 'yarn serve',
        url: 'https://localhost:8888',
        ignoreHTTPSErrors: true,
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
    },
});
