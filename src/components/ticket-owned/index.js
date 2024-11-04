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

import React, { useMemo } from 'react';
import styles from "./index.module.scss";

const TicketOwnedComponent = ({ ownedTickets }) => {

    const formatOwnedTicketStrings = (tickets) => (
        tickets.reduce((acc, ownedTicket, index) => {
            const { qty, type_name } = ownedTicket;
            const firstTicket = index === 0;
            const lastTicket = index + 1 === tickets.length;
            const separator = acc ? (lastTicket ? ' and ' : ', ') : '';

            let updatedTypeName = type_name;

            if (firstTicket) {
                // For the first ticket, replace 'ticket' with 'Ticket(s)' or add ' Ticket(s)'
                if (/ticket/i.test(type_name)) {
                    updatedTypeName = type_name.replace(/ticket/i, 'Ticket(s)');
                } else {
                    updatedTypeName += ' Ticket(s)';
                }
            }

            return `${acc}${separator}${qty} ${updatedTypeName}`;
        }, '')
    );

    const ownedTicketsString = useMemo(() => formatOwnedTicketStrings(ownedTickets), [ownedTickets]);

    return (
        <div className={styles.ticketOwnedWrapper}>
            <div className={`${styles.alert} alert alert-warning`} role="alert" data-testid="owned-tickets">
                You have already ordered {ownedTicketsString}. If you would like to order more, please do so below.
            </div>
        </div>
    );
};


export default TicketOwnedComponent


