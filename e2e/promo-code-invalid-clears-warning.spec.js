const { test, expect } = require('@playwright/test');
const {
    ticketType,
    discoveryResponse,
    ticketTypesResponse,
    taxTypesResponse,
    validationError,
} = require('./fixtures');

// The unapplied-code warning ("you typed a code but didn't click Apply") must yield
// to the hook's own validation error once the backend rejects the code. Without the
// fix, the warning kept its precedence in the merged display slot, masking the
// more specific "Promo code entered is not valid" message after a failed Apply.

const UNAPPLIED_WARNING = "You entered a promo code but it hasn't been applied";
const INVALID_MESSAGE = 'Promo code entered is not valid.';

test('INVALID status clears the unapplied-code warning', async ({ page }) => {
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
        route.fulfill({
            status: 412,
            contentType: 'application/json',
            body: JSON.stringify(validationError('The Promo Code "BAD" is not a valid code.')),
        })
    );

    await page.goto('/');

    // Select a ticket so the Next button is enabled.
    await page.locator('[data-testid="ticket-dropdown"]').click();
    await page.locator('[data-testid="ticket-list"] >> text=Early Bird Ticket').click();

    // Type a code WITHOUT clicking Apply, then hit Next.
    // This is the trigger for the unapplied-code warning.
    await page.fill('input[placeholder="Enter your promo code"]', 'BAD');
    await page.click('button:has-text("Next")');

    // Warning is visible, INVALID message is not.
    await expect(page.locator(`text=${UNAPPLIED_WARNING}`)).toBeVisible();
    await expect(page.locator(`text=${INVALID_MESSAGE}`)).not.toBeVisible();

    // Now click Apply. Backend rejects with 412 — the hook surfaces the INVALID message.
    await page.click('button:has-text("Apply")');

    // The unapplied warning must give way to the more specific rejection reason.
    await expect(page.locator(`text=${INVALID_MESSAGE}`)).toBeVisible();
    await expect(page.locator(`text=${UNAPPLIED_WARNING}`)).not.toBeVisible();
});
