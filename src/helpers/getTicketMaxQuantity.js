import { TICKET_TYPE_SUBTYPE_PREPAID } from '../utils/constants';

export const getTicketMaxQuantity = (ticket) => {
    if(!ticket) return 0;
    if(ticket?.sub_type === TICKET_TYPE_SUBTYPE_PREPAID) return 1;
    return Math.min((ticket.quantity_2_sell || Number.MAX_SAFE_INTEGER) - ticket.quantity_sold, (ticket.max_quantity_per_order || Number.MAX_SAFE_INTEGER));
}

