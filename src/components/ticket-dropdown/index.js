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

import React, { useState, useRef, useEffect } from 'react';
import isEqual from 'lodash/isEqual';
import { getTicketMaxQuantity } from '../../helpers';
import styles from "./index.module.scss";
import { getTicketCost, getTicketTaxes } from '../../utils/utils';

const TicketDropdownComponent = ({ selectedTicket, ticketTypes, taxTypes, onTicketSelect }) => {
    const [active, setActive] = useState(false);
    const [currentTicketTypes, setCurrentTicketTypes] = useState([])
    // ref is used because it doesn't affect the rendering cicle and is only used to check prev values
    const prevTicketTypesRef = useRef([]);

    const ticketSelect = (ticket) => {
        onTicketSelect(ticket);
        setActive(!active);
    }
    useEffect(() => {
        const prevTicketTypes = prevTicketTypesRef.current;
        if (!isEqual(ticketTypes, []) && !isEqual(prevTicketTypes, ticketTypes)) {
            setCurrentTicketTypes(ticketTypes);
        }
        prevTicketTypesRef.current = ticketTypes;
    }, [ticketTypes]);

    return (
        <div className={`${styles.outerWrapper}`}>
            <div className={styles.placeholder} onClick={() => setActive(!active)} data-testid="ticket-dropdown">
                {selectedTicket ?
                    <>
                        <span className={styles.selectedTicket} data-testid="selected-ticket">
                                {`${selectedTicket.name} - `}
                                {getTicketCost(selectedTicket)}
                                {getTicketTaxes(selectedTicket, taxTypes)}
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
                    {currentTicketTypes.map(t => {
                        console.log('TicketDropdownComponent::render');
                        const maxQuantity = getTicketMaxQuantity(t);
                        const isTicketSoldOut = maxQuantity < 1;

                        return (
                            <div key={t.id} className={isTicketSoldOut ? styles.soldOut : ''} onClick={() => {
                                if (isTicketSoldOut) return;
                                ticketSelect(t);
                            }}>
                                {t.name} -{` `}
                                {!isTicketSoldOut &&
                                    getTicketCost(t)
                                }
                                {getTicketTaxes(t, taxTypes)}
                                {isTicketSoldOut && <> Sold Out</>}
                            </div>
                        )
                    })}
                </div>
            }
        </div>
    );
}

export default TicketDropdownComponent
