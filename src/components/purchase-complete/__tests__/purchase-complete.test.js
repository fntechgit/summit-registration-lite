import React from 'react';
import { cleanup, render, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Settable clock seed (the `mock` prefix is the only identifier jest.mock
// allows the factory to capture via closure).
let mockClockNow = 0;
jest.mock('openstack-uicore-foundation/lib/components/clock-context', () => ({
    useClockSelector: (selector) => selector(mockClockNow),
}));

// epochToMomentTimeZone returns an object with .format(). Keep it cheap and
// deterministic so the test doesn't depend on moment / timezone data.
jest.mock('openstack-uicore-foundation/lib/utils/methods', () => ({
    epochToMomentTimeZone: jest.fn(() => ({ format: (fmt) => fmt === 'MMMM D' ? 'January 1' : '09:00 AM' })),
}));

jest.mock('openstack-uicore-foundation/lib/components/raw-html', () => (props) => <div>{props.children}</div>);

import PurchaseComplete from '..';

const SUMMIT = {
    start_date: 1_700_000_000, // ~Nov 2023
    end_date: 1_700_086_400,
    time_zone_id: 'UTC',
    time_zone_label: 'UTC',
};

const defaultProps = {
    checkout: { tickets: [{ owner: { email: 'john@example.com' }, badge: {} }] },
    user: { email: 'john@example.com' },
    onPurchaseComplete: jest.fn(),
    goToExtraQuestions: jest.fn(),
    goToEvent: jest.fn(),
    goToMyOrders: jest.fn(),
    // The component waits on this promise before rendering the branch we want
    // to assert, so resolve it synchronously to a deterministic value.
    completedExtraQuestions: jest.fn(() => Promise.resolve(false)),
    summit: SUMMIT,
    clearWidgetState: jest.fn(),
    closeWidget: jest.fn(),
    supportEmail: 'help@example.com',
    hasVirtualAccessLevel: false,
};

afterEach(() => {
    cleanup();
    jest.clearAllMocks();
    mockClockNow = 0;
});

const renderAndFlush = async (props = {}) => {
    let utils;
    await act(async () => {
        utils = render(<PurchaseComplete {...defaultProps} {...props} />);
    });
    return utils;
};

it('renders the active CTA path when the clock seed falls inside the summit window', async () => {
    mockClockNow = SUMMIT.start_date + 1000;
    const { queryByText } = await renderAndFlush();

    // The "event will start on…" copy belongs to the inactive branch.
    expect(queryByText(/event will start on/i)).not.toBeInTheDocument();
    // The CTA in the active path with no required extra questions falls through
    // to the My Orders/Tickets button.
    expect(queryByText('View My Orders/Tickets')).toBeInTheDocument();
});

it('renders the "event will start" copy when the clock seed is outside the summit window', async () => {
    mockClockNow = SUMMIT.end_date + 1; // one second past end
    const { queryByText } = await renderAndFlush();

    expect(queryByText(/The event will start on January 1 at 09:00 AM UTC/)).toBeInTheDocument();
    // CTA still renders in the inactive branch (different layout).
    expect(queryByText('View My Orders/Tickets')).toBeInTheDocument();
});
