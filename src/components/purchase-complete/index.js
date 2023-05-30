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

import React, { useEffect, useMemo } from 'react';
import styles from './index.module.scss';
import { epochToMomentTimeZone } from 'openstack-uicore-foundation/lib/utils/methods';
import { ticketHasAccessLevel } from '../../utils/utils';
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

    const isActive = useMemo(() => summit.start_date <= nowUtc && summit.end_date >= nowUtc, [summit, nowUtc]);
    const currentUserTicket = useMemo(() => checkout?.tickets.find(t => t?.owner?.email == user?.email), [user]);
    const requireExtraQuestions = useMemo(() => completedExtraQuestions(checkout), [user]);
    const _hasVirtualAccessLevel = hasVirtualAccessLevel || (currentUserTicket && ticketHasAccessLevel(currentUserTicket, VirtualAccessLevel));

    const startDateFormatted = {
        date: epochToMomentTimeZone(summit.start_date, summit.time_zone_id).format('MMMM D'),
        time: epochToMomentTimeZone(summit.start_date, summit.time_zone_id).format('hh:mm A')
    };

    if (!checkout) return null;

    let orderComplete1stParagraph = (
        currentUserTicket ? 
            rest.hasOwnProperty('orderComplete1stParagraph') && typeof rest.orderComplete1stParagraph !== 'undefined' ?
                rest.orderComplete1stParagraph
                :
                T.translate('purchase_complete_step.finish_now_label')
            : 
            rest.hasOwnProperty('initialOrderComplete1stParagraph') && typeof rest.initialOrderComplete1stParagraph !== 'undefined' ?
                rest.initialOrderComplete1stParagraph
                : 
                T.translate('purchase_complete_step.my_orders_label')
    );

    let orderCompleteButtonText = (
        currentUserTicket ? 
            rest.hasOwnProperty('orderCompleteButton') && typeof rest.orderCompleteButton !== 'undefined' ?
                rest.orderCompleteButton
                :
                null
            : 
            rest.hasOwnProperty('initialOrderCompleteButton') && typeof rest.initialOrderCompleteButton !== 'undefined' ?
                rest.initialOrderCompleteButton
                : 
                null
    );

    let orderComplete2ndParagraph = (
        currentUserTicket ? 
            rest.hasOwnProperty('orderComplete2ndParagraph') && typeof rest.orderComplete2ndParagraph !== 'undefined' ?
                rest.orderComplete2ndParagraph 
                : 
                T.translate('purchase_complete_step.footer_has_ticket_text') 
            : 
            rest.hasOwnProperty('initialOrderComplete2ndParagraph') && typeof rest.initialOrderComplete2ndParagraph !== 'undefined' ?
                rest.initialOrderComplete2ndParagraph 
                :
                null
    );

    let footerHasTicketText = `${orderComplete2ndParagraph} ${T.translate('purchase_complete_step.footer_assistance_text', { supportEmail: `${supportEmail}` })}`;

    return (
        <div className={styles.wrapper}>
            <div className={styles.circle}>
                <i className='fa fa-ticket'></i>
            </div>
            <span className={styles.complete}>
               {T.translate('purchase_complete_step.title')}
            </span>
            {
                isActive ?
                    (currentUserTicket && requireExtraQuestions) ?
                        <>
                            <span>{orderComplete1stParagraph ? orderComplete1stParagraph : T.translate('purchase_complete_step.finish_now_label')}</span>
                            <CTAButton cta={goToExtraQuestions} clear={clearWidgetState} close={closeWidget}>
                                {orderCompleteButtonText ? orderCompleteButtonText : T.translate('purchase_complete_step.my_orders_button')}
                            </CTAButton>
                        </>
                        :
                        (_hasVirtualAccessLevel) ?
                            <CTAButton cta={goToEvent} clear={clearWidgetState}
                                       close={closeWidget}>{T.translate('purchase_complete_step.access_event_button')}</CTAButton>
                            :
                            <>
                                <span>{orderComplete1stParagraph ? orderComplete1stParagraph : T.translate('purchase_complete_step.my_orders_label')}</span>
                                <CTAButton cta={goToMyOrders} clear={clearWidgetState} close={closeWidget}>
                                    {orderCompleteButtonText ? orderCompleteButtonText : T.translate('purchase_complete_step.finish_now_button')}
                                </CTAButton>
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
                        {
                            currentUserTicket && requireExtraQuestions ?
                                T.translate('purchase_complete_step.finish_now_label') : orderComplete1stParagraph
                        }
                    </span>
                        <div className={styles.actions}>
                            {
                                currentUserTicket && requireExtraQuestions ?
                                    <CTAButton cta={goToExtraQuestions} clear={clearWidgetState} close={closeWidget}>
                                        {orderCompleteButtonText ? orderCompleteButtonText : T.translate('purchase_complete_step.finish_now_button')}
                                    </CTAButton>
                                    :
                                    <CTAButton cta={goToMyOrders} clear={clearWidgetState} close={closeWidget}>
                                        {orderCompleteButtonText ? orderCompleteButtonText : T.translate('purchase_complete_step.my_orders_button')}
                                    </CTAButton>
                            }
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
