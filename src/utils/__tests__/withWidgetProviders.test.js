import React from 'react';
import { cleanup, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider, connect } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { useClockSelector } from 'openstack-uicore-foundation/lib/components/clock-context';

import { withWidgetProviders } from '../withWidgetProviders';

// Mock the store module
const mockStore = { getState: jest.fn(), subscribe: jest.fn(), dispatch: jest.fn() };
const mockPersistor = { subscribe: jest.fn(), getState: jest.fn(() => ({ bootstrapped: true })), purge: jest.fn() };
const mockGetStore = jest.fn(() => mockStore);
const mockGetPersistor = jest.fn(() => mockPersistor);

jest.mock('../../store', () => ({
    getStore: (...args) => mockGetStore(...args),
    getPersistor: (...args) => mockGetPersistor(...args),
}));

// Mock PersistGate to render children immediately (avoids async rehydration)
jest.mock('redux-persist/integration/react', () => ({
    PersistGate: ({ children }) => children,
}));

afterEach(() => {
    cleanup();
    jest.clearAllMocks();
});

const StubComponent = ({ clientId, apiBaseUrl, getAccessToken, ...rest }) => <div data-testid="stub" {...rest} />;
StubComponent.displayName = 'StubComponent';

it('renders with Provider and creates a store via getStore/getPersistor', () => {
    const Wrapped = withWidgetProviders(StubComponent);
    const { getByTestId } = render(
        <Wrapped clientId="test-client" apiBaseUrl="https://api.test.com" getAccessToken={() => 'token'} />
    );

    expect(mockGetStore).toHaveBeenCalledWith('test-client', 'https://api.test.com', expect.any(Function));
    expect(mockGetPersistor).toHaveBeenCalled();
    expect(getByTestId('stub')).toBeInTheDocument();
});

it('passes props through to the wrapped component', () => {
    const Wrapped = withWidgetProviders(StubComponent);
    const { getByTestId } = render(
        <Wrapped clientId="c1" apiBaseUrl="https://api.test.com" getAccessToken={() => 'token'} data-custom="hello" />
    );

    const el = getByTestId('stub');
    expect(el).toHaveAttribute('data-custom', 'hello');
});

it('caches store across re-renders (class constructor runs once)', () => {
    const Wrapped = withWidgetProviders(StubComponent);
    const { rerender } = render(
        <Wrapped clientId="c1" apiBaseUrl="https://api.test.com" getAccessToken={() => 'token'} />
    );

    expect(mockGetStore).toHaveBeenCalledTimes(1);

    rerender(
        <Wrapped clientId="c1" apiBaseUrl="https://api.test.com" getAccessToken={() => 'token'} someProp="changed" />
    );

    // Constructor only runs once for the same instance, so getStore should still be 1
    expect(mockGetStore).toHaveBeenCalledTimes(1);
});

it('sets displayName based on wrapped component', () => {
    const Wrapped = withWidgetProviders(StubComponent);
    expect(Wrapped.displayName).toBe('WithWidgetProviders(StubComponent)');
});

it('uses fallback displayName for anonymous component', () => {
    const Wrapped = withWidgetProviders(() => <div />);
    expect(Wrapped.displayName).toBe('WithWidgetProviders(Component)');
});

it('provides ClockProvider so useClockSelector resolves against a live timestamp', () => {
    const ClockConsumer = () => {
        const year = useClockSelector((nowUtc) =>
            nowUtc ? new Date(nowUtc * 1000).getUTCFullYear() : null
        );
        return <div data-testid="year">{year ?? 'null'}</div>;
    };
    const Wrapped = withWidgetProviders(ClockConsumer);
    const { getByTestId } = render(
        <Wrapped
            clientId="c1"
            apiBaseUrl="https://api.test.com"
            getAccessToken={() => 'token'}
            summitData={{ time_zone_id: 'UTC' }}
        />
    );
    expect(Number(getByTestId('year').textContent)).toBeGreaterThanOrEqual(2024);
});

it('keeps useClockSelector live after summitData.time_zone_id changes', () => {
    // PureComponent re-renders on prop change, which feeds a fresh `timezone`
    // and `now` into ClockProvider. The consumer must still resolve to a
    // valid timestamp after that propagation.
    const ClockConsumer = () => {
        const year = useClockSelector((nowUtc) =>
            nowUtc ? new Date(nowUtc * 1000).getUTCFullYear() : null
        );
        return <div data-testid="year">{year ?? 'null'}</div>;
    };
    const Wrapped = withWidgetProviders(ClockConsumer);
    const { getByTestId, rerender } = render(
        <Wrapped
            clientId="c1"
            apiBaseUrl="https://api.test.com"
            getAccessToken={() => 'token'}
            summitData={{ time_zone_id: 'UTC' }}
        />
    );
    expect(Number(getByTestId('year').textContent)).toBeGreaterThanOrEqual(2024);

    rerender(
        <Wrapped
            clientId="c1"
            apiBaseUrl="https://api.test.com"
            getAccessToken={() => 'token'}
            summitData={{ time_zone_id: 'America/New_York' }}
        />
    );
    expect(Number(getByTestId('year').textContent)).toBeGreaterThanOrEqual(2024);
});

describe('REGRESSION: widget works under a foreign Provider', () => {
    // This test proves the HOC always creates its own Provider, regardless of
    // any outer Provider. A connect()-based component that reads from
    // registrationLiteState should render fine even when wrapped in a foreign
    // Provider whose store does NOT have that state slice.

    beforeEach(() => {
        jest.restoreAllMocks();
    });

    it('renders a connect()-based component under a foreign Provider without throwing', () => {
        // Restore real modules for this test
        jest.resetModules();

        // We need real redux Provider/connect, which are already imported above.
        // Create a connected component that reads from registrationLiteState
        const InnerComponent = ({ widgetLoading }) => (
            <div data-testid="connected-inner">
                {widgetLoading ? 'loading' : 'ready'}
            </div>
        );

        const ConnectedComponent = connect(
            ({ registrationLiteState }) => ({
                widgetLoading: registrationLiteState ? registrationLiteState.widgetLoading : false,
            })
        )(InnerComponent);

        // Create a real store that HAS registrationLiteState for the HOC's own Provider
        const realStore = createStore(
            combineReducers({
                registrationLiteState: (state = { widgetLoading: false }, action) => state,
            })
        );

        // Override the mock so the HOC's getStore returns our real store
        mockGetStore.mockReturnValue(realStore);

        const WrappedWithHOC = withWidgetProviders(ConnectedComponent);

        // Create a FOREIGN store that does NOT have registrationLiteState
        const foreignStore = createStore(
            combineReducers({
                someOtherState: (state = {}, action) => state,
            })
        );

        // Wrap with foreign Provider, then the HOC-wrapped component
        // If the HOC did NOT create its own Provider, connect() would read
        // from foreignStore and crash because registrationLiteState is undefined.
        const { getByTestId } = render(
            <Provider store={foreignStore}>
                <WrappedWithHOC
                    clientId="test"
                    apiBaseUrl="https://api.test.com"
                    getAccessToken={() => 'token'}
                />
            </Provider>
        );

        expect(getByTestId('connected-inner')).toBeInTheDocument();
        expect(getByTestId('connected-inner')).toHaveTextContent('ready');
    });
});
