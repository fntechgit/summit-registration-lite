import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock withReduxProvider as identity HOC (returns component as-is)
jest.mock('../../../utils/withReduxProvider', () => ({
    withReduxProvider: (Component) => Component,
}));

// Mock RegistrationForm to capture the props it receives
let capturedFormProps = {};
jest.mock('../../registration-form', () => {
    const MockRegistrationForm = (props) => {
        capturedFormProps = props;
        return <div data-testid="registration-form" />;
    };
    return MockRegistrationForm;
});

// The default export from registration-modal/index.js applies withReduxProvider,
// but since we mocked it as identity, we get the raw RegistrationModal component.
import RegistrationModal from '..';

const requiredProps = {
    apiBaseUrl: 'https://api.test.com',
    clientId: 'test-client',
    getAccessToken: jest.fn(),
    goToMyOrders: jest.fn(),
    goToExtraQuestions: jest.fn(),
    completedExtraQuestions: jest.fn(),
    summitData: { name: 'Test Summit', id: 1 },
    profileData: { given_name: 'John', family_name: 'Doe' },
};

afterEach(() => {
    cleanup();
    capturedFormProps = {};
});

describe('RegistrationModal', () => {
    it('close button calls closeHandlerRef.current', () => {
        const closeWidget = jest.fn();
        const { container } = render(
            <RegistrationModal {...requiredProps} closeWidget={closeWidget} />
        );

        // The RegistrationForm mock received closeHandlerRef — simulate the real
        // component assigning a handler to it (which the real RegistrationForm does
        // inside a useEffect).
        const mockHandler = jest.fn();
        capturedFormProps.closeHandlerRef.current = mockHandler;

        // Click the close icon
        const closeIcon = container.querySelector('i.fa-close');
        expect(closeIcon).toBeInTheDocument();
        fireEvent.click(closeIcon);

        expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('close button is not rendered when closeWidget is null', () => {
        const { container } = render(
            <RegistrationModal {...requiredProps} closeWidget={null} />
        );

        const closeIcon = container.querySelector('i.fa-close');
        expect(closeIcon).not.toBeInTheDocument();
    });

    it('close button is not rendered when closeWidget is undefined', () => {
        const { closeWidget, ...propsWithoutClose } = requiredProps;
        const { container } = render(
            <RegistrationModal {...propsWithoutClose} />
        );

        const closeIcon = container.querySelector('i.fa-close');
        expect(closeIcon).not.toBeInTheDocument();
    });

    it('forwards all props to RegistrationForm', () => {
        const closeWidget = jest.fn();
        const extraProp = 'extra-value';

        render(
            <RegistrationModal
                {...requiredProps}
                closeWidget={closeWidget}
                loginInitialEmailInputValue="test@example.com"
                customExtra={extraProp}
            />
        );

        // Verify summitData is forwarded
        expect(capturedFormProps.summitData).toEqual(requiredProps.summitData);
        // Verify closeWidget is forwarded
        expect(capturedFormProps.closeWidget).toBe(closeWidget);
        // Verify spread props reach the child
        expect(capturedFormProps.apiBaseUrl).toBe('https://api.test.com');
        expect(capturedFormProps.clientId).toBe('test-client');
        expect(capturedFormProps.loginInitialEmailInputValue).toBe('test@example.com');
        expect(capturedFormProps.customExtra).toBe('extra-value');
        // Verify closeHandlerRef is passed
        expect(capturedFormProps.closeHandlerRef).toBeDefined();
        expect(typeof capturedFormProps.closeHandlerRef.current).toBe('function');
    });
});
