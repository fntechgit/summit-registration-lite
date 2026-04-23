const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './e2e',
    timeout: 30000,
    use: {
        baseURL: 'https://localhost:8888',
        ignoreHTTPSErrors: true,
    },
    // Dev server must be running: yarn serve
    webServer: null,
});
