import React from 'react';
import { cleanup, render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

// Mock withReduxProvider as identity HOC
jest.mock('../../../utils/withReduxProvider', () => ({
    withReduxProvider: (Component) => Component,
    __esModule: true,
    default: (Component) => Component,
}));

// Mock action creators
const mockChangeStep = jest.fn();
const mockClearWidgetState = jest.fn();
const mockRemoveReservedTicket = jest.fn(() => Promise.resolve());
const mockLoadSession = jest.fn();
const mockReserveTicket = jest.fn();
const mockPayTicketWithProvider = jest.fn();
const mockGetTicketTypesAndTaxes = jest.fn(() => Promise.resolve());
const mockGetLoginCode = jest.fn();
const mockPasswordlessLogin = jest.fn();
const mockGoToLogin = jest.fn();
const mockGetMyInvitation = jest.fn(() => Promise.resolve());
const mockUpdateClock = jest.fn();
const mockLoadProfileData = jest.fn();
const mockApplyPromoCode = jest.fn();
const mockRemovePromoCode = jest.fn();
const mockValidatePromoCode = jest.fn();
const mockDiscoverPromoCodes = jest.fn();
const mockStartWidgetLoading = jest.fn();
const mockStopWidgetLoading = jest.fn();

jest.mock('../../../actions', () => ({
    changeStep: (...args) => {
        mockChangeStep(...args);
        return { type: 'CHANGE_STEP', payload: args[0] };
    },
    clearWidgetState: (...args) => {
        mockClearWidgetState(...args);
        return { type: 'CLEAR_WIDGET_STATE' };
    },
    removeReservedTicket: (...args) => () => {
        mockRemoveReservedTicket(...args);
        return Promise.resolve();
    },
    loadSession: (...args) => {
        mockLoadSession(...args);
        return { type: 'LOAD_INITIAL_VARS', payload: args[0] };
    },
    reserveTicket: (...args) => {
        mockReserveTicket(...args);
        return { type: 'NOOP' };
    },
    payTicketWithProvider: (...args) => {
        mockPayTicketWithProvider(...args);
        return { type: 'NOOP' };
    },
    getTicketTypesAndTaxes: (...args) => () => {
        mockGetTicketTypesAndTaxes(...args);
        return Promise.resolve();
    },
    getLoginCode: (...args) => {
        mockGetLoginCode(...args);
        return { type: 'NOOP' };
    },
    passwordlessLogin: (...args) => {
        mockPasswordlessLogin(...args);
        return { type: 'NOOP' };
    },
    goToLogin: (...args) => {
        mockGoToLogin(...args);
        return { type: 'NOOP' };
    },
    getMyInvitation: (...args) => () => {
        mockGetMyInvitation(...args);
        return Promise.resolve();
    },
    updateClock: (...args) => {
        mockUpdateClock(...args);
        return { type: 'NOOP' };
    },
    loadProfileData: (...args) => {
        mockLoadProfileData(...args);
        return { type: 'NOOP' };
    },
    applyPromoCode: (...args) => {
        mockApplyPromoCode(...args);
        return { type: 'NOOP' };
    },
    removePromoCode: (...args) => {
        mockRemovePromoCode(...args);
        return { type: 'NOOP' };
    },
    validatePromoCode: (...args) => {
        mockValidatePromoCode(...args);
        return { type: 'NOOP' };
    },
    discoverPromoCodes: (...args) => () => {
        mockDiscoverPromoCodes(...args);
        return Promise.resolve();
    },
    startWidgetLoading: (...args) => {
        mockStartWidgetLoading(...args);
        return { type: 'NOOP' };
    },
    stopWidgetLoading: (...args) => {
        mockStopWidgetLoading(...args);
        return { type: 'NOOP' };
    },
}));

// Mock external dependencies that the form imports
jest.mock('openstack-uicore-foundation/lib/components/ajaxloader', () => {
    return (props) => <div data-testid="ajax-loader" />;
});

jest.mock('openstack-uicore-foundation/lib/components/clock', () => {
    return (props) => <div data-testid="clock" />;
});

jest.mock('openstack-uicore-foundation/lib/security/constants', () => ({
    AUTH_ERROR_MISSING_AUTH_INFO: 'Missing Auth info',
    AUTH_ERROR_MISSING_REFRESH_TOKEN: 'missing Refresh Token',
    AUTH_ERROR_REFRESH_TOKEN_REQUEST_ERROR: 'Refresh Token Request Error',
}));

jest.mock('../../login', () => () => <div data-testid="login" />);
jest.mock('../../payment', () => () => <div data-testid="payment" />);
jest.mock('../../personal-information', () => () => <div data-testid="personal-info" />);
jest.mock('../../ticket-type', () => () => <div data-testid="ticket-type" />);
jest.mock('../../button-bar', () => () => <div data-testid="button-bar" />);
jest.mock('../../purchase-complete', () => () => <div data-testid="purchase-complete" />);
jest.mock('../../login-passwordless', () => () => <div data-testid="passwordless-login" />);
jest.mock('../../ticket-owned', () => () => <div data-testid="ticket-owned" />);
jest.mock('../../no-allowed-tickets', () => () => <div data-testid="no-allowed-tickets" />);
jest.mock('../../ticket-taxes-error', () => () => <div data-testid="ticket-taxes-error" />);

jest.mock('../../../utils/utils', () => ({
    buildTrackEvent: jest.fn(),
    getCurrentProvider: jest.fn(() => ({ publicKey: 'pk_test', provider: 'stripe' })),
    handleSentryException: jest.fn(),
    getCurrentUserLanguage: jest.fn(() => 'en'),
}));

jest.mock('react-spring', () => ({
    animated: { div: ({ children, style, ...rest }) => <div {...rest}>{children}</div> },
    config: { stiff: {} },
    useSpring: () => ({}),
}));

jest.mock('react-use', () => ({
    useMeasure: () => [jest.fn(), { height: 100 }],
}));

// Import default (which is withReduxProvider(RegistrationForm) but our mock makes it identity)
import RegistrationForm from '..';

const STEP_SELECT_TICKET_TYPE = 0;

const defaultReduxState = {
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
        settings: {
            apiBaseUrl: null,
            summitId: null,
            userProfile: null,
        },
        nowUtc: 1000000,
        promoCode: '',
        promoCodeVerified: null,
        promoCodeValidating: false,
        promoCodeAllowsReassign: true,
        discoveredPromoCodes: [],
        requestedTicketTypes: false,
    },
};

const createTestStore = (overrides = {}) => {
    const state = {
        ...defaultReduxState,
        registrationLiteState: {
            ...defaultReduxState.registrationLiteState,
            ...overrides,
        },
    };
    return createStore(() => state, applyMiddleware(thunk));
};

const defaultProps = {
    apiBaseUrl: 'https://api.test.com',
    clientId: 'test-client',
    getAccessToken: jest.fn(),
    goToMyOrders: jest.fn(),
    goToExtraQuestions: jest.fn(),
    completedExtraQuestions: jest.fn(),
    summitData: { id: 1, name: 'Test Summit', time_zone_id: 'UTC' },
    profileData: { given_name: 'John', family_name: 'Doe', email: 'john@example.com' },
    closeWidget: jest.fn(),
    trackEvent: jest.fn(),
    onPurchaseComplete: jest.fn(),
    authErrorCallback: jest.fn(),
    authUser: jest.fn(),
};

const renderWithStore = (props = {}, stateOverrides = {}) => {
    const store = createTestStore(stateOverrides);
    const closeHandlerRef = React.createRef();
    closeHandlerRef.current = () => {};

    return {
        ...render(
            <Provider store={store}>
                <RegistrationForm
                    {...defaultProps}
                    closeHandlerRef={closeHandlerRef}
                    {...props}
                />
            </Provider>
        ),
        closeHandlerRef,
        store,
    };
};

afterEach(() => {
    cleanup();
    jest.clearAllMocks();
});

it('closeHandlerRef is assigned handleCloseClick via useEffect', () => {
    const closeHandlerRef = React.createRef();
    closeHandlerRef.current = () => {};
    const initialRef = closeHandlerRef.current;

    render(
        <Provider store={createTestStore()}>
            <RegistrationForm
                {...defaultProps}
                closeHandlerRef={closeHandlerRef}
            />
        </Provider>
    );

    // After render, useEffect should have replaced the no-op with handleCloseClick
    expect(closeHandlerRef.current).not.toBe(initialRef);
    expect(typeof closeHandlerRef.current).toBe('function');
});

it('handleCloseClick calls removeReservedTicket when reservation exists', async () => {
    const mockReservation = { id: 123, status: 'Reserved' };
    const { closeHandlerRef } = renderWithStore({}, { reservation: mockReservation });

    await act(async () => {
        closeHandlerRef.current();
    });

    expect(mockRemoveReservedTicket).toHaveBeenCalled();
});

it('handleCloseClick calls clearWidgetState and changeStep when no reservation', () => {
    const { closeHandlerRef } = renderWithStore({}, { reservation: null });

    act(() => {
        closeHandlerRef.current();
    });

    expect(mockRemoveReservedTicket).not.toHaveBeenCalled();
    expect(mockChangeStep).toHaveBeenCalledWith(STEP_SELECT_TICKET_TYPE);
    expect(mockClearWidgetState).toHaveBeenCalled();
});

// Regression tests for the post-purchase remount loop. Effects must depend
// on the semantic signals (summitId, isAuthenticated, userId), not on the
// profileData / summitData object references — consumers commonly mint new
// references on no-op refreshes, and re-firing the effects would cascade
// through handleGetTicketTypesAndTaxes → setHasTicketData → null-render
// guard → child unmount → mount-effects re-firing.

it('does not refetch ticket types when profileData reference changes but content is identical', async () => {
    const initialProfile = { id: 42, given_name: 'John', email: 'john@example.com' };
    const summitData = { id: 1, name: 'Test Summit', time_zone_id: 'UTC' };
    const store = createTestStore();
    const closeHandlerRef = React.createRef();
    closeHandlerRef.current = () => {};

    const { rerender } = render(
        <Provider store={store}>
            <RegistrationForm
                {...defaultProps}
                summitData={summitData}
                profileData={initialProfile}
                closeHandlerRef={closeHandlerRef}
            />
        </Provider>
    );
    await act(async () => {});

    expect(mockGetTicketTypesAndTaxes).toHaveBeenCalledTimes(1);
    mockGetTicketTypesAndTaxes.mockClear();

    // New object identity, same semantic content (same id, same auth state).
    const newProfileSameContent = { id: 42, given_name: 'John', email: 'john@example.com' };
    rerender(
        <Provider store={store}>
            <RegistrationForm
                {...defaultProps}
                summitData={summitData}
                profileData={newProfileSameContent}
                closeHandlerRef={closeHandlerRef}
            />
        </Provider>
    );
    await act(async () => {});

    expect(mockGetTicketTypesAndTaxes).not.toHaveBeenCalled();
});

it('does not re-dispatch loadProfileData / discoverPromoCodes when profileData reference changes but userId is the same', async () => {
    const initialProfile = { id: 42, given_name: 'John' };
    const summitData = { id: 1, name: 'Test Summit', time_zone_id: 'UTC' };
    const store = createTestStore();
    const closeHandlerRef = React.createRef();
    closeHandlerRef.current = () => {};

    const { rerender } = render(
        <Provider store={store}>
            <RegistrationForm
                {...defaultProps}
                summitData={summitData}
                profileData={initialProfile}
                closeHandlerRef={closeHandlerRef}
            />
        </Provider>
    );
    await act(async () => {});

    expect(mockLoadProfileData).toHaveBeenCalledTimes(1);
    expect(mockDiscoverPromoCodes).toHaveBeenCalledTimes(1);
    mockLoadProfileData.mockClear();
    mockDiscoverPromoCodes.mockClear();

    const newProfileSameId = { id: 42, given_name: 'John' };
    rerender(
        <Provider store={store}>
            <RegistrationForm
                {...defaultProps}
                summitData={summitData}
                profileData={newProfileSameId}
                closeHandlerRef={closeHandlerRef}
            />
        </Provider>
    );
    await act(async () => {});

    expect(mockLoadProfileData).not.toHaveBeenCalled();
    expect(mockDiscoverPromoCodes).not.toHaveBeenCalled();
});

it('refires ticket-types fetch and promo discovery when summit id changes', async () => {
    const profileData = { id: 42, given_name: 'John' };
    const store = createTestStore();
    const closeHandlerRef = React.createRef();
    closeHandlerRef.current = () => {};

    const { rerender } = render(
        <Provider store={store}>
            <RegistrationForm
                {...defaultProps}
                summitData={{ id: 1, name: 'Summit One', time_zone_id: 'UTC' }}
                profileData={profileData}
                closeHandlerRef={closeHandlerRef}
            />
        </Provider>
    );
    await act(async () => {});

    expect(mockGetTicketTypesAndTaxes).toHaveBeenCalledTimes(1);
    expect(mockDiscoverPromoCodes).toHaveBeenCalledTimes(1);
    mockGetTicketTypesAndTaxes.mockClear();
    mockDiscoverPromoCodes.mockClear();

    rerender(
        <Provider store={store}>
            <RegistrationForm
                {...defaultProps}
                summitData={{ id: 2, name: 'Summit Two', time_zone_id: 'UTC' }}
                profileData={profileData}
                closeHandlerRef={closeHandlerRef}
            />
        </Provider>
    );
    await act(async () => {});

    expect(mockGetTicketTypesAndTaxes).toHaveBeenCalledTimes(1);
    expect(mockGetTicketTypesAndTaxes).toHaveBeenCalledWith(2);
    expect(mockDiscoverPromoCodes).toHaveBeenCalledTimes(1);
    expect(mockDiscoverPromoCodes).toHaveBeenCalledWith(2);
});
