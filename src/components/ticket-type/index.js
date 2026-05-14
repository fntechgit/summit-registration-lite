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
import PromoCodeNotice from '../promo-code-notice';
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
    promo,
    promoCode,
    promoCodeAllowsReassign = true,
    trackViewItem
}) => {
    const [ticket, setTicket] = useState(null);
    const [quantity, setQuantity] = useState(1);

    const minQuantity = 1;
    const maxQuantity = getTicketMaxQuantity(ticket, promo.maxQuantityFromPromo);

    // Clamp quantity when max changes (e.g. per-account limit kicks in after auto-apply)
    useEffect(() => {
        if (quantity > maxQuantity) {
            setQuantity(Math.max(maxQuantity, minQuantity));
        }
    }, [maxQuantity]);

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

    const showTicketSelector = allowedTicketTypes.length > 0 || !!promoCode;

    const isPrePaidReservation = useMemo(
        () => reservation ? isPrePaidOrder(reservation) : false,
        [reservation]
    );

    // check if reassignment is allowed by both promo code AND ticket type
    const ticketTypeAllowsReassign = ticket?.allows_to_reassign !== false;
    const canReassign = promoCodeAllowsReassign && ticketTypeAllowsReassign;

    const handleTicketChange = async (t) => {
        setTicket(t);
        setQuantity(minQuantity);
        trackViewItem(t);
        await promo.onTicketSelected(t);
    }

    const incrementQuantity = () => setQuantity(quantity + 1);

    const decrementQuantity = () => setQuantity(quantity - 1);

    const handleApplyPromoCode = async (code) => {
        await promo.onApply(code, ticket, quantity);
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
                                <PromoCodeNotice
                                    message={T.translate("ticket_type.no_tickets_available")}
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
                                        promoStatus={promo.status}
                                        promoCode={promoCode}
                                        suggestedCode={promo.suggestedCode}
                                        wasAutoApplied={promo.wasAutoApplied}
                                        onInputChange={promo.onInputChange}
                                        onApply={handleApplyPromoCode}
                                        onRemove={promo.onRemove}
                                        showMultipleTicketTexts={showMultipleTicketTexts} />
                                </>
                            }
                            {promo.validationError &&
                                <PromoCodeNotice message={promo.validationError} variant="error" />
                            }
                            {ticket && promo.perAccountLimit != null &&
                                <PromoCodeNotice
                                    message={T.translate('promo_code.per_account_limit', { limit: promo.perAccountLimit, unit: promo.perAccountLimit === 1 ? 'ticket' : 'tickets' })}
                                    variant="info"
                                />
                            }
                            {ticket && !canReassign &&
                                <PromoCodeNotice
                                    message={T.translate('promo_code.non_transferable')}
                                    variant="info"
                                />
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
