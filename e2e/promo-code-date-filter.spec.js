const { test, expect } = require('@playwright/test');
const {
    ticketType,
    discoveredCode,
    discoveryResponse,
    ticketTypesResponse,
    taxTypesResponse,
    validationResponse,
} = require('./fixtures');

// Post-apply auto-select must scan the date-filtered ticket list (`allowedTicketTypes`),
// not the raw Redux list (`originalTicketTypes`). Otherwise the widget could pick a ticket
// that's outside its sales window — the dropdown can't display it and the user is stuck.

const setupRoutes = async (page, { discovery, tickets, validation }) => {
    await page.route('**/promo-codes/all/discover*', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(discoveryResponse(discovery)) })
    );
    await page.route('**/ticket-types/allowed*', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ticketTypesResponse(tickets)) })
    );
    await page.route('**/tax-types*', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(taxTypesResponse()) })
    );
    if (validation) {
        await page.route('**/promo-codes/*/apply*', route =>
            route.fulfill({ status: validation.status, contentType: 'application/json', body: JSON.stringify(validation.body) })
        );
    }
};

test.describe('post-apply auto-select respects sales window', () => {
    test('picks the in-window ticket when a discovered code matches both an expired and an active ticket', async ({ page }) => {
        // Code matches both tickets, but Expired Ticket has a sales_end_date in the past.
        // Pre-fix, the auto-select scanned originalTicketTypes (unfiltered) and would land
        // on Expired Ticket — first match in iteration order. Post-fix, only Active Ticket
        // can be auto-selected because Expired Ticket is excluded by the date filter.
        const expiredTicket = ticketType({
            id: 188,
            name: 'Expired Ticket',
            sales_start_date: 1000000,    // long ago
            sales_end_date: 2000000,      // also long ago
        });
        const activeTicket = ticketType({
            id: 200,
            name: 'Active Ticket',
            sales_start_date: null,
            sales_end_date: null,
        });
        const code = discoveredCode({
            auto_apply: true,
            allowed_ticket_types: [188, 200],
        });

        await setupRoutes(page, {
            tickets: [expiredTicket, activeTicket],
            discovery: [code],
            validation: { status: 200, body: validationResponse() },
        });
        await page.goto('/');

        // Auto-apply runs on load; the post-apply effect picks a qualifying ticket.
        // The dropdown's selected-ticket slot shows the chosen ticket's name.
        await expect(page.locator('[data-testid="selected-ticket"]')).toContainText('Active Ticket');
        await expect(page.locator('[data-testid="selected-ticket"]')).not.toContainText('Expired Ticket');
    });

    test('never picks an expired ticket even when it is the only qualifying one', async ({ page }) => {
        // Code matches only the expired ticket. Two active tickets exist (so the
        // "fall back to the single allowed option" clause cannot mask the bug).
        // Pre-fix, the widget scanned originalTicketTypes and would land on
        // Expired Ticket — the only qualifying one. Post-fix, the qualifying
        // scan is bounded by allowedTicketTypes, so Expired Ticket is never
        // selectable.
        const expiredTicket = ticketType({
            id: 188,
            name: 'Expired Ticket',
            sales_start_date: 1000000,
            sales_end_date: 2000000,
        });
        const activeA = ticketType({ id: 200, name: 'Active A', sales_start_date: null, sales_end_date: null });
        const activeB = ticketType({ id: 201, name: 'Active B', sales_start_date: null, sales_end_date: null });
        const code = discoveredCode({
            auto_apply: true,
            allowed_ticket_types: [188], // only the expired one qualifies
        });

        await setupRoutes(page, {
            tickets: [expiredTicket, activeA, activeB],
            discovery: [code],
            validation: { status: 200, body: validationResponse() },
        });
        await page.goto('/');

        // Give the auto-apply + post-apply effects time to settle.
        await page.waitForTimeout(500);
        // Post-fix: no auto-selection happens because the only qualifying ticket
        // is filtered out by date and the fallback ("if there's a single allowed
        // option, pick it") cannot fire when more than one is allowed. The dropdown
        // shows its placeholder. Pre-fix, this slot would have shown "Expired Ticket".
        await expect(page.locator('[data-testid="no-ticket"]')).toBeVisible();
    });
});
