// TicketOwnedComponent.test.js

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

import TicketOwnedComponent from '..'; 

afterEach(cleanup);

describe('TicketOwnedComponent', () => {    

    it('renders correctly with one ticket without "ticket" in the name', () => {
        const ownedTickets = [{ qty: 1, type_name: 'General Admission' }];
        const { getByTestId } = render(<TicketOwnedComponent ownedTickets={ownedTickets} />);
        const alert = getByTestId('owned-tickets');
        expect(alert).toHaveTextContent(
            'You have already ordered 1 General Admission Ticket(s). If you would like to order more, please do so below.'
        );
    });

    it('renders correctly with one ticket with "ticket" in the name', () => {
        const ownedTickets = [{ qty: 1, type_name: 'VIP Ticket' }];
        const { getByTestId } = render(<TicketOwnedComponent ownedTickets={ownedTickets} />);
        const alert = getByTestId('owned-tickets');
        expect(alert).toHaveTextContent(
            'You have already ordered 1 VIP Ticket(s). If you would like to order more, please do so below.'
        );
    });

    it('renders correctly with multiple tickets', () => {
        const ownedTickets = [
            { qty: 2, type_name: 'General Admission' },
            { qty: 1, type_name: 'VIP Ticket' },
            { qty: 3, type_name: 'Student Pass' },
        ];
        const { getByTestId } = render(<TicketOwnedComponent ownedTickets={ownedTickets} />);
        const alert = getByTestId('owned-tickets');
        expect(alert).toHaveTextContent(
            'You have already ordered 2 General Admission Ticket(s), 1 VIP Ticket and 3 Student Pass. If you would like to order more, please do so below.'
        );
    });
    
});