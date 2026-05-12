const { test, expect } = require('@playwright/test');
const {
    ticketType,
    discoveredCode,
    discoveryResponse,
    ticketTypesResponse,
    taxTypesResponse,
    validationResponse,
    validationError,
} = require('./fixtures');

// ── Helpers ──

const setupRoutes = async (page, { discovery = [], tickets = [], taxes = [], validation = null } = {}) => {
    // Discovery endpoint
    await page.route('**/promo-codes/all/discover*', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(discoveryResponse(discovery)) })
    );

    // Ticket types (with or without promo filter)
    await page.route('**/ticket-types/allowed*', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ticketTypesResponse(tickets)) })
    );

    // Tax types
    await page.route('**/tax-types*', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(taxTypesResponse(taxes)) })
    );

    // Validation endpoint (if provided)
    if (validation) {
        await page.route('**/promo-codes/*/apply*', route => {
            if (typeof validation === 'function') {
                validation(route);
            } else {
                route.fulfill({
                    status: validation.status || 200,
                    contentType: 'application/json',
                    body: JSON.stringify(validation.body || validationResponse()),
                });
            }
        });
    }
};

const selectTicket = async (page, ticketName) => {
    await page.locator('[data-testid="ticket-dropdown"]').click();
    await page.locator(`[data-testid="ticket-list"] >> text=${ticketName}`).click();
};

// ── Discovery scenarios ──

test.describe('no discovery codes', () => {
    test('shows default promo code UI', async ({ page }) => {
        await setupRoutes(page, {
            tickets: [ticketType()],
            discovery: [],
        });
        await page.goto('/');
        await expect(page.locator('text=Do you have a promo code?')).toBeVisible();
    });

    test('manual code entry still works', async ({ page }) => {
        await setupRoutes(page, {
            tickets: [ticketType()],
            discovery: [],
            validation: { status: 200, body: validationResponse() },
        });
        await page.goto('/');
        await selectTicket(page, 'Early Bird Ticket');
        await page.fill('input[placeholder="Enter your promo code"]', 'MANUALCODE');
        await page.click('button:has-text("Apply")');
        await expect(page.locator('input[placeholder="Enter your promo code"][readonly]')).toBeVisible();
    });
});

test.describe('suggestion flow (auto_apply: false)', () => {
    const suggestCode = discoveredCode({ auto_apply: false, code: 'SUGGEST50' });

    test('shows suggestion when qualifying ticket selected', async ({ page }) => {
        await setupRoutes(page, {
            tickets: [ticketType()],
            discovery: [suggestCode],
        });
        await page.goto('/');
        await selectTicket(page, 'Early Bird Ticket');
        await expect(page.locator('text=You qualify for the following promo code:')).toBeVisible();
        await expect(page.locator('input[placeholder="Enter your promo code"]')).toHaveValue('SUGGEST50');
    });

    test('no suggestion for non-qualifying ticket', async ({ page }) => {
        const nonQualifyingTicket = ticketType({ id: 999, name: 'Standard Ticket' });
        await setupRoutes(page, {
            tickets: [nonQualifyingTicket],
            discovery: [suggestCode],
        });
        await page.goto('/');
        await selectTicket(page, 'Standard Ticket');
        await expect(page.locator('text=Do you have a promo code?')).toBeVisible();
        await expect(page.locator('input[placeholder="Enter your promo code"]')).toHaveValue('');
    });

    test('suggestion clears when user edits input', async ({ page }) => {
        await setupRoutes(page, {
            tickets: [ticketType()],
            discovery: [suggestCode],
        });
        await page.goto('/');
        await selectTicket(page, 'Early Bird Ticket');
        await expect(page.locator('text=You qualify for the following promo code:')).toBeVisible();
        await page.fill('input[placeholder="Enter your promo code"]', 'MYCODE');
        await expect(page.locator('text=Do you have a promo code?')).toBeVisible();
    });

    test('suggestion re-appears when user types discovered code back', async ({ page }) => {
        await setupRoutes(page, {
            tickets: [ticketType()],
            discovery: [suggestCode],
        });
        await page.goto('/');
        await selectTicket(page, 'Early Bird Ticket');
        await page.fill('input[placeholder="Enter your promo code"]', 'OTHER');
        await expect(page.locator('text=Do you have a promo code?')).toBeVisible();
        await page.fill('input[placeholder="Enter your promo code"]', 'SUGGEST50');
        await expect(page.locator('text=You qualify for the following promo code:')).toBeVisible();
    });
});

test.describe('auto-apply flow (auto_apply: true)', () => {
    const autoCode = discoveredCode({ auto_apply: true, code: 'AUTO100' });

    test('auto-applies when qualifying ticket selected', async ({ page }) => {
        await setupRoutes(page, {
            tickets: [ticketType()],
            discovery: [autoCode],
            validation: { status: 200, body: validationResponse() },
        });
        await page.goto('/');
        await selectTicket(page, 'Early Bird Ticket');
        await expect(page.locator('text=Following promo code was automatically applied:')).toBeVisible();
        await expect(page.locator('input[placeholder="Enter your promo code"]')).toHaveValue('AUTO100');
    });

    test('shows suggestion after removing auto-applied code', async ({ page }) => {
        await setupRoutes(page, {
            tickets: [ticketType()],
            discovery: [autoCode],
            validation: { status: 200, body: validationResponse() },
        });
        await page.goto('/');
        await selectTicket(page, 'Early Bird Ticket');
        await expect(page.locator('text=Following promo code was automatically applied:')).toBeVisible();
        await page.click('button:has-text("Remove")');
        await expect(page.locator('text=You qualify for the following promo code:')).toBeVisible();
    });

    test('does not auto-apply for non-qualifying ticket', async ({ page }) => {
        const nonQualifyingTicket = ticketType({ id: 999, name: 'Standard Ticket' });
        await setupRoutes(page, {
            tickets: [nonQualifyingTicket],
            discovery: [autoCode],
        });
        await page.goto('/');
        await selectTicket(page, 'Standard Ticket');
        await expect(page.locator('text=Do you have a promo code?')).toBeVisible();
    });
});

test.describe('per-account limit', () => {
    test('shows limit notice when code has quantity_per_account', async ({ page }) => {
        const limitedCode = discoveredCode({ auto_apply: true, quantity_per_account: 2, remaining_quantity_per_account: 2 });
        await setupRoutes(page, {
            tickets: [ticketType()],
            discovery: [limitedCode],
            validation: { status: 200, body: validationResponse() },
        });
        await page.goto('/');
        await selectTicket(page, 'Early Bird Ticket');
        await expect(page.locator('text=Promo code limits 2 tickets per account.')).toBeVisible();
    });

    test('no limit notice when quantity_per_account is 0', async ({ page }) => {
        const unlimitedCode = discoveredCode({ auto_apply: true, quantity_per_account: 0, remaining_quantity_per_account: null });
        await setupRoutes(page, {
            tickets: [ticketType()],
            discovery: [unlimitedCode],
            validation: { status: 200, body: validationResponse() },
        });
        await page.goto('/');
        await selectTicket(page, 'Early Bird Ticket');
        await expect(page.locator('text=Promo code limits')).not.toBeVisible();
    });

    test('singular ticket text for limit of 1', async ({ page }) => {
        const singleCode = discoveredCode({ auto_apply: true, quantity_per_account: 1, remaining_quantity_per_account: 1 });
        await setupRoutes(page, {
            tickets: [ticketType()],
            discovery: [singleCode],
            validation: { status: 200, body: validationResponse() },
        });
        await page.goto('/');
        await selectTicket(page, 'Early Bird Ticket');
        await expect(page.locator('text=Promo code limits 1 ticket per account.')).toBeVisible();
    });
});

test.describe('non-transferable notice', () => {
    test('shows notice when allows_to_reassign is false', async ({ page }) => {
        const nonTransferableCode = discoveredCode({ auto_apply: true, allows_to_reassign: false });
        await setupRoutes(page, {
            tickets: [ticketType()],
            discovery: [nonTransferableCode],
            validation: { status: 200, body: validationResponse({ allows_to_reassign: false }) },
        });
        await page.goto('/');
        await selectTicket(page, 'Early Bird Ticket');
        await expect(page.locator('text=This ticket will be automatically assigned to you')).toBeVisible();
    });
});

test.describe('validation errors', () => {
    test('shows error for invalid code', async ({ page }) => {
        await setupRoutes(page, {
            tickets: [ticketType()],
            discovery: [],
            validation: { status: 412, body: validationError('The Promo Code "BAD" is not a valid code.') },
        });
        await page.goto('/');
        await selectTicket(page, 'Early Bird Ticket');
        await page.fill('input[placeholder="Enter your promo code"]', 'BAD');
        await page.click('button:has-text("Apply")');
        await expect(page.locator('text=Promo code entered is not valid.')).toBeVisible();
    });

    test('shows error for wrong ticket type', async ({ page }) => {
        await setupRoutes(page, {
            tickets: [ticketType()],
            discovery: [],
            validation: { status: 412, body: validationError('Promo code XYZ can not be applied to Ticket Type Early Bird Ticket.') },
        });
        await page.goto('/');
        await selectTicket(page, 'Early Bird Ticket');
        await page.fill('input[placeholder="Enter your promo code"]', 'XYZ');
        await page.click('button:has-text("Apply")');
        await expect(page.locator('text=Promo code XYZ can not be applied to Ticket Type Early Bird Ticket.')).toBeVisible();
    });

    test('error clears when user types', async ({ page }) => {
        await setupRoutes(page, {
            tickets: [ticketType()],
            discovery: [],
            validation: { status: 412, body: validationError('The Promo Code "BAD" is not a valid code.') },
        });
        await page.goto('/');
        await selectTicket(page, 'Early Bird Ticket');
        await page.fill('input[placeholder="Enter your promo code"]', 'BAD');
        await page.click('button:has-text("Apply")');
        await expect(page.locator('text=Promo code entered is not valid.')).toBeVisible();
        await page.click('button:has-text("Remove")');
        await page.fill('input[placeholder="Enter your promo code"]', 'NEW');
        await expect(page.locator('text=Promo code entered is not valid.')).not.toBeVisible();
    });
});

test.describe('no tickets available', () => {
    test('shows no tickets message', async ({ page }) => {
        await setupRoutes(page, {
            tickets: [],
            discovery: [discoveredCode()],
        });
        await page.goto('/');
        await expect(page.locator('text=no tickets available')).toBeVisible();
    });
});

test.describe('ticket switching with applied code', () => {
    test('removes discovered code when switching to non-qualifying ticket', async ({ page }) => {
        const qualifying = ticketType({ id: 188, name: 'Early Bird Ticket' });
        const nonQualifying = ticketType({ id: 999, name: 'Standard Ticket' });
        const code = discoveredCode({ auto_apply: true, allowed_ticket_types: [188] });

        await setupRoutes(page, {
            tickets: [qualifying, nonQualifying],
            discovery: [code],
            validation: { status: 200, body: validationResponse() },
        });
        await page.goto('/');
        await selectTicket(page, 'Early Bird Ticket');
        await expect(page.locator('text=Following promo code was automatically applied:')).toBeVisible();

        await selectTicket(page, 'Standard Ticket');
        await expect(page.locator('text=Do you have a promo code?')).toBeVisible();
        await expect(page.locator('input[placeholder="Enter your promo code"]')).toHaveValue('');
    });

    test('suggestion appears when switching back to qualifying ticket', async ({ page }) => {
        const qualifying = ticketType({ id: 188, name: 'Early Bird Ticket' });
        const nonQualifying = ticketType({ id: 999, name: 'Standard Ticket' });
        const code = discoveredCode({ auto_apply: true, allowed_ticket_types: [188] });

        await setupRoutes(page, {
            tickets: [qualifying, nonQualifying],
            discovery: [code],
            validation: { status: 200, body: validationResponse() },
        });
        await page.goto('/');

        // Auto-apply on qualifying
        await selectTicket(page, 'Early Bird Ticket');
        await expect(page.locator('text=Following promo code was automatically applied:')).toBeVisible();

        // Remove
        await page.click('button:has-text("Remove")');

        // Switch away and back
        await selectTicket(page, 'Standard Ticket');
        await selectTicket(page, 'Early Bird Ticket');
        await expect(page.locator('text=You qualify for the following promo code:')).toBeVisible();
    });
});

test.describe('discovery API errors', () => {
    test('widget works normally when discovery returns 500', async ({ page }) => {
        page.route('**/promo-codes/all/discover*', route =>
            route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Internal Server Error' }) })
        );
        page.route('**/ticket-types/allowed*', route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ticketTypesResponse([ticketType()])) })
        );
        page.route('**/tax-types*', route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(taxTypesResponse()) })
        );

        await page.goto('/');
        await expect(page.locator('text=Do you have a promo code?')).toBeVisible();
    });

    test('widget works normally when discovery returns 403', async ({ page }) => {
        page.route('**/promo-codes/all/discover*', route =>
            route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ message: 'Forbidden' }) })
        );
        page.route('**/ticket-types/allowed*', route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ticketTypesResponse([ticketType()])) })
        );
        page.route('**/tax-types*', route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(taxTypesResponse()) })
        );

        await page.goto('/');
        await expect(page.locator('text=Do you have a promo code?')).toBeVisible();
    });
});
