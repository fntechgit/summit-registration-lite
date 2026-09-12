const { test, expect } = require('@playwright/test');
const {
    ticketType,
    discoveredCode,
    discoveryResponse,
    ticketTypesResponse,
    taxTypesResponse,
    validationResponse,
} = require('./fixtures');

// Applying a code should point the user at what it changed. The API says what
// that is: a ticket type with a WithPromoCode audience is only ever returned
// while a live code unlocks it, and a discounted one carries
// cost_with_applied_discount. One affected ticket is unambiguous; several means
// the user has a real choice and the widget leaves it to them.

// The catalog is fetched plainly and again filtered by the applied code, which
// is how a code reveals a ticket that was not on offer before.
const setupRoutes = async (page, { before, after, discovery = [] }) => {
    await page.route('**/promo-codes/all/discover*', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(discoveryResponse(discovery)) })
    );
    await page.route('**/ticket-types/allowed*', route => {
        const filtered = route.request().url().includes('promo_code');
        route.fulfill({
            status: 200, contentType: 'application/json',
            body: JSON.stringify(ticketTypesResponse(filtered ? after : before)),
        });
    });
    await page.route('**/tax-types*', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(taxTypesResponse()) })
    );
    await page.route('**/promo-codes/*/apply*', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(validationResponse()) })
    );
};

const apply = async (page, code) => {
    await page.fill('input[placeholder="Enter your promo code"]', code);
    await page.click('button:has-text("Apply")');
    // Wait for the apply to settle before asserting. Remove appearing means the
    // code took; network idle means the code-filtered catalog landed, which is
    // what the selection is read from. Asserting earlier reads the pre-apply
    // screen, where "nothing selected" is trivially true.
    await expect(page.locator('button:has-text("Remove")')).toBeVisible();
    await page.waitForLoadState('networkidle');
};

const selected = (page) => page.locator('[data-testid="selected-ticket"]');
const nothingSelected = (page) => page.getByTestId('no-ticket');

const general = ticketType({ id: 188, name: 'General Ticket' });
const sponsor = ticketType({ id: 300, name: 'Sponsor Ticket' });
const workshop = ticketType({ id: 301, name: 'Workshop Ticket' });

// How the API marks each: a ticket only a code can reveal, and a discounted one.
const promoOnly = (t) => ({ ...t, audience: 'WithPromoCode' });
// A ticket claimed from an offline order by a prepaid code. The API only ever
// reports this subtype through that route: it is not stored or settable, so the
// plain catalog cannot produce one.
const prepaid = (t) => ({ ...t, sub_type: 'PrePaid' });
const discounted = (t) => ({ ...t, cost_with_applied_discount: t.cost / 2 });

test('pre-selects the only ticket a manual code unlocks', async ({ page }) => {
    await setupRoutes(page, { before: [general], after: [general, promoOnly(sponsor)] });
    await page.goto('/');

    await apply(page, 'SPONSOR');

    await expect(selected(page)).toContainText('Sponsor Ticket');
});

test('pre-selects the only ticket a manual code discounts', async ({ page }) => {
    // Nothing is unlocked; the API marks one existing ticket as discounted.
    await setupRoutes(page, {
        before: [general, sponsor],
        after: [general, discounted(sponsor)],
    });
    await page.goto('/');

    await apply(page, 'HALFOFF');

    await expect(selected(page)).toContainText('Sponsor Ticket');
});

test('selects nothing when a manual code affects more than one ticket', async ({ page }) => {
    await setupRoutes(page, {
        before: [general],
        after: [general, promoOnly(sponsor), promoOnly(workshop)],
    });
    await page.goto('/');

    await apply(page, 'BOTH');

    await expect(nothingSelected(page)).toBeVisible();
});

test('selects nothing when a code unlocks one ticket and discounts another', async ({ page }) => {
    // One of each is still two affected tickets.
    await setupRoutes(page, {
        before: [general, sponsor],
        after: [discounted(general), sponsor, promoOnly(workshop)],
    });
    await page.goto('/');

    await apply(page, 'MIXED');

    await expect(nothingSelected(page)).toBeVisible();
});

test('moves an already chosen ticket to the one the code affected', async ({ page }) => {
    // Applying a code is a statement of intent, so the ticket it affected is
    // what the user wants, even if they had picked another one first.
    await setupRoutes(page, { before: [general, sponsor], after: [general, discounted(sponsor)] });
    await page.goto('/');

    await page.locator('[data-testid="ticket-dropdown"]').click();
    await page.locator('[data-testid="ticket-list"] >> text=General Ticket').click();
    await expect(selected(page)).toContainText('General Ticket');

    await apply(page, 'HALFOFF');

    await expect(selected(page)).toContainText('Sponsor Ticket');
});

test('leaves a chosen ticket alone when the code affects several', async ({ page }) => {
    // Nothing to move them to: with a real choice between two, keeping what they
    // picked beats replacing it with a guess.
    await setupRoutes(page, {
        before: [general],
        after: [general, promoOnly(sponsor), promoOnly(workshop)],
    });
    await page.goto('/');

    await page.locator('[data-testid="ticket-dropdown"]').click();
    await page.locator('[data-testid="ticket-list"] >> text=General Ticket').click();

    await apply(page, 'BOTH');

    await expect(selected(page)).toContainText('General Ticket');
});

test('pre-selects for a manual code even when the summit has a suggestion', async ({ page }) => {
    // Discovery runs for every logged in user, so a suggestion is usually
    // present. It describes a different code than the one being applied and
    // must not decide the selection for it.
    await setupRoutes(page, {
        before: [general],
        after: [general, promoOnly(sponsor)],
        discovery: [discoveredCode({ auto_apply: false, code: 'EARLYBIRD', allowed_ticket_types: [188] })],
    });
    await page.goto('/');

    await apply(page, 'SPONSOR');

    await expect(selected(page)).toContainText('Sponsor Ticket');
});

test('never pre-selects a ticket outside its sales window', async ({ page }) => {
    // The code unlocks a ticket whose sales window has closed. The dropdown
    // cannot show it, so selecting it would strand the user. Two in-window
    // tickets so the single-ticket fallback cannot mask a wrong pick.
    const expired = promoOnly(ticketType({
        id: 400, name: 'Expired Sponsor Ticket',
        sales_start_date: 1000000, sales_end_date: 2000000,
    }));
    await setupRoutes(page, {
        before: [general, sponsor],
        after: [general, sponsor, expired],
    });
    await page.goto('/');

    await apply(page, 'EXPIREDUNLOCK');

    await expect(nothingSelected(page)).toBeVisible();
});

test('a discovered code still selects from the tickets it names', async ({ page }) => {
    // The discovered path is unchanged by this work. Here the code discounts
    // Workshop while naming General, and both are in window, so the two rules
    // disagree and only the code's own list gives the expected answer.
    await setupRoutes(page, {
        before: [general, workshop],
        after: [general, discounted(workshop)],
        discovery: [discoveredCode({
            auto_apply: true, code: 'EARLYBIRD', allowed_ticket_types: [188],
        })],
    });
    await page.goto('/');

    await expect(selected(page)).toContainText('General Ticket');
});

test('pre-selects the only ticket a prepaid code claims', async ({ page }) => {
    // A prepaid code reveals ticket types from unassigned tickets on an offline
    // order, bypassing the sellability check the regular catalog applies. Such a
    // ticket keeps an ordinary audience, so the subtype is the only thing that
    // marks it, and without it a sponsor claiming a ticket closed to general
    // sale would get no pre-selection at all.
    await setupRoutes(page, {
        before: [general],
        after: [general, prepaid(sponsor)],
    });
    await page.goto('/');

    await apply(page, 'PREPAIDCODE');

    await expect(selected(page)).toContainText('Sponsor Ticket');
});

test('moves to the prepaid offer of a ticket the user already picked', async ({ page }) => {
    // A type on public sale that a prepaid code also claims comes back twice:
    // the regular offer, and the prepaid one at zero cost. They share an id and
    // differ only by sub_type, so identity here is the pair. Comparing on id
    // alone would call these the same ticket and leave the user on the one they
    // are not entitled to claim.
    const prepaidOffer = {
        ...prepaid(general), name: 'General Ticket [PREPAID]', cost: 0,
    };
    await setupRoutes(page, {
        before: [general],
        after: [general, prepaidOffer],
    });
    await page.goto('/');

    await page.locator('[data-testid="ticket-dropdown"]').click();
    await page.locator('[data-testid="ticket-list"] >> text=General Ticket').first().click();
    await expect(selected(page)).toContainText('General Ticket');

    await apply(page, 'PREPAIDCODE');

    await expect(selected(page)).toContainText('[PREPAID]');
});

test('does not drag the user back when a sales window later changes', async ({ page }) => {
    // The catalog is rebuilt whenever any ticket's sales window opens or closes.
    // Applying a code moves the selection once; after that the user owns it, and
    // an unrelated ticket dropping out of the list must not undo their choice.
    const closingSoon = ticketType({
        id: 500, name: 'Closing Soon Ticket',
        sales_start_date: 1000000, sales_end_date: Math.floor(Date.now() / 1000) + 8,
    });
    await setupRoutes(page, {
        before: [general, sponsor, closingSoon],
        after: [general, discounted(sponsor), closingSoon],
    });
    await page.goto('/');

    await apply(page, 'HALFOFF');
    await expect(selected(page)).toContainText('Sponsor Ticket');

    // The user overrides the pre-selection deliberately.
    await page.locator('[data-testid="ticket-dropdown"]').click();
    await page.locator('[data-testid="ticket-list"] >> text=General Ticket').click();
    await expect(selected(page)).toContainText('General Ticket');

    // Closing Soon must actually leave the list, or this proves nothing: the
    // catalog has to be rebuilt for the re-decide it guards against to be
    // possible at all.
    await page.waitForTimeout(12000);
    await page.locator('[data-testid="ticket-dropdown"]').click();
    await expect(page.locator('[data-testid="ticket-list"]')).not.toContainText('Closing Soon');
    await page.keyboard.press('Escape');
    await page.locator('[data-testid="ticket-dropdown"]').click();

    await expect(selected(page)).toContainText('General Ticket');
});

test('a discovered code does not move a ticket it already applies to', async ({ page }) => {
    // The discovered branch takes the first qualifying ticket, which is only
    // meaningful when nothing is chosen. With a selection the code already
    // covers, moving the user is both pointless and wrong.
    const code = discoveredCode({
        auto_apply: false, code: 'EARLYBIRD', allowed_ticket_types: [188, 300],
    });
    await setupRoutes(page, {
        before: [general, sponsor],
        after: [general, sponsor],
        discovery: [code],
    });
    await page.goto('/');

    await page.locator('[data-testid="ticket-dropdown"]').click();
    await page.locator('[data-testid="ticket-list"] >> text=Sponsor Ticket').click();
    await expect(selected(page)).toContainText('Sponsor Ticket');

    await apply(page, 'EARLYBIRD');

    await expect(selected(page)).toContainText('Sponsor Ticket');
});

test('selects the only ticket when a typed code marks nothing', async ({ page }) => {
    // Nothing is unlocked or discounted, but there is only one ticket to have,
    // so leaving the user to pick it themselves helps no one.
    await setupRoutes(page, { before: [general], after: [general] });
    await page.goto('/');

    await apply(page, 'NOTHINGCODE');

    await expect(selected(page)).toContainText('General Ticket');
});

