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

const TicketOwnedComponent = ({ ownedTickets}) => {
    const ownedTicketsString = useMemo(() => ownedTickets.reduce((acc, ownedTicket, index) => {
        return `
            ${acc}${acc ? `${index+1===ownedTickets.length? ' and ' : ', '}` : ''}
            ${ownedTicket.qty} ${ownedTicket.type_name}${index === 0 ? !wnedTicket.type_name.toLowerCase().endsWith('ticket') ? ' ticket' : '' : ownedTickets.type_name.toLowerCase().endsWith('ticket') ? '' : ''}${ownedTicket.qty > 1 ? 's' : ''}`;
    }, ''), [ownedTickets]);

    return (
        <div className={styles.ticketOwnedWrapper}>
            <div className={`${styles.alert} alert alert-warning`} role="alert">
                You have already ordered {ownedTicketsString}. If you would like to order more, please do so below.
            </div>
        </div>
    );
};


export default TicketOwnedComponent


