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
import { getTicketMaxQuantity } from '../../helpers';
import styles from "./index.module.scss";

const TicketDropdownComponent = ({ selectedTicket, ticketTypes, taxTypes, onTicketSelect }) => {
    const [active, setActive] = useState(false);

    const ticketSelect = (ticket) => {
        onTicketSelect(ticket);
        setActive(!active);
    }

    const selectedTicketTaxes = taxTypes.filter(tax => tax.ticket_types.includes(selectedTicket?.id));

    return (
        <div className={`${styles.outerWrapper}`}>
            <div className={styles.placeholder} onClick={() => setActive(!active)} data-testid="ticket-dropdown">
                {selectedTicket ?
                    <>
                        <span className={styles.selectedTicket} data-testid="selected-ticket">
                            {`${selectedTicket.name} - ${selectedTicket.currency_symbol}${selectedTicket.cost} ${selectedTicket.currency}
                            ${selectedTicketTaxes.length > 0 && ` plus ${selectedTicketTaxes.map(t => t.name).join(' & ')}`}`}
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
                        console.log('TicketDropdownComponent::render');
                        const maxQuantity = getTicketMaxQuantity(t);
                        const isTicketSoldOut = maxQuantity < 1;
                        const ticketTax = taxTypes.filter(tax => tax.ticket_types.includes(t.id));

                            return (
                                <div key={t.id} className={isTicketSoldOut ? styles.soldOut : ''} onClick={() => {
                                    if (isTicketSoldOut) return;
                                    ticketSelect(t);
                                }}>
                                    {t.name} -{` `}
                                    {!isTicketSoldOut && <>{t.currency_symbol}{t.cost} {t.currency}</>}
                                    {ticketTax.length > 0 && ` plus ${ticketTax.map(t => t.name).join(' & ')}`}
                                    {isTicketSoldOut && <>Sold Out</>}
                                </div>
                            )

                    })}
                </div>
            }
        </div>
    );
}


export default TicketDropdownComponent

