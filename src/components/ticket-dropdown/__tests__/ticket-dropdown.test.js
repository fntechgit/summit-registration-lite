import React from 'react';
import { cleanup, fireEvent, render as rtlRender, render, waitFor } from '@testing-library/react';
import { screen } from '@testing-library/dom'
import '@testing-library/jest-dom';

import TicketDropdownComponent from "..";

const mockTicketTypes = [
    { id: 11, created: 1596642618, last_edited: 1596642618, name: "General", description: "nada", external_id: null, summit_id: 17, cost: 100, currency: "USD", quantity_2_sell: 10000000, max_quantity_per_order: 2, sales_start_date: 1596783600, sales_end_date: 2625036400, badge_type_id: 0, quantity_sold: 281 },
    { id: 16, created: 1604846262, last_edited: 1604846262, name: "Free", description: "", external_id: null, summit_id: 17, cost: 0, currency: "USD", quantity_2_sell: 100000000, max_quantity_per_order: 4, sales_start_date: 1604822400, sales_end_date: 2625036400, badge_type_id: 9, quantity_sold: 10 },
    { id: 18, created: 1623425882, last_edited: 1623425882, name: "VIP", description: "VIP", external_id: null, summit_id: 17, cost: 250, currency: "USD", quantity_2_sell: 1000, max_quantity_per_order: 4, sales_start_date: null, sales_end_date: null, badge_type_id: 16, quantity_sold: 5 }
];

const mockTicketsSoldOut = [
    { id: 11, created: 1596642618, last_edited: 1596642618, name: "General", description: "nada", external_id: null, summit_id: 17, cost: 100, currency: "USD", quantity_2_sell: 10000000, max_quantity_per_order: 2, sales_start_date: 1596783600, sales_end_date: 2625036400, badge_type_id: 0, quantity_sold: 10000000 },
    { id: 16, created: 1604846262, last_edited: 1604846262, name: "Free", description: "", external_id: null, summit_id: 17, cost: 0, currency: "USD", quantity_2_sell: 100000000, max_quantity_per_order: 4, sales_start_date: 1604822400, sales_end_date: 2625036400, badge_type_id: 9, quantity_sold: 10 },
    { id: 18, created: 1623425882, last_edited: 1623425882, name: "VIP", description: "VIP", external_id: null, summit_id: 17, cost: 250, currency: "USD", quantity_2_sell: 1000, max_quantity_per_order: 4, sales_start_date: null, sales_end_date: null, badge_type_id: 16, quantity_sold: 1000 }
];

const mockOutOfDateTickets = [
    { id: 11, created: 1596642618, last_edited: 1596642618, name: "General", description: "nada", external_id: null, summit_id: 17, cost: 100, currency: "USD", quantity_2_sell: 10000000, max_quantity_per_order: 2, sales_start_date: 1596783600, sales_end_date: 1596783601, badge_type_id: 0, quantity_sold: 0 },
    { id: 16, created: 1604846262, last_edited: 1604846262, name: "Free", description: "", external_id: null, summit_id: 17, cost: 0, currency: "USD", quantity_2_sell: 100000000, max_quantity_per_order: 4, sales_start_date: 1604822400, sales_end_date: 1596783601, badge_type_id: 9, quantity_sold: 0 },
    { id: 18, created: 1623425882, last_edited: 1623425882, name: "VIP", description: "VIP", external_id: null, summit_id: 17, cost: 250, currency: "USD", quantity_2_sell: 1000, max_quantity_per_order: 4, sales_start_date: 1604822400, sales_end_date: 1596783601, badge_type_id: 16, quantity_sold: 0 }
];

const mockReservation = {};

const mockCallBack = jest.fn();

// Note: running cleanup fterEach is done automatically for you in @testing-library/react@9.0.0 or higher
// unmount and cleanup DOM after the test is finished.
afterEach(cleanup);

it('TicketDropdownComponent renders the right quantity of tickets', () => {
    const { getByTestId } = render(<TicketDropdownComponent ticketTypes={mockTicketTypes} onTicketSelect={mockCallBack} />);

    const ticketDropDown = getByTestId('ticket-dropdown');
    fireEvent.click(ticketDropDown);
    const ticketList = getByTestId('ticket-list');    
    expect(ticketList.children.length).toBe(mockTicketTypes.length);
});

it('TicketDropdownComponent renders only available tickets for sale', () => {
    const { getByTestId } = render(<TicketDropdownComponent ticketTypes={mockTicketsSoldOut} onTicketSelect={mockCallBack} />);

    const ticketDropDown = getByTestId('ticket-dropdown');
    fireEvent.click(ticketDropDown);
    const ticketList = getByTestId('ticket-list');    
    expect(ticketList.children.length).toBeLessThan(mockTicketTypes.length);
    expect(ticketList.children.length).toBe(1);
});

it('TicketDropdownComponent renders only tickets between start and end date', () => {
    const { getByTestId } = render(<TicketDropdownComponent ticketTypes={mockOutOfDateTickets} onTicketSelect={mockCallBack} />);

    const ticketDropDown = getByTestId('ticket-dropdown');
    fireEvent.click(ticketDropDown);
    const ticketList = getByTestId('ticket-list');    
    expect(ticketList.children.length).toBe(0);
});

it('TicketDropdownComponent select a ticket after clicking it', () => {
    const { getByTestId } = render(<TicketDropdownComponent ticketTypes={mockTicketTypes} onTicketSelect={mockCallBack} />);

    const ticketDropDown = getByTestId('ticket-dropdown');
    fireEvent.click(ticketDropDown);
    const ticketList = getByTestId('ticket-list');
    fireEvent.click(ticketList.children[0]);
    expect(mockCallBack.mock.calls.length).toEqual(1);
});

it('TicketDropdownComponent shows a selected ticket', () => {
    const { getByTestId } = render(<TicketDropdownComponent selectedTicket={mockTicketTypes[0]} ticketTypes={mockTicketTypes} onTicketSelect={mockCallBack} />);
    
    const selectedTicket = getByTestId('selected-ticket');
    expect(selectedTicket).toBeTruthy();
});