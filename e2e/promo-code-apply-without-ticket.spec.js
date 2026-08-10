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

const promoSpinner = (page) => page.getByTestId('promo-spinner');
const promoApplied = (page) => page.getByTestId('promo-applied');

test.describe('apply promo code before selecting a ticket', () => {
    test('settles instead of spinning forever', async ({ page }) => {
        await setupRoutes(page, {
            tickets: twoTickets,
            discovery: [],
            validation: { status: 200, body: validationResponse() },
        });
        await page.goto('/');

        // Apply a code with NO ticket selected
        await page.fill('input[placeholder="Enter your promo code"]', 'EARLYCODE');
        await page.click('button:has-text("Apply")');

        // Input locks with a Remove affordance
        await expect(page.locator('input[placeholder="Enter your promo code"][readonly]')).toBeVisible();
        await expect(page.locator('button:has-text("Remove")')).toBeVisible();

        // No spinner. No success mark either: nothing has verified the code.
        await expect(promoSpinner(page)).toHaveCount(0);
        await expect(promoApplied(page)).toHaveCount(0);
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
        await expect(page.locator('button:has-text("Remove")')).toBeVisible();
        await expect(promoApplied(page)).toHaveCount(0);
        expect(validationCalls).toBe(0);

        // Picking a ticket triggers the deferred promo+ticket validation,
        // which is what promotes the code to verified.
        await selectTicket(page, 'General Admission');
        await expect.poll(() => validationCalls).toBeGreaterThan(0);
        await expect(promoApplied(page)).toBeVisible();
        await expect(promoSpinner(page)).toHaveCount(0);
    });

    test('shows the spinner only while validation is in flight', async ({ page }) => {
        // The other assertions in this file check the spinner is absent, which
        // would also pass if the locator stopped matching anything. Holding the
        // validation open pins the spinner with a positive assertion, so a
        // renamed or removed icon fails here instead of passing silently.
        await setupRoutes(page, { tickets: twoTickets, discovery: [] });

        // Slow the validation enough to observe the in-flight state.
        await page.route('**/promo-codes/*/apply*', async (route) => {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(validationResponse()),
            });
        });

        await page.goto('/');
        await page.fill('input[placeholder="Enter your promo code"]', 'EARLYCODE');
        await page.click('button:has-text("Apply")');

        // Resting unverified: no validation has been requested yet.
        await expect(page.locator('button:has-text("Remove")')).toBeVisible();
        await expect(promoSpinner(page)).toHaveCount(0);

        // Selecting a ticket starts the validation, which is now slow enough
        // to catch mid-flight.
        await selectTicket(page, 'General Admission');
        await expect(promoSpinner(page)).toBeVisible();
        await expect(promoApplied(page)).toHaveCount(0);

        // And it resolves to verified once the request lands.
        await expect(promoApplied(page)).toBeVisible();
        await expect(promoSpinner(page)).toHaveCount(0);
    });
});
