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

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { getTicketMaxQuantity } from '../../helpers';
import styles from "./index.module.scss";

const TicketDropdownComponent = ({ selectedTicket, ticketTypes, onTicketSelect }) => {
    const [active, setActive] = useState(false);

    const ticketSelect = (ticket) => {
        onTicketSelect(ticket);
        setActive(!active);
    }

    const date = new Date();
    let now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
        date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()) / 1000;

    return (
        <div className={`${styles.outerWrapper}`}>
            <div className={styles.placeholder} onClick={() => setActive(!active)} data-testid="ticket-dropdown">
                {selectedTicket ?
                    <>
                        <span data-testid="selected-ticket">
                            {`${selectedTicket.name} - $${selectedTicket.cost} ${selectedTicket.currency}`}
                        </span>
                        <i className="fa fa-chevron-down"></i>
                    </>
                    :
                    <>
                        <span data-testid="no-ticket">Select a ticket</span>
                        <i className="fa fa-chevron-down"></i>
                    </>
                }
            </div>

            {active &&
                <div className={styles.dropdown} data-testid="ticket-list">
                    {ticketTypes.map(t => {
                        const maxQuantity = getTicketMaxQuantity(t);
                        const isTicketSoldOut = maxQuantity < 1;

                        if (
                            (
                                (t.sales_start_date === null && t.sales_end_date === null) ||
                                (now_utc >= t.sales_start_date && now_utc <= t.sales_end_date)
                            )
                        ) {
                            return (
                                <div key={t.id} className={isTicketSoldOut ? styles.soldOut : ''} onClick={() => {
                                    if (isTicketSoldOut) return;
                                    ticketSelect(t);
                                }}>
                                    {t.name} -{` `}
                                    {!isTicketSoldOut && <>${t.cost} {t.currency}</>}
                                    {isTicketSoldOut && <>Sold Out</>}
                                </div>
                            )
                        }
                    })}
                </div>
            }
        </div>
    );
}


export default TicketDropdownComponent

