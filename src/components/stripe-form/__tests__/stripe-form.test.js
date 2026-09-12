import React from 'react';
import { render } from '@testing-library/react';

import StripeForm from '../index';

// Stripe's own hooks reach for a real Elements context and a live iframe, so the
// SDK is stubbed down to the one thing these tests care about: where in the tree
// the PaymentElement ends up.
// Every DOM node the mock is ever mounted into, so a test can assert the Element
// was never attached inside a shadow tree, not even for one render.
const mountRoots = [];

jest.mock('@stripe/react-stripe-js', () => ({
    useStripe: () => ({}),
    useElements: () => ({ getElement: () => null }),
    PaymentElement: () => (
        <div
            data-testid="payment-element"
            ref={(node) => { if (node) mountRoots.push(node.getRootNode()); }}
        />
    ),
}));

beforeEach(() => {
    mountRoots.length = 0;
    document.body.innerHTML = '';
});

const props = {
    reservation: { owner_first_name: 'Ada', owner_last_name: 'Lovelace' },
    payTicket: jest.fn(),
    userProfile: {},
    provider: 'stripe',
    hidePostalCode: false,
    stripeReturnUrl: 'https://example.test/return',
    onError: jest.fn(),
};

const renderInShadowRoot = () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const shadowRoot = host.attachShadow({ mode: 'open' });
    const mountPoint = document.createElement('div');
    shadowRoot.appendChild(mountPoint);
    render(<StripeForm {...props} />, { container: mountPoint });
    return { host, shadowRoot };
};

describe('StripeForm shadow DOM handling', () => {
    it('keeps the PaymentElement in the light DOM when shadow-mounted', () => {
        const { host, shadowRoot } = renderInShadowRoot();

        // Stripe cannot reach an element inside a shadow tree, so the wrapper has
        // to be a child of the host itself.
        const slotted = host.querySelector(':scope > [slot="stripe-payment"]');
        expect(slotted).not.toBeNull();
        expect(slotted.querySelector('[data-testid="payment-element"]')).not.toBeNull();
        expect(shadowRoot.contains(slotted)).toBe(false);
    });

    it('leaves a matching slot in the form to display it in flow', () => {
        const { shadowRoot } = renderInShadowRoot();

        const form = shadowRoot.querySelector('form#payment-form');
        expect(form.querySelector('slot[name="stripe-payment"]')).not.toBeNull();
    });

    it('mounts the PaymentElement inline when there is no shadow root', () => {
        const { container } = render(<StripeForm {...props} />);

        const form = container.querySelector('form#payment-form');
        expect(form.querySelector('[data-testid="payment-element"]')).not.toBeNull();
        expect(form.querySelector('slot')).toBeNull();
        expect(document.querySelector('[slot="stripe-payment"]')).toBeNull();
    });

    it('never attaches the PaymentElement inside the shadow tree', () => {
        // The callback ref resolves the mount context during commit, and nothing
        // is rendered until it has. Without that wait the first render would mount
        // the Element in the shadow tree, where Stripe cannot reach it.
        const { shadowRoot } = renderInShadowRoot();

        expect(mountRoots.length).toBeGreaterThan(0);
        expect(mountRoots).not.toContain(shadowRoot);
    });
});
