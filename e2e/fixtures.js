/**
 * Mock API response factories for e2e tests.
 * Each factory returns a response body matching the API contract.
 */

const ticketType = (overrides = {}) => ({
    id: 188,
    name: 'Early Bird Ticket',
    cost: 700,
    currency: 'USD',
    currency_symbol: '$',
    quantity_2_sell: 1000,
    quantity_sold: 0,
    max_quantity_per_order: 10,
    sales_start_date: null,
    sales_end_date: null,
    sub_type: 'Regular',
    audience: 'All',
    badge_type: { id: 1, name: 'General', access_levels: [], badge_features: [] },
    ...overrides,
});

const discoveredCode = (overrides = {}) => ({
    id: 100,
    code: 'EARLYBIRD',
    auto_apply: true,
    allows_to_reassign: true,
    quantity_per_account: 3,
    remaining_quantity_per_account: 3,
    quantity_available: 100,
    quantity_used: 0,
    class_name: 'DOMAIN_AUTHORIZED_DISCOUNT_CODE',
    amount: 50,
    rate: 0,
    allowed_ticket_types: [188],
    badge_features: [],
    tags: [],
    ...overrides,
});

const discoveryResponse = (codes = []) => ({
    total: codes.length,
    per_page: codes.length,
    current_page: 1,
    last_page: 1,
    data: codes,
});

const ticketTypesResponse = (tickets = []) => ({
    total: tickets.length,
    per_page: tickets.length,
    current_page: 1,
    last_page: 1,
    data: tickets,
});

const taxTypesResponse = (taxes = []) => ({
    total: taxes.length,
    per_page: taxes.length,
    current_page: 1,
    last_page: 1,
    data: taxes,
});

const validationResponse = (overrides = {}) => ({
    allows_to_reassign: true,
    ...overrides,
});

const validationError = (message) => ({
    message: 'Validation Failed',
    errors: [message],
    code: 0,
});

module.exports = {
    ticketType,
    discoveredCode,
    discoveryResponse,
    ticketTypesResponse,
    taxTypesResponse,
    validationResponse,
    validationError,
};
