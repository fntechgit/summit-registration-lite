import { getTicketMaxQuantity } from '../getTicketMaxQuantity';
import { TICKET_TYPE_SUBTYPE_PREPAID } from '../../utils/constants';

describe('getTicketMaxQuantity', () => {
    it('returns 0 when no ticket is given', () => {
        expect(getTicketMaxQuantity(null)).toBe(0);
    });

    it('caps at the remaining stock when there is a real per-order limit', () => {
        // 100 to sell, 90 sold, up to 5 per order -> per-order limit wins
        const ticket = { quantity_2_sell: 100, quantity_sold: 90, max_quantity_per_order: 5 };
        expect(getTicketMaxQuantity(ticket)).toBe(5);
    });

    it('caps at remaining stock when stock is the tighter limit', () => {
        // 100 to sell, 97 sold, up to 5 per order -> only 3 left
        const ticket = { quantity_2_sell: 100, quantity_sold: 97, max_quantity_per_order: 5 };
        expect(getTicketMaxQuantity(ticket)).toBe(3);
    });

    it('treats max_quantity_per_order of 0 as unlimited (the sold-out bug)', () => {
        // ticket 212 from prod: 2900 to sell, 2832 sold, per-order limit 0 (API = no limit)
        // 68 tickets remain, so it must NOT read as sold out
        const ticket = { quantity_2_sell: 2900, quantity_sold: 2832, max_quantity_per_order: 0 };
        expect(getTicketMaxQuantity(ticket)).toBe(68);
    });

    it('treats quantity_2_sell of 0 as unlimited stock', () => {
        // 0 to sell = no cap on stock; per-order limit of 4 is the only bound
        const ticket = { quantity_2_sell: 0, quantity_sold: 10, max_quantity_per_order: 4 };
        expect(getTicketMaxQuantity(ticket)).toBe(4);
    });

    it('defaults quantity_sold to 0 when the API omits it', () => {
        const ticket = { quantity_2_sell: 100, max_quantity_per_order: 5 };
        expect(getTicketMaxQuantity(ticket)).toBe(5);
    });

    it('still returns <= 0 for a genuinely sold-out ticket', () => {
        // real cap reached: 100 to sell, 100 sold
        const ticket = { quantity_2_sell: 100, quantity_sold: 100, max_quantity_per_order: 5 };
        expect(getTicketMaxQuantity(ticket)).toBeLessThan(1);
    });

    it('applies the remaining-per-account cap when it is the tightest', () => {
        const ticket = { quantity_2_sell: 100, quantity_sold: 10, max_quantity_per_order: 10 };
        expect(getTicketMaxQuantity(ticket, 2)).toBe(2);
    });

    it('always returns 1 for prepaid ticket types', () => {
        const ticket = { sub_type: TICKET_TYPE_SUBTYPE_PREPAID, quantity_2_sell: 0, quantity_sold: 0, max_quantity_per_order: 0 };
        expect(getTicketMaxQuantity(ticket)).toBe(1);
    });
});
