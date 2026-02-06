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
import { VIEW_ITEM } from '../../utils/constants';

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
    validatePromoCode,
    promoCode,
    promoCodeAllowsReassign = true,
    trackViewItem
}) => {
    const [ticket, setTicket] = useState(null);
    const [quantity, setQuantity] = useState(1);

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
        if (!ticket) return;
        const updatedCurrentTicket = originalTicketTypes.find(t => t?.id === ticket.id);
        if (updatedCurrentTicket) {
            changeForm({ ticketType: updatedCurrentTicket })
            setTicket(updatedCurrentTicket);
        }
        if (!promoCode) changeForm({ promoCode: '' })
    }, [promoCode, originalTicketTypes])

    const isPrePaidReservation = useMemo(
        () => reservation ? isPrePaidOrder(reservation) : false,
        [reservation]
    );

    // check if reassignment is allowed by both promo code AND ticket type
    const ticketTypeAllowsReassign = ticket?.allows_to_reassign !== false;
    const canReassign = promoCodeAllowsReassign && ticketTypeAllowsReassign;

    const handleTicketChange = (t) => {
        setTicket(t);
        setQuantity(minQuantity);
        trackViewItem(t);
        // Validate promo code if already applied (ticket selected after promo applied)
        if (promoCode) {
            validatePromoCode({ id: t.id, ticketQuantity: minQuantity, sub_type: t.sub_type }).catch(() => {});
        }
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

    const handleApplyPromoCode = async (code) => {
        await applyPromoCode(code);
        if (ticket) {
            validatePromoCode({ id: ticket.id, ticketQuantity: quantity, sub_type: ticket.sub_type }).catch(() => {});
        }
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
                                                        <i className="fa fa-plus" />
                                                    </button>
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

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

                            {allowPromoCodes &&
                                <>
                                    <PromoCodeInput
                                        promoCode={promoCode}
                                        applyPromoCode={handleApplyPromoCode}
                                        showMultipleTicketTexts={showMultipleTicketTexts}
                                        removePromoCode={handleRemovePromoCode}
                                        onPromoCodeChange={handlePromoCodeChange} />
                                    {promoCodeError &&
                                        Object.values(promoCodeError).map((er, index) => (<div key={`error-${index}`} className={`${styles.promocodeError} alert alert-danger`}>{er}</div>))
                                    }
                                    {ticket && !canReassign &&
                                        <div className={styles.nonTransferable}>
                                            This ticket will be automatically assigned to you and cannot be reassigned.
                                        </div>
                                    }
                                </>
                            }
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
