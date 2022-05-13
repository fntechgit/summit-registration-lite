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

import React from 'react';
import styles from "./index.module.scss";



const TicketOwnedComponent = ({ ownedTickets, ticketTypes }) => {
    const ownedTicketsString = ticketTypes.reduce((acc, ticketType) => {
        const matchingTickets = ownedTickets.filter(ticket => ticket.ticket_type_id === ticketType.id);

        if (!matchingTickets.length) return acc;

        return `${acc}${acc ? ', ' : ''}${matchingTickets.length} ${ticketType.name}${!ticketType.name.toLowerCase().endsWith('ticket') ? ' ticket' : ''}${matchingTickets.length > 1 ? 's' : ''}`;
    }, '');

    return (
        <div className={styles.ticketOwnedWrapper}>
            <div className={`${styles.alert} alert alert-warning`} role="alert">
                You have already ordered {ownedTicketsString}. If you would like to order more tickets, please do so below.
            </div>
        </div>
    )
};


export default TicketOwnedComponent


