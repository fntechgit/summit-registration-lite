import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TicketDropdownComponent from '../index';

// A ticket type on public sale that a prepaid code also claims is returned
// twice: the regular offer and the prepaid one. They share an id and differ by
// subtype, so the list has to be keyed on the pair. Keyed on the id alone React
// treats them as one element, which is a warning today and dropped or
// mis-ordered rows the moment the list is reordered or filtered.

const offer = (overrides) => ({
    id: 188,
    name: 'General Ticket',
    cost: 700,
    currency: 'USD',
    currency_symbol: '$',
    quantity_2_sell: 100,
    quantity_sold: 0,
    max_quantity_per_order: 10,
    sub_type: 'Regular',
    ...overrides,
});

const bothOffers = [
    offer(),
    offer({ name: 'General Ticket [PREPAID]', cost: 0, sub_type: 'PrePaid', quantity_2_sell: 1 }),
];

describe('ticket dropdown with both offers of one type', () => {
    it('renders each offer without a duplicate key', () => {
        const errors = [];
        const spy = jest.spyOn(console, 'error').mockImplementation((...args) => {
            errors.push(String(args[0]));
        });

        render(
            <TicketDropdownComponent
                selectedTicket={null}
                ticketTypes={bothOffers}
                taxTypes={[]}
                onTicketSelect={jest.fn()}
            />
        );
        // The list only exists while the dropdown is open.
        fireEvent.click(screen.getByTestId('ticket-dropdown'));

        expect(errors.filter(e => e.includes('same key'))).toEqual([]);
        expect(screen.getByTestId('ticket-list').children).toHaveLength(2);
        spy.mockRestore();
    });
});
