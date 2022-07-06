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
import React, { useState, useEffect } from 'react';
import { useSpring, config, animated } from "react-spring";
import { useMeasure } from "react-use";
import styles from "./index.module.scss";
import TicketDropdownComponent from '../ticket-dropdown';
import { isInPersonTicketType } from "../../actions";
import ReactTooltip from 'react-tooltip';
import { formatCurrency } from '../../helpers';
import { getTicketMaxQuantity } from '../../helpers';

const TicketTypeComponent = ({ ticketTypes, isActive, changeForm, reservation, inPersonDisclaimer }) => {
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
            setTicket(ticketTypes.find(t => t.id === reservation.tickets[0].ticket_type_id))
        }
    }, [])

    useEffect(() => {
        changeForm({ ticketType: ticket, ticketQuantity: quantity });
    }, [ticket, quantity])

    const handleTicketChange = (t) => {
        setTicket(t);
        setQuantity(minQuantity);
    }

    const incrementQuantity = () => setQuantity(quantity + 1);

    const decrementQuantity = () => setQuantity(quantity - 1);

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
                                        {ticket.name}{` `}
                                        ({quantity}):{` `}

                                        {!isActive && reservation?.discount_amount > 0 && (
                                            <>
                                                <span className={styles.crossOut}>
                                                    {formatCurrency(ticket.cost * quantity, { currency: ticket.currency })}
                                                </span>{` `}
                                                <span className={styles.discount}>
                                                    {formatCurrency(reservation.raw_amount - reservation.discount_amount, { currency: ticket.currency })}
                                                </span>{` `}
                                            </>
                                        )}

                                        {!reservation?.discount_amount && (
                                            <>
                                                {formatCurrency(ticket.cost * quantity, { currency: ticket.currency })}{` `}
                                            </>
                                        )}

                                        {ticket.currency}

                                        {!isActive && reservation?.discount_amount > 0 && (
                                            <span className={styles.promo}>
                                                Promo code applied
                                            </span>
                                        )}

                                        {!isActive && reservation?.taxes_amount > 0 && (
                                            <>
                                                <br />
                                                Taxes: ${reservation?.taxes_amount} {ticket?.currency}
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
                                    <TicketDropdownComponent selectedTicket={ticket} ticketTypes={ticketTypes} onTicketSelect={handleTicketChange} />
                                </div>

                                {ticket && (
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
                                )}
                            </div>
                            <a className={styles.moreInfo} data-tip data-for="ticket-quantity-info">
                                <i className="glyphicon glyphicon-info-sign" aria-hidden="true" />{` `}
                                Need multiple ticket types?
                            </a>
                            <ReactTooltip id="ticket-quantity-info">
                                <div className={styles.moreInfoTooltip}>To purchase more than one ticket type, simply place another order after this registration order is complete. Only one ticket type can be chosen per order.</div>
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
