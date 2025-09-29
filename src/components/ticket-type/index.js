/**
 * Copyright 2020 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
import RawHTML from 'openstack-uicore-foundation/lib/components/raw-html'
import React, { useState, useEffect, useMemo } from 'react';
import { useSpring, config, animated } from "react-spring";
import { useMeasure } from "react-use";
import T from 'i18n-react';
import styles from "./index.module.scss";
import TicketDropdownComponent from '../ticket-dropdown';
import { isInPersonTicketType } from "../../actions";
import ReactTooltip from 'react-tooltip';
import { formatCurrency } from '../../helpers';
import { getTicketMaxQuantity } from '../../helpers';
import { avoidTooltipOverflow, getTicketCost, getTicketTaxes, isPrePaidOrder } from '../../utils/utils';

import PromoCodeInput from '../promocode-input';
import { TICKET_TYPE_SUBTYPE_PREPAID } from '../../utils/constants';

const TicketTypeComponent = ({
    allowedTicketTypes,
    originalTicketTypes, // these are the original ones
    taxTypes,
    isActive,
    changeForm,
    formErrors,
    reservation,
    inPersonDisclaimer,
    showMultipleTicketTexts,
    allowPromoCodes,
    applyPromoCode,
    removePromoCode,
    promoCode,
    trackViewItem
}) => {
    const [ticket, setTicket] = useState(null);
    const [quantity, setQuantity] = useState(1);

    const [ticketsWithDiscounts, setTicketsWithDiscounts] = useState([]);
    const [prePaidTickets, setPrePaidTickets] = useState([]);

    const minQuantity = 1;
    const maxQuantity = getTicketMaxQuantity(ticket);

    const [ref, { height }] = useMeasure();

    const toggleAnimation = useSpring({
        config: { bounce: 0, ...config.stiff },
        from: { opacity: 0, height: 0 },
        to: {
            opacity: 1,
            height: isActive ? height + 10 : 0,
        }
    });

    useEffect(() => {
        if (reservation && reservation.tickets?.length > 0) {
            setTicket(allowedTicketTypes.find(t => t.id === reservation.tickets[0].ticket_type_id));
            setQuantity(reservation.tickets.length);
        }
    }, [])

    useEffect(() => {
        changeForm({ ticketType: ticket, ticketQuantity: quantity });
    }, [ticket, quantity])

    useEffect(() => {
        // if the promo code had changed ( set or not set)
        // try to find the updated ticket from the original ticket types collection from api
        // and update the current ticket that exist on component state
        // bc a discount could be applied to the current selected ticket type
        const ticketTypesWithDiscount = originalTicketTypes.filter(tt => tt.cost_with_applied_discount);
        const unlockedTickets = originalTicketTypes.filter(tt => tt.sub_type === TICKET_TYPE_SUBTYPE_PREPAID);
        if (ticketTypesWithDiscount.length > 0 || unlockedTickets.length > 0) {
            changeForm({ ticketType: null })
            setTicket(null);
            setTicketsWithDiscounts(ticketTypesWithDiscount);
            setPrePaidTickets(unlockedTickets);
        }
        if (!promoCode) {
            changeForm({ promoCode: '' });
            setTicketsWithDiscounts([]);
            setPrePaidTickets([]);
        }
    }, [promoCode, originalTicketTypes])

    const isPrePaidReservation = useMemo(
        () => reservation ? isPrePaidOrder(reservation) : false,
        [reservation]
    );

    const handleTicketChange = (t) => {
        setTicket(t);
        setQuantity(minQuantity);
        trackViewItem(t);
    }

    const handlePromoCodeChange = (code) => {
        changeForm({ promoCode: code });
    }

    const incrementQuantity = () => setQuantity(quantity + 1);

    const decrementQuantity = () => setQuantity(quantity - 1);

    const promoCodeError = Object.keys(formErrors).length > 0 ? formErrors : null;

    const handleRemovePromoCode = () => {
        setTicket(null);
        removePromoCode();
    }

    return (
        <div className={`${styles.outerWrapper} step-wrapper`}>
            <>
                <div className={styles.innerWrapper}>
                    <div className={styles.title} >
                        <span>
                            Ticket
                        </span>
                        <div className={styles.summary}>
                            <span>
                                {ticket && (
                                    <>
                                        {`${ticket.name} (${quantity}): `}
                                        <>
                                            {getTicketCost(ticket, quantity)}
                                        </>
                                        {`${getTicketTaxes(ticket, taxTypes)}`}

                                        {!isActive && reservation?.discount_amount > 0 && (
                                            <>
                                                <br />
                                                <span className={styles.promoCode}>
                                                    Promo code&nbsp;<abbr title={reservation.promo_code}>{reservation.promo_code}</abbr>&nbsp;applied:
                                                </span>
                                                {!isPrePaidReservation &&
                                                    <span className={styles.discount}>
                                                        {` - ${formatCurrency(reservation.discount_amount, { currency: ticket.currency })} ${ticket.currency}`}
                                                    </span>
                                                }
                                            </>
                                        )}

                                        {!isActive && reservation && !isPrePaidReservation && (
                                            <span className={styles.promo}>
                                                Subtotal: {`${ticket?.currency_symbol} ${((reservation?.raw_amount_in_cents - reservation?.discount_amount_in_cents) / 100).toFixed(2)} ${ticket?.currency}`}
                                            </span>
                                        )}

                                        {!isActive && reservation?.taxes_amount > 0 && !isPrePaidReservation && (
                                            <>
                                                {reservation?.applied_taxes.map((tax) => {
                                                    return (
                                                        <React.Fragment key={tax.id}>
                                                            <span className={styles.taxes}>
                                                                <abbr title={tax.name}>
                                                                    {tax.name}
                                                                </abbr>
                                                                {` : ${formatCurrency(tax.amount, { currency: ticket.currency })} ${ticket.currency}`}
                                                            </span>
                                                            <br />
                                                        </React.Fragment>
                                                    )
                                                })}
                                            </>
                                        )}
                                        {!isActive && reservation && !isPrePaidReservation && (
                                            <>
                                                <br />
                                                Total: {`${formatCurrency(reservation.amount, { currency: ticket.currency })} ${ticket.currency}`}
                                            </>
                                        )}
                                    </>
                                )}

                                {!ticket && <>No ticket selected</>}
                            </span>
                        </div>
                    </div>

                    <animated.div style={{ overflow: 'hidden', ...toggleAnimation }}>
                        <div ref={ref}>
                            <div className={styles.form}>
                                <div className={styles.dropdown}>
                                    <TicketDropdownComponent selectedTicket={ticket}
                                        ticketTypes={allowedTicketTypes}
                                        taxTypes={taxTypes}
                                        onTicketSelect={handleTicketChange}
                                    />
                                </div>

                                {ticket && (
                                    <>
                                        <div className={styles.quantity}>
                                            <div className="input-group">
                                                <span className="input-group-btn">
                                                    <button aria-label="remove a ticket" className="btn btn-default" onClick={decrementQuantity} disabled={maxQuantity === 0 || quantity === minQuantity}>
                                                        <i className="fa fa-minus"></i>
                                                    </button>
                                                </span>
                                                <input className="form-control" aria-label="ticket quanity" name="ticket_quantity" type="text" value={quantity} readOnly={true} disabled={maxQuantity === 0} />
                                                <span className="input-group-btn">
                                                    <button aria-label="add a ticket" className="btn btn-default" onClick={incrementQuantity} disabled={maxQuantity === 0 || quantity >= maxQuantity}>
                                                        <i className="glyphicon glyphicon-plus" />
                                                    </button>
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            {allowPromoCodes &&
                                <>
                                    <PromoCodeInput
                                        promoCode={promoCode}
                                        applyPromoCode={applyPromoCode}
                                        showMultipleTicketTexts={showMultipleTicketTexts}
                                        removePromoCode={handleRemovePromoCode}
                                        onPromoCodeChange={handlePromoCodeChange} />
                                    {(prePaidTickets.length > 0 || ticketsWithDiscounts.length > 0) && (
                                        <div className={`${styles.appliedDiscount} alert alert-success`}>
                                            {prePaidTickets.length > 0 && (
                                                <>
                                                    <p>{T.translate("ticket_type.unlocked_tickets", { promoCode })}</p>
                                                    <ul>
                                                        {prePaidTickets.map((tt) => (
                                                            <li key={`pre-${tt.name}`}>{tt.name}</li>
                                                        ))}
                                                    </ul>
                                                </>
                                            )}
                                            {ticketsWithDiscounts.length > 0 && (
                                                <>
                                                    <p>{T.translate("ticket_type.discount_tickets", { promoCode })}</p>
                                                    <ul>
                                                        {ticketsWithDiscounts.map((tt) => (
                                                            <li key={`disc-${tt.name}`}>{tt.name}</li>
                                                        ))}
                                                    </ul>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    {promoCodeError &&
                                        Object.values(promoCodeError).map((er, index) => (<div key={`error-${index}`} className={`${styles.promocodeError} alert alert-danger`}>{er}</div>))
                                    }
                                </>
                            }

                            {showMultipleTicketTexts &&
                                <a className={styles.moreInfo} data-tip data-for="ticket-quantity-info">
                                    <i className="glyphicon glyphicon-info-sign" aria-hidden="true" />{` `}
                                    Need multiple ticket types?
                                </a>
                            }
                            <ReactTooltip id="ticket-quantity-info" overridePosition={avoidTooltipOverflow}>
                                <div className={styles.moreInfoTooltip}>
                                    {T.translate("ticket_type.ticket_quantity_tooltip")}
                                </div>
                            </ReactTooltip>
                        </div>
                    </animated.div>

                    {inPersonDisclaimer && ticket && isInPersonTicketType(ticket) &&
                        <div className={styles.inPersonDisclaimer}>
                            <RawHTML>
                                {inPersonDisclaimer}
                            </RawHTML>
                        </div>
                    }
                </div>
            </>
        </div>
    );
}


export default TicketTypeComponent
