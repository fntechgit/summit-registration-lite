import { formatCurrency } from '../helpers';
import { ORDER_PAYMENT_METHOD_OFFLINE, ORDER_STATUS_PAID } from './constants';

import React from 'react';

/**
 * Copyright 2022 OpenStack Foundation
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

export const getCurrentProvider = (summit) => {
    for (let profile of summit.payment_profiles) {
        if (profile.application_type === 'Registration') {
            return {
                publicKey : profile.test_mode_enabled ? profile.test_publishable_key : profile.live_publishable_key,
                provider : profile.provider
            }
        }
    }
    return {
        publicKey : null,
        provider : ''
    }
}

export const ticketHasAccessLevel = (ticket, accessLevel) => {
    if(!ticket) return false;
    return ticket.badge?.type?.access_levels.map(al => al.name).includes(accessLevel);
};

export const getCurrentUserLanguage = () => {
    let language = 'en';
    if(typeof navigator !== 'undefined') {
        language = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;
    }
    return language;
};

export const isEmptyString = (val) => {
    return typeof val === 'string' && val.trim().length == 0;
}

export const getTicketTaxes = (ticket, taxes) => {
    const ticketTaxes = taxes.filter(tax => tax.ticket_types.includes(ticket?.id));
    return `${ticketTaxes.length > 0 ? ` plus ${taxes.map(t => t.name).join(' & ')}` : ''}`;
}

export const hasDiscountApplied = (ticketType) => ticketType?.cost_with_applied_discount > 0;

export const isFreeOrder = (reservation) => reservation.amount === 0 ;

export const isPrePaidOrder = (reservation) => reservation.status === ORDER_STATUS_PAID  && reservation.payment_method === ORDER_PAYMENT_METHOD_OFFLINE;

export const getTicketCost = (ticket, quantity = 1) => {
    return hasDiscountApplied(ticket) ?
        <>
            <s>{formatCurrency(ticket.cost * quantity, { currency: ticket.currency })} {ticket.currency}</s>
            &nbsp;
            <>{formatCurrency(ticket.cost_with_applied_discount * quantity, { currency: ticket.currency })} {ticket.currency}</>
        </>
        :
        <>{formatCurrency(ticket.cost * quantity, { currency: ticket.currency })} {ticket.currency}</>
}

