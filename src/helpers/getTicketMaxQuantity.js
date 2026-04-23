import { isPrePaidTicketType } from '../utils/utils';

export const getTicketMaxQuantity = (ticket, remainingQuantityPerAccount) => {
    if(!ticket) return 0;
    if(isPrePaidTicketType(ticket)) return 1;
    let max = Math.min((ticket.quantity_2_sell ?? Number.MAX_SAFE_INTEGER) - ticket.quantity_sold, (ticket.max_quantity_per_order ?? Number.MAX_SAFE_INTEGER));
    if (remainingQuantityPerAccount != null) {
        max = Math.min(max, remainingQuantityPerAccount);
    }
    return max;
}

