const { test, expect } = require('@playwright/test');
const {
    ticketType,
    discoveryResponse,
    ticketTypesResponse,
    taxTypesResponse,
    validationResponse,
} = require('./fixtures');

// Advancing past the ticket step re-validates an applied manual code and gates
// changeStep on the result (registration-form's handleAdvanceFromTicketStep).
// Nothing else covers that path: the other Next-clicking spec types a code
// without applying it, so it exits on the unapplied-code warning first.

test('Next advances to personal information with an applied promo code', async ({ page }) => {
    await page.route('**/promo-codes/all/discover*', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(discoveryResponse([])) })
    );
    await page.route('**/ticket-types/allowed*', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ticketTypesResponse([ticketType()])) })
    );
    await page.route('**/tax-types*', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(taxTypesResponse()) })
    );
    await page.route('**/promo-codes/*/apply*', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(validationResponse()) })
    );

    await page.goto('/');

    await page.locator('[data-testid="ticket-dropdown"]').click();
    await page.locator('[data-testid="ticket-list"] >> text=Early Bird Ticket').click();

    await page.fill('input[placeholder="Enter your promo code"]', 'EARLYCODE');
    await page.click('button:has-text("Apply")');
    await expect(page.getByTestId('promo-applied')).toBeVisible();

    await page.click('button:has-text("Next")');

    // Both only render once the ticket step has been left (button-bar gates the
    // Back button and the required-fields note on step !== STEP_SELECT_TICKET_TYPE).
    // Purchaser Information is not a usable signal here: it is on screen during
    // the ticket step too.
    await expect(page.locator('button:has-text("Back")')).toBeVisible();
    await expect(page.locator('text=* Required fields')).toBeVisible();
});
