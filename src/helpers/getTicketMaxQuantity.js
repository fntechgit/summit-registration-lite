const INFINITE_QUANTITY = 999999;

export const getTicketMaxQuantity = (ticket) =>
    ticket ? Math.min((ticket.quantity_2_sell || INFINITE_QUANTITY) - ticket.quantity_sold, (ticket.max_quantity_per_order || INFINITE_QUANTITY)) : 0;

