const { test, expect } = require('@playwright/test');
const {
    ticketType,
    discoveryResponse,
    ticketTypesResponse,
    taxTypesResponse,
    validationResponse,
} = require('./fixtures');

// ── Helpers ──

const setupRoutes = async (page, { discovery = [], tickets = [], taxes = [], validation = null } = {}) => {
    await page.route('**/promo-codes/all/discover*', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(discoveryResponse(discovery)) })
    );

    await page.route('**/ticket-types/allowed*', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ticketTypesResponse(tickets)) })
    );

    await page.route('**/tax-types*', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(taxTypesResponse(taxes)) })
    );

    if (validation) {
        await page.route('**/promo-codes/*/apply*', route =>
            route.fulfill({
                status: validation.status || 200,
                contentType: 'application/json',
                body: JSON.stringify(validation.body || validationResponse()),
            })
        );
    }
};

const selectTicket = async (page, ticketName) => {
    await page.locator('[data-testid="ticket-dropdown"]').click();
    await page.locator(`[data-testid="ticket-list"] >> text=${ticketName}`).click();
};

// ── Apply before selecting a ticket ──

// Two ticket types so the post-apply single-ticket auto-select does not kick
// in — the applied code genuinely rests with no ticket picked.
const twoTickets = [
    ticketType(),
    ticketType({ id: 189, name: 'General Admission', cost: 900 }),
];

// Scoped to the promo input wrapper: the dev harness renders an unrelated
// payment-section spinner elsewhere on the page.
const promoSpinner = (page) => page.locator('[class*="promoCodeInput"] [class*="spinner"]');

test.describe('apply promo code before selecting a ticket', () => {
    test('settles on checkmark instead of spinning forever', async ({ page }) => {
        await setupRoutes(page, {
            tickets: twoTickets,
            discovery: [],
            validation: { status: 200, body: validationResponse() },
        });
        await page.goto('/');

        // Apply a code with NO ticket selected
        await page.fill('input[placeholder="Enter your promo code"]', 'EARLYCODE');
        await page.click('button:has-text("Apply")');

        // Input locks with the code accepted
        await expect(page.locator('input[placeholder="Enter your promo code"][readonly]')).toBeVisible();

        // Checkmark shown, no promo spinner stuck on screen
        await expect(page.locator('text=✓')).toBeVisible();
        await expect(promoSpinner(page)).toHaveCount(0);
    });

    test('validates the code once a ticket is picked afterwards', async ({ page }) => {
        let validationCalls = 0;
        await setupRoutes(page, {
            tickets: twoTickets,
            discovery: [],
        });
        await page.route('**/promo-codes/*/apply*', route => {
            validationCalls += 1;
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(validationResponse()) });
        });
        await page.goto('/');

        await page.fill('input[placeholder="Enter your promo code"]', 'EARLYCODE');
        await page.click('button:has-text("Apply")');
        await expect(page.locator('text=✓')).toBeVisible();
        expect(validationCalls).toBe(0);

        // Picking a ticket triggers the deferred promo+ticket validation
        await selectTicket(page, 'General Admission');
        await expect.poll(() => validationCalls).toBeGreaterThan(0);
        await expect(page.locator('text=✓')).toBeVisible();
        await expect(promoSpinner(page)).toHaveCount(0);
    });
});
