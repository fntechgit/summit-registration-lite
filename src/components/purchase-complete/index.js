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

    let orderCompleteButtonText = (
        currentUserTicket && requireExtraQuestions ?
            rest.hasOwnProperty('initialOrderCompleteButton') && typeof rest.initialOrderCompleteButton !== 'undefined' ?
                rest.initialOrderCompleteButton
                :
                T.translate('purchase_complete_step.initial_order_complete_button')
            :
            rest.hasOwnProperty('orderCompleteButton') && typeof rest.orderCompleteButton !== 'undefined' ?
                rest.orderCompleteButton
                :
                T.translate('purchase_complete_step.order_complete_button')
    );

    let orderComplete1stParagraph = (
        currentUserTicket ?
            rest.hasOwnProperty('initialOrderComplete1stParagraph') && typeof rest.initialOrderComplete1stParagraph !== 'undefined' ?
                rest.initialOrderComplete1stParagraph
                :
                T.translate('purchase_complete_step.initial_order_complete_1st_paragraph_label', {button: orderCompleteButtonText})
            :
            rest.hasOwnProperty('orderComplete1stParagraph') && typeof rest.orderComplete1stParagraph !== 'undefined' ?
                rest.orderComplete1stParagraph
                :
                T.translate('purchase_complete_step.order_complete_1st_paragraph_label')
    );

    let orderComplete2ndParagraph = (
        currentUserTicket ?
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
            <CTAButton cta={currentUserTicket && requireExtraQuestions ? goToExtraQuestions : goToMyOrders} clear={clearWidgetState} close={closeWidget}>
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
               {T.translate('purchase_complete_step.title')}
            </span>
            {
                isActive ?
                    (currentUserTicket && requireExtraQuestions) ?
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
