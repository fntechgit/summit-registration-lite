import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock withReduxProvider as identity HOC (modal default export wraps with it)
jest.mock('../../../utils/withReduxProvider', () => ({
    withReduxProvider: (Component) => Component,
    __esModule: true,
    default: (Component) => Component,
}));

// Capture props passed to RegistrationForm
let capturedFormProps = {};

jest.mock('../../registration-form', () => ({
    RegistrationForm: (props) => {
        capturedFormProps = props;
        return <div data-testid="registration-form" />;
    },
}));

// Import after mocks are set up
import RegistrationModal from '..';

const requiredProps = {
    apiBaseUrl: 'https://api.test.com',
    clientId: 'test-client',
    getAccessToken: jest.fn(),
    goToMyOrders: jest.fn(),
    goToExtraQuestions: jest.fn(),
    completedExtraQuestions: jest.fn(),
    summitData: { id: 1, name: 'Test Summit' },
    profileData: { given_name: 'John', family_name: 'Doe' },
};

afterEach(() => {
    cleanup();
    capturedFormProps = {};
});

it('close button calls closeHandlerRef.current when clicked', () => {
    const mockCloseWidget = jest.fn();
    const { container } = render(
        <RegistrationModal {...requiredProps} closeWidget={mockCloseWidget} />
    );

    // The modal assigns a no-op to closeHandlerRef.current initially.
    // Simulate the form setting a real handler via the ref.
    const mockHandler = jest.fn();
    capturedFormProps.closeHandlerRef.current = mockHandler;

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
    const mockCloseWidget = jest.fn();
    const extraProp = 'extra-value';

    render(
        <RegistrationModal
            {...requiredProps}
            closeWidget={mockCloseWidget}
            customProp={extraProp}
        />
    );

    // Verify summitData is forwarded
    expect(capturedFormProps.summitData).toEqual(requiredProps.summitData);

    // Verify closeWidget is forwarded
    expect(capturedFormProps.closeWidget).toBe(mockCloseWidget);

    // Verify closeHandlerRef is a ref object (has .current)
    expect(capturedFormProps.closeHandlerRef).toBeDefined();
    expect(capturedFormProps.closeHandlerRef).toHaveProperty('current');

    // Verify spread props are forwarded
    expect(capturedFormProps.customProp).toBe(extraProp);
    expect(capturedFormProps.profileData).toEqual(requiredProps.profileData);
    expect(capturedFormProps.getAccessToken).toBe(requiredProps.getAccessToken);
});
