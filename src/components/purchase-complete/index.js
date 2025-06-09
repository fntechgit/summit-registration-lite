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

import React, { useEffect, useState, useMemo } from 'react';
import styles from './index.module.scss';
import { epochToMomentTimeZone } from 'openstack-uicore-foundation/lib/utils/methods';
import { isEmptyString, ticketHasAccessLevel } from '../../utils/utils';
import { VirtualAccessLevel } from '../../utils/constants';
import T from 'i18n-react';
import RawHTML from 'openstack-uicore-foundation/lib/components/raw-html';

const CTAButton = ({ cta, clear, close, ...rest }) => {
    return (
        <button className={`${styles.button} button`} onClick={() => {
            clear();
            if (close)
                close();
            cta();
        }}>{rest.children}</button>);
};

const PurchaseComplete = ({
                              checkout,
                              user,
                              onPurchaseComplete,
                              goToExtraQuestions,
                              goToEvent,
                              goToMyOrders,
                              completedExtraQuestions,
                              summit,
                              nowUtc,
                              clearWidgetState,
                              closeWidget,
                              supportEmail,
                              hasVirtualAccessLevel,
                              ...rest
                          }) => {

    useEffect(() => {
        onPurchaseComplete(checkout);
    }, []);

    const [requireExtraQuestions, setRequireExtraQuestions] = useState(null);
    const [loadingExtraQuestions, setLoadingExtraQuestons] = useState(false);
    const isMultiOrder = useMemo(() => checkout?.tickets.length > 1 , [checkout]);
    const isActive = useMemo(() => summit.start_date <= nowUtc && summit.end_date >= nowUtc, [summit, nowUtc]);
    const currentTicket = useMemo(
        () => isMultiOrder ? checkout?.tickets.find(t => t?.owner?.email === user?.email) : checkout?.tickets.find(t => t?.owner),
        [user]
    );

    useEffect(() => {
        setLoadingExtraQuestons(true);
         completedExtraQuestions(currentTicket?.owner || null).then((res) => {
             setRequireExtraQuestions(res);
             setLoadingExtraQuestons(false);
         });
    }, [currentTicket]);

    const _hasVirtualAccessLevel = hasVirtualAccessLevel || (currentTicket && ticketHasAccessLevel(currentTicket, VirtualAccessLevel));
    const attendeeIsSomeoneElse = !isMultiOrder && currentTicket && currentTicket.hasOwnProperty('owner') && currentTicket.owner?.email !== user?.email;
    // attendeeId is only passed to event-site only if the ticket is for someone else.
    // If not pass it as null to use the default flow
    const attendeeId = attendeeIsSomeoneElse ? currentTicket?.owner?.id : null;

    const startDateFormatted = {
        date: epochToMomentTimeZone(summit.start_date, summit.time_zone_id).format('MMMM D'),
        time: epochToMomentTimeZone(summit.start_date, summit.time_zone_id).format('hh:mm A')
    };

    if (!checkout) return null;
    if(requireExtraQuestions == null && !loadingExtraQuestions) return null;

    let orderCompleteButtonText = (
        currentTicket && requireExtraQuestions ?
            rest.hasOwnProperty('initialOrderCompleteButton') && !isEmptyString(rest.initialOrderCompleteButton)
            && typeof rest.initialOrderCompleteButton !== 'undefined' ?
                rest.initialOrderCompleteButton
                :
                T.translate('purchase_complete_step.initial_order_complete_button')
            :
            rest.hasOwnProperty('orderCompleteButton') && !isEmptyString(rest.orderCompleteButton) ?
                rest.orderCompleteButton
                :
                T.translate('purchase_complete_step.order_complete_button')
    );

    let orderCompleteTitle = (
        rest.hasOwnProperty('orderCompleteTitle') && !isEmptyString(rest.orderCompleteTitle)
        && typeof rest.orderCompleteTitle !== 'undefined' ?
            rest.orderCompleteTitle
            :
            T.translate('purchase_complete_step.title')
    );

    let orderComplete1stParagraph = (
        currentTicket ?
            !attendeeIsSomeoneElse && rest.hasOwnProperty('initialOrderComplete1stParagraph') && typeof rest.initialOrderComplete1stParagraph !== 'undefined' ?
                rest.initialOrderComplete1stParagraph
                :
                T.translate('purchase_complete_step.initial_order_complete_1st_paragraph_label',
                    {
                        attendee: `${attendeeIsSomeoneElse ? ` ${currentTicket.owner.email}` : 'you'}`,
                        adv: `${attendeeIsSomeoneElse ? `${currentTicket.owner.email}` : 'your'}`,
                        button: orderCompleteButtonText
                    }
                )
            :
            rest.hasOwnProperty('orderComplete1stParagraph') && typeof rest.orderComplete1stParagraph !== 'undefined' ?
                rest.orderComplete1stParagraph
                :
                T.translate('purchase_complete_step.order_complete_1st_paragraph_label')
    );

    let orderComplete2ndParagraph = (
        currentTicket?
            rest.hasOwnProperty('initialOrderComplete2ndParagraph') && typeof rest.initialOrderComplete2ndParagraph !== 'undefined' ?
                rest.initialOrderComplete2ndParagraph
                :
                T.translate('purchase_complete_step.initial_order_footer_label')
            :
            rest.hasOwnProperty('orderComplete2ndParagraph') && typeof rest.orderComplete2ndParagraph !== 'undefined' ?
                rest.orderComplete2ndParagraph
                :
                ''
    );

    let footerHasTicketText = `${orderComplete2ndParagraph} ${T.translate('purchase_complete_step.footer_assistance_text', { supportEmail: `${supportEmail}` })}`;

    const getCTAButton = () => {
        return (
            <CTAButton cta={currentTicket && requireExtraQuestions ? () => goToExtraQuestions(attendeeId) : goToMyOrders} clear={clearWidgetState} close={closeWidget}>
                {orderCompleteButtonText}
            </CTAButton>
        )
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.circle}>
                <i className='fa fa-ticket'></i>
            </div>
            <span className={styles.complete}>
               {orderCompleteTitle}
            </span>
            {
                isActive ?
                    (currentTicket && requireExtraQuestions) ?
                        <>
                            <span>{orderComplete1stParagraph}</span>
                            {getCTAButton()}
                        </>
                        :
                        (_hasVirtualAccessLevel) ?
                            <CTAButton cta={goToEvent} clear={clearWidgetState}
                                       close={closeWidget}>{T.translate('purchase_complete_step.access_event_button')}</CTAButton>
                            :
                            <>
                                <span>{orderComplete1stParagraph}</span>
                                {getCTAButton()}
                            </>
                    :
                    <>
                    <span>
                        {
                            T.translate('purchase_complete_step.event_will_start_text', {
                                date: `${startDateFormatted.date}`,
                                time: `${startDateFormatted.time}`,
                                time_zone_label: `${summit.time_zone_label}`
                            })
                        }
                        <br /><br />
                        {orderComplete1stParagraph}
                    </span>
                        <div className={styles.actions}>
                            {getCTAButton()}
                        </div>
                    </>
            }
            <span className={styles.footer}>
                    <RawHTML>
                        {footerHasTicketText}
                    </RawHTML>
            </span>
        </div>
    );
};

export default PurchaseComplete;
