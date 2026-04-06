import React from 'react';
import { cleanup, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider, ReactReduxContext } from 'react-redux';
import { withReduxProvider } from '../withReduxProvider';

// Mock the store module
jest.mock('../../store', () => {
    const mockStore = {
        dispatch: jest.fn(),
        getState: jest.fn(() => ({})),
        subscribe: jest.fn(() => jest.fn()),
        replaceReducer: jest.fn(),
    };
    const mockPersistor = {
        subscribe: jest.fn(),
        getState: jest.fn(() => ({ bootstrapped: true })),
        purge: jest.fn(),
        flush: jest.fn(),
        pause: jest.fn(),
        persist: jest.fn(),
        dispatch: jest.fn(),
    };
    return {
        getStore: jest.fn(() => mockStore),
        getPersistor: jest.fn(() => mockPersistor),
    };
});

const { getStore, getPersistor } = require('../../store');

// Simple test component that renders its props
const TestComponent = (props) => (
    <div data-testid="inner-component">
        {props.clientId && <span data-testid="client-id">{props.clientId}</span>}
        {props.apiBaseUrl && <span data-testid="api-base-url">{props.apiBaseUrl}</span>}
        {props.customProp && <span data-testid="custom-prop">{props.customProp}</span>}
    </div>
);
TestComponent.displayName = 'TestComponent';

afterEach(() => {
    cleanup();
    jest.clearAllMocks();
});

describe('withReduxProvider', () => {
    it('renders with Provider when no existing Redux context', () => {
        const Wrapped = withReduxProvider(TestComponent);

        const { getByTestId } = render(
            <Wrapped clientId="test-client" apiBaseUrl="https://api.test.com" getAccessToken={() => {}} />
        );

        expect(getByTestId('inner-component')).toBeInTheDocument();
        expect(getStore).toHaveBeenCalledWith('test-client', 'https://api.test.com', expect.any(Function));
        expect(getPersistor).toHaveBeenCalled();
    });

    it('skips Provider when already inside a Redux context', () => {
        const Wrapped = withReduxProvider(TestComponent);

        const outerStore = {
            dispatch: jest.fn(),
            getState: jest.fn(() => ({})),
            subscribe: jest.fn(() => jest.fn()),
            replaceReducer: jest.fn(),
        };

        // Reset call counts before this test
        getStore.mockClear();
        getPersistor.mockClear();

        const { getByTestId } = render(
            <Provider store={outerStore}>
                <Wrapped clientId="test-client" apiBaseUrl="https://api.test.com" getAccessToken={() => {}} />
            </Provider>
        );

        expect(getByTestId('inner-component')).toBeInTheDocument();
        // Should NOT have called getStore because an existing Redux context was detected
        expect(getStore).not.toHaveBeenCalled();
        expect(getPersistor).not.toHaveBeenCalled();
    });

    it('passes props through to the wrapped component', () => {
        const Wrapped = withReduxProvider(TestComponent);
        const getAccessToken = jest.fn();

        const { getByTestId } = render(
            <Wrapped
                clientId="my-client-id"
                apiBaseUrl="https://my-api.example.com"
                getAccessToken={getAccessToken}
                customProp="hello-world"
            />
        );

        expect(getByTestId('client-id')).toHaveTextContent('my-client-id');
        expect(getByTestId('api-base-url')).toHaveTextContent('https://my-api.example.com');
        expect(getByTestId('custom-prop')).toHaveTextContent('hello-world');
    });

    it('caches store across re-renders', () => {
        const Wrapped = withReduxProvider(TestComponent);
        const getAccessToken = jest.fn();

        getStore.mockClear();

        const { rerender } = render(
            <Wrapped clientId="test-client" apiBaseUrl="https://api.test.com" getAccessToken={getAccessToken} />
        );

        // Re-render with the same props
        rerender(
            <Wrapped clientId="test-client" apiBaseUrl="https://api.test.com" getAccessToken={getAccessToken} />
        );

        // Re-render a third time
        rerender(
            <Wrapped clientId="test-client" apiBaseUrl="https://api.test.com" getAccessToken={getAccessToken} />
        );

        // getStore should only have been called once due to the useRef cache
        expect(getStore).toHaveBeenCalledTimes(1);
    });

    it('sets displayName on the wrapped component', () => {
        const Wrapped = withReduxProvider(TestComponent);
        expect(Wrapped.displayName).toBe('WithReduxProvider(TestComponent)');
    });
});
