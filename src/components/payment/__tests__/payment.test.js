import React, { useState } from 'react';
import { render, act } from '@testing-library/react';

import PaymentComponent from '../index';
import ButtonBarComponent from '../../button-bar';
import {
    ERROR_TYPE_PAYMENT,
    PAYMENT_PROVIDER_LAWPAY,
    PAYMENT_PROVIDER_STRIPE,
    STEP_PAYMENT,
} from '../../../utils/constants';

// Stripe's SDK needs a live iframe, so the PaymentElement is stubbed and its
// onReady / onLoadError props are captured: a test fires them to simulate Stripe.
let stripeElementProps = null;

jest.mock('@stripe/stripe-js', () => ({
    loadStripe: () => Promise.resolve({}),
}));

jest.mock('@stripe/react-stripe-js', () => ({
    Elements: ({ children }) => <>{children}</>,
    useStripe: () => ({}),
    useElements: () => ({}),
    PaymentElement: (props) => {
        stripeElementProps = props;
        return <div data-testid="payment-element" />;
    },
}));

jest.mock('react-spring', () => ({
    animated: { div: ({ children, style, ...rest }) => <div {...rest}>{children}</div> },
    config: { stiff: {} },
    useSpring: () => ({}),
}));

jest.mock('react-use', () => ({
    useMeasure: () => [jest.fn(), { height: 100 }],
}));

// the AffiniPay script tag is irrelevant here: tests set window.AffiniPay directly
jest.mock('react-helmet', () => ({ Helmet: () => null }));

const reservation = {
    id: 1,
    summit_id: 1,
    amount: 1000,
    amount_in_cents: 100000,
    currency: 'USD',
    owner_first_name: 'Ada',
    owner_last_name: 'Lovelace',
};

const onError = jest.fn();

// Same wiring as RegistrationFormContent: a local flag set by the payment form,
// read by the button bar.
const Harness = ({ provider, reservation }) => {
    const [paymentReady, setPaymentReady] = useState(false);
    return (
        <>
            <PaymentComponent
                isActive
                provider={provider}
                providerKey="pk_test"
                reservation={reservation}
                payTicket={jest.fn()}
                userProfile={{ email: 'ada@example.test' }}
                timestamp={1700000000}
                onError={onError}
                onPaymentReady={setPaymentReady}
            />
            <ButtonBarComponent
                step={STEP_PAYMENT}
                formValues={{}}
                removeReservedTicket={jest.fn()}
                changeStep={jest.fn()}
                paymentReady={paymentReady}
            />
        </>
    );
};

const payButton = () => document.getElementById('payment-form-btn');

beforeEach(() => {
    stripeElementProps = null;
    onError.mockClear();
    delete window.AffiniPay;
});

describe('Pay Now readiness - Stripe', () => {
    it('stays disabled until the PaymentElement is ready, then gets enabled', () => {
        render(<Harness provider={PAYMENT_PROVIDER_STRIPE} reservation={reservation} />);

        expect(payButton().disabled).toBe(true);
        expect(payButton().textContent).toContain('Loading');

        act(() => stripeElementProps.onReady({ clear: jest.fn() }));

        expect(payButton().disabled).toBe(false);
        expect(payButton().textContent).toContain('Pay Now');
    });

    it('reports a load error and keeps Pay Now disabled', () => {
        render(<Harness provider={PAYMENT_PROVIDER_STRIPE} reservation={reservation} />);

        const error = { message: 'Failed to load Stripe' };
        act(() => stripeElementProps.onLoadError({ elementType: 'payment', error }));

        expect(onError).toHaveBeenCalledWith(expect.objectContaining({ type: ERROR_TYPE_PAYMENT, msg: 'Failed to load Stripe' }));
        expect(payButton().disabled).toBe(true);
    });

    it('disables Pay Now again when the payment form unmounts', () => {
        const { rerender } = render(<Harness provider={PAYMENT_PROVIDER_STRIPE} reservation={reservation} />);
        act(() => stripeElementProps.onReady({ clear: jest.fn() }));
        expect(payButton().disabled).toBe(false);

        // reservation cleared (e.g. Back succeeded): StripeForm unmounts
        rerender(<Harness provider={PAYMENT_PROVIDER_STRIPE} reservation={null} />);

        expect(payButton().disabled).toBe(true);
    });
});

describe('Pay Now readiness - LawPay', () => {
    const mockAffiniPay = () => {
        window.AffiniPay = { HostedFields: { initializeFields: jest.fn(() => ({ getPaymentToken: jest.fn() })) } };
    };

    it('stays disabled until the AffiniPay hosted fields start, then gets enabled', () => {
        // script not loaded yet: fields can't start
        const { rerender } = render(<Harness provider={PAYMENT_PROVIDER_LAWPAY} reservation={null} />);

        expect(payButton().disabled).toBe(true);
        expect(payButton().textContent).toContain('Loading');

        // script loaded by the time the reservation arrives: fields start
        mockAffiniPay();
        rerender(<Harness provider={PAYMENT_PROVIDER_LAWPAY} reservation={reservation} />);

        expect(window.AffiniPay.HostedFields.initializeFields).toHaveBeenCalled();
        expect(payButton().disabled).toBe(false);
        expect(payButton().textContent).toContain('Pay Now');
    });
});
