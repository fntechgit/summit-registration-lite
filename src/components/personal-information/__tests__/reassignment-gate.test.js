import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock uicore components to avoid @react-pdf dependency resolution failure
jest.mock('openstack-uicore-foundation/lib/components', () => ({
    RadioList: ({ options, id }) => (
        <div data-testid={`radio-list-${id}`}>
            {options.map((op) => (
                <div key={op.value}>
                    <input type="radio" id={`radio_${id}_${op.value}`} value={op.value} readOnly />
                    <label htmlFor={`radio_${id}_${op.value}`}>{op.label}</label>
                </div>
            ))}
        </div>
    ),
}));

jest.mock('openstack-uicore-foundation/lib/components/inputs/company-input-v2', () => {
    return function MockCompanyInput() {
        return <input data-testid="company-mock" />;
    };
});

import PersonalInfoComponent from '..';

const mockProfile = {
    given_name: 'Test',
    family_name: 'User',
    email: 'test@email.com',
    company: '',
};

const baseFormValues = {
    ticketType: { id: 1, name: 'General', cost: 100, allows_to_reassign: true },
    ticketQuantity: 1,
    personalInformation: null,
    paymentInformation: null,
};

const mockCallback = jest.fn();

afterEach(cleanup);

it('shows assignment radio when reassignment is allowed', () => {
    render(
        <PersonalInfoComponent
            isActive={true}
            formValues={baseFormValues}
            userProfile={mockProfile}
            handleCompanyError={mockCallback}
            summitId={1}
            promoCodeAllowsReassign={true}
        />
    );
    expect(screen.getByText('Myself')).toBeTruthy();
    expect(screen.getByText('Someone Else')).toBeTruthy();
    expect(screen.getByText('Leave Unassigned')).toBeTruthy();
});

it('hides assignment radio when promo code disallows reassignment', () => {
    render(
        <PersonalInfoComponent
            isActive={true}
            formValues={baseFormValues}
            userProfile={mockProfile}
            handleCompanyError={mockCallback}
            summitId={1}
            promoCodeAllowsReassign={false}
        />
    );
    expect(screen.queryByText('Myself')).toBeNull();
    expect(screen.queryByText('Someone Else')).toBeNull();
});

it('hides assignment radio when ticket type disallows reassignment', () => {
    const formValues = {
        ...baseFormValues,
        ticketType: { ...baseFormValues.ticketType, allows_to_reassign: false },
    };
    render(
        <PersonalInfoComponent
            isActive={true}
            formValues={formValues}
            userProfile={mockProfile}
            handleCompanyError={mockCallback}
            summitId={1}
            promoCodeAllowsReassign={true}
        />
    );
    expect(screen.queryByText('Myself')).toBeNull();
    expect(screen.queryByText('Someone Else')).toBeNull();
});

it('defaults promoCodeAllowsReassign to true when not provided', () => {
    render(
        <PersonalInfoComponent
            isActive={true}
            formValues={baseFormValues}
            userProfile={mockProfile}
            handleCompanyError={mockCallback}
            summitId={1}
        />
    );
    expect(screen.getByText('Myself')).toBeTruthy();
});
