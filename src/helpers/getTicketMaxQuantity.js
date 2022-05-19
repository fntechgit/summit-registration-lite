export const getTicketMaxQuantity = (ticket) =>
    ticket ? Math.min((ticket.quantity_2_sell || Number.MAX_SAFE_INTEGER) - ticket.quantity_sold, (ticket.max_quantity_per_order || Number.MAX_SAFE_INTEGER)) : 0;

