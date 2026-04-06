import React from 'react';
import { cleanup, render, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { STEP_SELECT_TICKET_TYPE } from '../../../utils/constants';

// ── Mock actions ────────────────────────────────────────────────────────
// Each action creator returns a thunk that Jest can spy on.
const mockChangeStep = jest.fn(() => () => {});
const mockClearWidgetState = jest.fn(() => () => {});
const mockRemoveReservedTicket = jest.fn(() => () => Promise.resolve());
const mockLoadSession = jest.fn(() => () => {});
const mockGetTicketTypesAndTaxes = jest.fn(() => () => Promise.resolve());
const mockGetLoginCode = jest.fn(() => () => {});
const mockPasswordlessLogin = jest.fn(() => () => {});
const mockGoToLogin = jest.fn(() => () => {});
const mockGetMyInvitation = jest.fn(() => () => Promise.resolve());
const mockReserveTicket = jest.fn(() => () => Promise.resolve());
const mockPayTicketWithProvider = jest.fn(() => () => Promise.resolve());
const mockUpdateClock = jest.fn(() => () => {});
const mockLoadProfileData = jest.fn(() => () => {});
const mockApplyPromoCode = jest.fn(() => () => {});
const mockRemovePromoCode = jest.fn(() => () => {});
const mockValidatePromoCode = jest.fn(() => () => Promise.resolve());

jest.mock('../../../actions', () => ({
    changeStep: (...args) => mockChangeStep(...args),
    clearWidgetState: (...args) => mockClearWidgetState(...args),
    removeReservedTicket: (...args) => mockRemoveReservedTicket(...args),
    loadSession: (...args) => mockLoadSession(...args),
    getTicketTypesAndTaxes: (...args) => mockGetTicketTypesAndTaxes(...args),
    getLoginCode: (...args) => mockGetLoginCode(...args),
    passwordlessLogin: (...args) => mockPasswordlessLogin(...args),
    goToLogin: (...args) => mockGoToLogin(...args),
    getMyInvitation: (...args) => mockGetMyInvitation(...args),
    reserveTicket: (...args) => mockReserveTicket(...args),
    payTicketWithProvider: (...args) => mockPayTicketWithProvider(...args),
    updateClock: (...args) => mockUpdateClock(...args),
    loadProfileData: (...args) => mockLoadProfileData(...args),
    applyPromoCode: (...args) => mockApplyPromoCode(...args),
    removePromoCode: (...args) => mockRemovePromoCode(...args),
    validatePromoCode: (...args) => mockValidatePromoCode(...args),
}));

// ── Mock withReduxProvider as identity HOC ──────────────────────────────
jest.mock('../../../utils/withReduxProvider', () => ({
    withReduxProvider: (Component) => Component,
}));

// ── Mock heavy child components to avoid their side-effects ─────────────
jest.mock('../../login', () => () => <div data-testid="login-component" />);
jest.mock('../../payment', () => () => <div data-testid="payment-component" />);
jest.mock('../../personal-information', () => () => <div data-testid="personal-info-component" />);
jest.mock('../../ticket-type', () => () => <div data-testid="ticket-type-component" />);
jest.mock('../../button-bar', () => () => <div data-testid="button-bar-component" />);
jest.mock('../../purchase-complete', () => () => <div data-testid="purchase-complete-component" />);
jest.mock('../../login-passwordless', () => () => <div data-testid="passwordless-login-component" />);
jest.mock('../../ticket-owned', () => () => <div data-testid="ticket-owned-component" />);
jest.mock('../../no-allowed-tickets', () => () => <div data-testid="no-allowed-tickets" />);
jest.mock('../../ticket-taxes-error', () => () => <div data-testid="ticket-taxes-error" />);

// Mock openstack-uicore-foundation components
jest.mock('openstack-uicore-foundation/lib/components/ajaxloader', () => () => <div data-testid="ajax-loader" />);
jest.mock('openstack-uicore-foundation/lib/components/clock', () => () => <div data-testid="clock" />);
jest.mock('openstack-uicore-foundation/lib/security/constants', () => ({
    AUTH_ERROR_MISSING_AUTH_INFO: 'AUTH_ERROR_MISSING_AUTH_INFO',
    AUTH_ERROR_MISSING_REFRESH_TOKEN: 'AUTH_ERROR_MISSING_REFRESH_TOKEN',
    AUTH_ERROR_REFRESH_TOKEN_REQUEST_ERROR: 'AUTH_ERROR_REFRESH_TOKEN_REQUEST_ERROR',
}));

// Mock utils to avoid complex dependencies
jest.mock('../../../utils/utils', () => ({
    getCurrentProvider: () => ({ publicKey: null, provider: null }),
    buildTrackEvent: jest.fn(),
    handleSentryException: jest.fn(),
    getCurrentUserLanguage: () => 'en',
}));

// The connected RegistrationForm (withReduxProvider is identity, so this is just the connect()-wrapped component)
import RegistrationForm from '..';

// ── Helpers ─────────────────────────────────────────────────────────────
const createTestStore = (overrides = {}) => {
    const defaultState = {
        registrationLiteState: {
            widgetLoading: false,
            reservation: null,
            invitation: null,
            checkout: null,
            ticketTypes: [],
            taxTypes: [],
            step: STEP_SELECT_TICKET_TYPE,
            passwordless: {
                email: null,
                otp_length: 0,
                otp_lifetime: 0,
                code_sent: false,
                error: false,
            },
            nowUtc: 1000000,
            promoCode: '',
            settings: {
                apiBaseUrl: null,
                summitId: null,
                userProfile: null,
            },
            ...overrides,
        },
    };

    return createStore(
        combineReducers({
            registrationLiteState: (state = defaultState.registrationLiteState) => state,
        }),
        defaultState,
        applyMiddleware(thunk),
    );
};

const defaultProps = {
    apiBaseUrl: 'https://api.test.com',
    clientId: 'test-client',
    getAccessToken: jest.fn(),
    goToMyOrders: jest.fn(),
    goToExtraQuestions: jest.fn(),
    completedExtraQuestions: jest.fn(),
    summitData: {
        id: 1,
        name: 'Test Summit',
        time_zone_id: 'UTC',
        payment_profiles: [],
    },
    profileData: { given_name: 'John', family_name: 'Doe', email: 'john@test.com' },
    closeWidget: jest.fn(),
    authErrorCallback: jest.fn(),
    trackEvent: jest.fn(),
    onPurchaseComplete: jest.fn(),
    ownedTickets: [],
    loading: false,
    ticketDataLoaded: true,
};

const renderWithStore = async (props = {}, storeOverrides = {}) => {
    const store = createTestStore(storeOverrides);
    const closeHandlerRef = React.createRef();
    closeHandlerRef.current = () => {};

    const mergedProps = { ...defaultProps, ...props, closeHandlerRef };

    let result;
    await act(async () => {
        result = render(
            <Provider store={store}>
                <RegistrationForm {...mergedProps} />
            </Provider>
        );
    });

    return { ...result, closeHandlerRef, store };
};

afterEach(() => {
    cleanup();
    jest.clearAllMocks();
});

describe('RegistrationForm - close handler wiring', () => {
    it('closeHandlerRef is assigned handleCloseClick via useEffect', async () => {
        const closeHandlerRef = React.createRef();
        closeHandlerRef.current = () => {};

        const originalFn = closeHandlerRef.current;

        await act(async () => {
            render(
                <Provider store={createTestStore()}>
                    <RegistrationForm
                        {...defaultProps}
                        closeHandlerRef={closeHandlerRef}
                    />
                </Provider>
            );
        });

        // After render, the useEffect should have replaced the ref's current
        // with handleCloseClick (a different function)
        expect(closeHandlerRef.current).not.toBe(originalFn);
        expect(typeof closeHandlerRef.current).toBe('function');
    });

    it('handleCloseClick calls removeReservedTicket when reservation exists', async () => {
        const closeWidget = jest.fn();
        // removeReservedTicket returns a thunk that returns a resolved promise
        mockRemoveReservedTicket.mockReturnValue(() => Promise.resolve());

        const { closeHandlerRef } = await renderWithStore(
            { closeWidget },
            { reservation: { id: 123, hash: 'abc' } },
        );

        // Invoke the close handler that was wired via the ref
        await act(async () => {
            closeHandlerRef.current();
        });

        expect(mockRemoveReservedTicket).toHaveBeenCalled();
        // After the promise resolves, closeAndClearState runs
        expect(mockChangeStep).toHaveBeenCalledWith(STEP_SELECT_TICKET_TYPE);
        expect(mockClearWidgetState).toHaveBeenCalled();
        expect(closeWidget).toHaveBeenCalled();
    });

    it('handleCloseClick calls clearWidgetState + changeStep when no reservation', async () => {
        const closeWidget = jest.fn();

        const { closeHandlerRef } = await renderWithStore(
            { closeWidget },
            { reservation: null },
        );

        act(() => {
            closeHandlerRef.current();
        });

        // Without a reservation, it should skip removeReservedTicket and directly
        // call changeStep + clearWidgetState + closeWidget
        expect(mockRemoveReservedTicket).not.toHaveBeenCalled();
        expect(mockChangeStep).toHaveBeenCalledWith(STEP_SELECT_TICKET_TYPE);
        expect(mockClearWidgetState).toHaveBeenCalled();
        expect(closeWidget).toHaveBeenCalled();
    });
});
