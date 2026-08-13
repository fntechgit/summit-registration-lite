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

// Routes everything the ticket step needs, letting the caller decide how each
// successive validation call responds.
const setup = async (page, validationResponses) => {
    let call = 0;
    await page.route('**/promo-codes/all/discover*', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(discoveryResponse([])) })
    );
    await page.route('**/ticket-types/allowed*', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ticketTypesResponse([ticketType()])) })
    );
    await page.route('**/tax-types*', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(taxTypesResponse()) })
    );
    await page.route('**/promo-codes/*/apply*', route => {
        // Last entry repeats, so a single-entry list means "always this".
        const next = validationResponses[Math.min(call++, validationResponses.length - 1)];
        route.fulfill({
            status: next.status,
            contentType: 'application/json',
            body: JSON.stringify(next.body ?? validationResponse()),
        });
    });
};

// uicore raises its own modal for statuses it does not recognise. It overlays
// the form and swallows clicks, so wait for it and clear it the way a user
// would before touching anything underneath. Waiting rather than sampling
// matters: the modal renders a beat after the response lands, and an
// instantaneous check can miss it and leave it covering the next click.
const dismissServerErrorModal = async (page) => {
    const confirm = page.locator('.swal2-confirm');
    await confirm.waitFor({ state: 'visible' });
    await confirm.click();
    await expect(page.locator('.swal2-container')).toHaveCount(0);
};

const applyCode = async (page, code) => {
    await page.locator('[data-testid="ticket-dropdown"]').click();
    await page.locator('[data-testid="ticket-list"] >> text=Early Bird Ticket').click();
    await page.fill('input[placeholder="Enter your promo code"]', code);
    await page.click('button:has-text("Apply")');
};

test('Next retries a validation that failed transiently, and advances once it succeeds', async ({ page }) => {
    // A server error decides nothing about the code, so it must not strand the
    // user: pressing Next again has to re-run the validation rather than sit on
    // a dead button.
    await setup(page, [{ status: 500, body: { message: 'Server error' } }, { status: 200 }]);
    await page.goto('/');

    await applyCode(page, 'EARLYCODE');
    await dismissServerErrorModal(page);

    const next = page.locator('button:has-text("Next")');
    await expect(next).toBeEnabled();
    await next.click();

    await expect(page.locator('button:has-text("Back")')).toBeVisible();
    await expect(page.locator('text=* Required fields')).toBeVisible();
});

test('Next does not advance while validation keeps failing', async ({ page }) => {
    // The retry must not become a way through on an unverified code.
    await setup(page, [{ status: 500, body: { message: 'Server error' } }]);
    await page.goto('/');

    await applyCode(page, 'EARLYCODE');
    await dismissServerErrorModal(page);

    await page.locator('button:has-text("Next")').click();
    await dismissServerErrorModal(page);

    // Still on the ticket step: neither of these renders until it is left.
    await expect(page.locator('button:has-text("Back")')).toHaveCount(0);
    await expect(page.locator('text=* Required fields')).toHaveCount(0);
});

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
