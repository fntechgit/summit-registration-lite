export const getTicketMaxQuantity = (ticket) =>
    ticket ? Math.min(ticket.quantity_2_sell - ticket.quantity_sold, ticket.max_quantity_per_order || 999999) : 0;
