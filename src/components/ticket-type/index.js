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
import {isInPersonTicketType} from "../../actions";

const TicketTypeComponent = ({ ticketTypes, taxTypes, isActive, changeForm, reservation, inPersonDisclaimer }) => {

    const [ticket, setTicket] = useState(null);

    const [ref, { height }] = useMeasure();

    const toggleAnimation = useSpring({
        config: { bounce: 0, ...config.stiff },
        from: { opacity: 0, height: 0 },
        to: {
            opacity: 1,
            height: isActive ? height + 10 : 0,
            marginBottom: isActive ? 5 : 0
        }
    });

    useEffect(() => {
        if (reservation && reservation.tickets?.length > 0) {
            setTicket(ticketTypes.find(t => t.id === reservation.tickets[0].ticket_type_id))
        }
    }, [])

    useEffect(() => {
        changeForm(ticket);
    }, [ticket])

    const ticketSelect = (t) => {
        setTicket(t);
    }

    return (
        <div className={`${styles.outerWrapper} step-wrapper`}>
            <>
                <div className={`${styles.innerWrapper}`}>
                    <div className={styles.title} >
                        <span>Ticket </span>
                        <div className={styles.summary} >
                            {!isActive &&
                                reservation?.discount_amount > 0 ?
                                <span>
                                    {ticket &&
                                        <>
                                            {ticket.name} &nbsp;
                                        <span className={styles.crossOut}>
                                            ${ticket.cost} &nbsp;
                                        </span>
                                            <span className={styles.discount}>
                                                ${reservation.raw_amount - reservation.discount_amount}
                                            </span>
                                            {ticket.currency}
                                        </>
                                    }
                                    <span className={styles.promo}>
                                        Promo code applied
                                    </span>
                                </span>
                                :
                                <span>{ticket ? `${ticket.name}: $${ticket.cost} ${ticket.currency}` : 'No ticket selected'}</span>
                            }
                            {
                                !isActive && reservation?.taxes_amount > 0 &&
                                <>
                                    <br />
                                    <span>Taxes: ${reservation?.taxes_amount} {ticket?.currency}</span>
                                </>
                            }
                        </div>
                    </div>
                    <animated.div style={{ overflow: 'hidden', ...toggleAnimation }}>
                        <div ref={ref} className={styles.dropdown}>
                            <TicketDropdownComponent selectedTicket={ticket} ticketTypes={ticketTypes} onTicketSelect={(t) => ticketSelect(t)} />
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