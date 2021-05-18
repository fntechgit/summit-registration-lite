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

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { Dropdown } from 'openstack-uicore-foundation/lib/components'

import styles from "./index.module.scss";
import TicketDropdownComponent from '../ticket-dropdown';

const TicketTypeComponent = ({ ticketTypes, isActive }) => {

    const [ticket, setTicket] = useState(null);

    useEffect(() => {
        if (ticket) {
            console.log('ticket changed', ticket);
        }
    }, [ticket])

    const ticketSelect = (t) => {
        setTicket(t);
    }

    return (
        <div className={`${styles.outerWrapper} step-wrapper`}>
            <>
                <div className={`${styles.innerWrapper}`}>
                    <div className={styles.title} >
                        <span>TicketType</span>
                    </div>
                    {isActive ?
                        <div className={styles.dropdown}>
                            <TicketDropdownComponent selectedTicket={ticket} ticketTypes={ticketTypes} onTicketSelect={(t) => ticketSelect(t)} />
                        </div>
                        :
                        <span>{ticket ? `${ticket.name} - $${ticket.cost} ${ticket.currency}` : 'No ticket selected'}</span>
                    }
                </div>
            </>
        </div>
    );
}


export default TicketTypeComponent

