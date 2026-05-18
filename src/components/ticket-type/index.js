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
import TicketNotice from '../ticket-notice';
import { VIEW_ITEM } from '../../utils/constants';

const TicketTypeComponent = ({
    allowedTicketTypes,
    originalTicketTypes, // these are the original ones
    taxTypes,
    isActive,
    changeForm,
    reservation,
    inPersonDisclaimer,
    showMultipleTicketTexts,
    allowPromoCodes,
    promo = {},
    validationError,
    promoCode,
    promoCodeAllowsReassign = true,
    trackViewItem,
    noTicketsAvailableMessage,
}) => {
    const { state: promoState = {}, actions: promoActions = {} } = promo;

    const [ticket, setTicket] = useState(null);
    const [quantity, setQuantity] = useState(1);

    const minQuantity = 1;
    const maxQuantity = getTicketMaxQuantity(ticket, promoState.maxQuantityFromPromo);

    // Clamp quantity when max changes (e.g. per-account limit kicks in after auto-apply).
    // If the cap drops below minQuantity (e.g. cap of 0), use the cap directly rather
    // than flooring at minQuantity, otherwise quantity would end up above the cap.
    useEffect(() => {
        if (!ticket) return;
        if (quantity > maxQuantity) {
            setQuantity(maxQuantity < minQuantity ? 0 : maxQuantity);
        }
    }, [maxQuantity, quantity, ticket]);

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
        // When promo code changes, the API returns updated ticket types with/without discount.
        // Sync the selected ticket with the refreshed data.
        if (!ticket) {
            // Auto-select if only one ticket type available after promo code applied
            if (promoCode && originalTicketTypes.length === 1) {
                handleTicketChange(originalTicketTypes[0]);
            }
            return;
        }
        const updatedCurrentTicket = originalTicketTypes.find(t => t?.id === ticket.id);
        if (updatedCurrentTicket) {
            changeForm({ ticketType: updatedCurrentTicket })
            setTicket(updatedCurrentTicket);
        } else {
            setTicket(null);
            setQuantity(minQuantity);
        }
    }, [promoCode, originalTicketTypes])

    const showTicketSelector = allowedTicketTypes.length > 0;

    const isPrePaidReservation = useMemo(
        () => reservation ? isPrePaidOrder(reservation) : false,
        [reservation]
    );

    // check if reassignment is allowed by both promo code AND ticket type
    const ticketTypeAllowsReassign = ticket?.allows_to_reassign !== false;
    const canReassign = promoCodeAllowsReassign && ticketTypeAllowsReassign;

    // Per-order cap is interesting only when it's tighter than what inventory
    // would otherwise allow (i.e. the binding constraint on the stepper).
    const ticketPerOrderLimit = useMemo(() => {
        if (!ticket) return null;
        const cap = ticket.max_quantity_per_order;
        const inventory = (ticket.quantity_2_sell ?? Number.MAX_SAFE_INTEGER) - (ticket.quantity_sold ?? 0);
        return cap != null && cap > 0 && cap < inventory ? cap : null;
    }, [ticket]);

    // Messages composed for the info notice (stacked in display order):
    // (1) promo per-account cap, (2) ticket-type per-order cap, (3) non-transferable.
    const infoMessage = useMemo(() => {
        if (!ticket) return [];
        const lines = [];
        if (promoState.perAccountLimit != null) {
            lines.push(T.translate(
                promoState.perAccountLimit === 1
                    ? 'promo_code.per_account_limit_one'
                    : 'promo_code.per_account_limit_other',
                { limit: promoState.perAccountLimit }
            ));
        }
        if (ticketPerOrderLimit != null) {
            lines.push(T.translate(
                ticketPerOrderLimit === 1
                    ? 'ticket_type.max_per_order_one'
                    : 'ticket_type.max_per_order_other',
                { limit: ticketPerOrderLimit }
            ));
        }
        if (!canReassign) {
            lines.push(T.translate('promo_code.non_transferable'));
        }
        return lines;
    }, [ticket, promoState.perAccountLimit, ticketPerOrderLimit, canReassign]);

    const handleTicketChange = async (t) => {
        setTicket(t);
        setQuantity(minQuantity);
        trackViewItem(t);
        await promoActions.onTicketSelected(t);
    }

    const incrementQuantity = () => setQuantity(quantity + 1);

    const decrementQuantity = () => setQuantity(quantity - 1);

    const handleApplyPromoCode = async (code) => {
        await promoActions.onApply(code, ticket, quantity);
    }

    return (
        <div className={`${styles.outerWrapper} step-wrapper`}>
            <>
                <div className={styles.innerWrapper}>
                    <div className={styles.title} >
                        <span style={isActive ? { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' } : {}}>
                            <span>Ticket</span>
                            {isActive && showMultipleTicketTexts &&
                                <a className={styles.moreInfo} data-tip data-for="ticket-quantity-info" style={{ margin: 0 }}>
                                    <i className="glyphicon glyphicon-info-sign" aria-hidden="true" />{` `}
                                    Need multiple ticket types?
                                </a>
                            }
                        </span>
                        <div className={styles.summary}>
                            <span>
                                {!isActive && ticket && (
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

                            </span>
                        </div>
                    </div>

                    <animated.div style={{ overflow: 'hidden', ...toggleAnimation }}>
                        <div ref={ref}>
                            {showTicketSelector && (
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
                            )}
                            {!showTicketSelector && (
                                <TicketNotice
                                    message={noTicketsAvailableMessage || T.translate("ticket_type.no_tickets_available")}
                                    variant="info"
                                />
                            )}
                            <ReactTooltip id="ticket-quantity-info" place="bottom" overridePosition={avoidTooltipOverflow}>
                                <div className={styles.moreInfoTooltip}>
                                    {T.translate("ticket_type.ticket_quantity_tooltip")}
                                </div>
                            </ReactTooltip>

                            {allowPromoCodes &&
                                <>
                                    <PromoCodeInput
                                        promoStatus={promoState.status}
                                        promoCode={promoCode}
                                        suggestedCode={promoState.suggestedCode}
                                        isAutoApplied={promoState.isAutoApplied}
                                        onInputChange={promoActions.onInputChange}
                                        onApply={handleApplyPromoCode}
                                        onRemove={promoActions.onRemove}
                                        showMultipleTicketTexts={showMultipleTicketTexts} />
                                </>
                            }
                            <TicketNotice message={validationError} variant="error" />
                            <TicketNotice message={infoMessage} variant="info" />
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
