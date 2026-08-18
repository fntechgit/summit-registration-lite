import { isPrePaidTicketType } from '../utils/utils';

export const getTicketMaxQuantity = (ticket, remainingQuantityPerAccount) => {
    if(!ticket) return 0;
    if(isPrePaidTicketType(ticket)) return 1;
    // The API treats 0 as "no limit" for both fields; only a positive value is a real cap.
    const quantityToSell = ticket.quantity_2_sell || Number.MAX_SAFE_INTEGER;
    const maxPerOrder = ticket.max_quantity_per_order || Number.MAX_SAFE_INTEGER;
    let max = Math.min(quantityToSell - (ticket.quantity_sold ?? 0), maxPerOrder);
    if (remainingQuantityPerAccount != null) {
        max = Math.min(max, remainingQuantityPerAccount);
    }
    return max;
}

