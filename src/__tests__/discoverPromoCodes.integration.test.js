/**
 * discoverPromoCodes asks the server to trim its response down to a fixed
 * `fields` + `relations` whitelist (see actions.js). This test proves the
 * hook still computes correct values when the response actually arrives
 * trimmed — i.e. that the request whitelist covers everything the reducer
 * writes to state and everything the hook later reads out of it.
 *
 * Why an integration test and not unit tests:
 *   Unit tests hand-build fixture objects that happen to include every
 *   field, so they can't detect a drift between "what the request asks
 *   for" and "what the hook consumes." Here the fixture is the full
 *   API response and the stubbed transport filters it exactly the way
 *   the real server does, so any missing field surfaces as a wrong
 *   derived value in the hook.
 *
 * Real (not mocked): discoverPromoCodes thunk, Redux store, reducer,
 *                    usePromoCode hook.
 * Stubbed: the HTTP transport (openstack-uicore-foundation's getRequest).
 *          The stub reads the outgoing `fields` + `relations` params off
 *          the request and filters FULL_PROMO_CODE the same way the API
 *          would before dispatching the success action.
 */

import { renderHook } from '@testing-library/react-hooks';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

// Every field /promo-codes/all/discover returns when no `fields` filter
// is supplied. Copied from a real API response so the stubbed transport
// filters against a realistic shape.
const FULL_PROMO_CODE = {
    id: 4605,
    created: 1779486332,
    last_edited: 1784279933,
    code: 'PRESALE',
    redeemed: false,
    email_sent: false,
    source: 'ADMIN',
    summit_id: 73,
    creator_id: 26389,
    quantity_available: 7250,
    quantity_used: 486,
    quantity_remaining: 6764,
    valid_since_date: 1779778800,
    valid_until_date: 1784358000,
    class_name: 'DOMAIN_AUTHORIZED_PROMO_CODE',
    description: 'Pre-Sale Registration: Members & Sponsors',
    notes: '',
    allows_to_delegate: false,
    allows_to_reassign: true,
    // Real responses can contain hundreds of domain strings; kept short here.
    allowed_email_domains: ['@apple.com', '@amazon.com', '@microsoft.com'],
    quantity_per_account: 25,
    auto_apply: true,
    badge_features: [],
    allowed_ticket_types: [202],
    tags: [],
    remaining_quantity_per_account: 24,
};

// Every request the stubbed transport receives, so tests can assert what
// went over the wire (URL, `fields`, `relations`).
const requestLog = [];

// Filters a full record the way the API does:
//   `fields=`    — scalar whitelist. Scalar keys not listed are dropped.
//   `relations=` — relation whitelist (arrays / nested objects). Same rule.
// Anything not listed in either is stripped from the response.
const RELATION_KEYS = new Set([
    'allowed_email_domains',
    'allowed_ticket_types',
    'badge_features',
    'tags',
]);
const filterRecord = (record, fields, relations) => {
    const out = {};
    const requestedScalars = new Set(fields ? fields.split(',') : []);
    const requestedRelations = new Set(relations ? relations.split(',') : []);
    for (const [key, value] of Object.entries(record)) {
        if (RELATION_KEYS.has(key)) {
            if (requestedRelations.has(key)) out[key] = value;
        } else if (requestedScalars.has(key)) {
            out[key] = value;
        }
    }
    return out;
};

// Stubbed transport. `createAction` is preserved because the real reducer
// still needs to match the action types it produces. `getRequest` is
// replaced with a version that runs synchronously, records what was sent,
// filters FULL_PROMO_CODE by the request's `fields` + `relations` params,
// and dispatches the success action exactly as the real transport would.
jest.mock('openstack-uicore-foundation/lib/utils/actions', () => ({
    createAction: (type) => (payload) => ({ type, payload }),
    getRequest: (pre, success, url, _errorHandler) => (params) => (dispatch) => {
        const { access_token, fields, relations, ...rest } = params || {};
        requestLog.push({ url, fields, relations, otherParams: rest });
        if (pre) dispatch(pre({}));
        const filtered = filterRecord(FULL_PROMO_CODE, fields, relations);
        dispatch(success({
            response: {
                total: 1,
                per_page: 1,
                current_page: 1,
                last_page: 1,
                data: [filtered],
            },
        }));
        return Promise.resolve();
    },
    postRequest: jest.fn(),
    deleteRequest: jest.fn(),
    authErrorHandler: jest.fn(),
}));

jest.mock('sweetalert2', () => ({ __esModule: true, default: { fire: jest.fn() } }));

// eslint-disable-next-line import/first
import { discoverPromoCodes } from '../actions';
// eslint-disable-next-line import/first
import registrationLiteState from '../reducer';
// eslint-disable-next-line import/first
import usePromoCode from '../hooks/usePromoCode';

const buildStore = () => createStore(
    combineReducers({ registrationLiteState }),
    applyMiddleware(thunk.withExtraArgument({
        apiBaseUrl: 'https://api.example.com',
        getAccessToken: async () => 'INTEGRATION_TOKEN',
    })),
);

beforeEach(() => {
    requestLog.length = 0;
});

describe('discoverPromoCodes — request → reducer → hook, end to end', () => {
    it('sends the fields and relations whitelist and stores only the fields that came back', async () => {
        const store = buildStore();
        await store.dispatch(discoverPromoCodes(73));

        expect(requestLog).toHaveLength(1);
        const req = requestLog[0];
        expect(req.url).toBe('https://api.example.com/api/v1/summits/73/promo-codes/all/discover');
        expect(req.fields).toBeDefined();
        expect(req.relations).toBeDefined();

        const { discoveredPromoCodes } = store.getState().registrationLiteState;
        expect(discoveredPromoCodes).toHaveLength(1);
        // Fields the widget does not request must not reach the client.
        // allowed_email_domains is the primary reason the request is
        // whitelisted — the unfiltered response can leak hundreds of email
        // domains per code. description / creator_id / notes are internal
        // admin metadata the widget has no reason to see.
        expect(discoveredPromoCodes[0]).not.toHaveProperty('allowed_email_domains');
        expect(discoveredPromoCodes[0]).not.toHaveProperty('description');
        expect(discoveredPromoCodes[0]).not.toHaveProperty('creator_id');
        expect(discoveredPromoCodes[0]).not.toHaveProperty('notes');
    });

    it('the hook derives correct values from the trimmed payload — no missing-field drift', async () => {
        const store = buildStore();
        await store.dispatch(discoverPromoCodes(73));
        const discoveredPromoCodes = store.getState().registrationLiteState.discoveredPromoCodes;

        // Feed the trimmed payload (as it really arrives from the reducer)
        // into the hook and check every value the widget renders from it.
        // If the request forgot to ask for a field the hook needs, one of
        // these expectations comes back as null / undefined / NaN and fails.
        const { result } = renderHook(() => usePromoCode({
            discoveredPromoCodes,
            promoCode: 'PRESALE',
            promoCodeVerified: true,
            promoCodeValidating: false,
            applyPromoCode: jest.fn(() => Promise.resolve()),
            removePromoCode: jest.fn(),
            validatePromoCode: jest.fn(() => Promise.resolve()),
            setFormPromoCode: jest.fn(),
            ticketDataLoaded: true,
            hasTickets: true,
        }));

        expect(result.current.state.suggestedCode).toBe('PRESALE');
        expect(result.current.state.perAccountLimit).toBe(24);
        expect(result.current.state.maxQuantityFromPromo).toBe(24); // min(remaining_per_account, quantity_available)
        expect(result.current.state.isCodeValidForTicket({ id: 202 })).toBe(true);
        expect(result.current.state.isCodeValidForTicket({ id: 999 })).toBe(false);
    });

});
