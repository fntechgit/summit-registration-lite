import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import T from 'i18n-react';
import TicketTypeComponent from '..';

T.setTexts(require('../../../i18n/en.json'));

const unlimitedStockTicket = {
    id: 1,
    name: 'General Admission',
    currency: 'USD',
    currency_symbol: '$',
    quantity_2_sell: 0,          // API semantics: 0 = unlimited stock
    quantity_sold: 10,
    max_quantity_per_order: 4,   // real, binding per-order cap
};

it('shows the per-order limit notice when stock is unlimited (quantity_2_sell 0)', () => {
    const { getByText } = render(
        <TicketTypeComponent
            isActive
            allowedTicketTypes={[unlimitedStockTicket]}
            originalTicketTypes={[unlimitedStockTicket]}
            taxTypes={[]}
            changeForm={jest.fn()}
            trackViewItem={jest.fn()}
            allowPromoCodes={false}
            reservation={{ tickets: [{ ticket_type_id: 1 }] }}
        />
    );

    // The stepper caps at 4 (getTicketMaxQuantity treats quantity_2_sell 0 as
    // unlimited stock), so the notice explaining that cap must be shown.
    expect(getByText('This ticket type is limited to 4 per order.')).toBeInTheDocument();
});
