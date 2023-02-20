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

import React, { useEffect } from 'react';
import styles from "./index.module.scss";

import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";

const PurchaseComplete = ({
    checkout,
    onPurchaseComplete,
    goToExtraQuestions,
    goToEvent,
    goToMyOrders,
    summit,
    ownedTickets,
    nowUtc,
    supportEmail = "support@fntech.com" }) => {

    useEffect(() => {
        onPurchaseComplete(checkout)
    }, []);


    const isActive = summit.start_date <= nowUtc && summit.end_date >= nowUtc;

    const startDateFormatted = {
        date: epochToMomentTimeZone(summit.start_date, summit.time_zone_id).format('MMMM D'),
        time: epochToMomentTimeZone(summit.start_date, summit.time_zone_id).format('hh:mm A'),
    };

    const needExtraQuestions = () => {
        return summit.order_extra_questions.some(q => q.mandatory === true) ? true : false;
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.circle}>
                <i className="fa fa-ticket"></i>
            </div>
            <span className={styles.complete}>
                Your order is complete
            </span>
            {isActive ?
                needExtraQuestions() ?
                    <>
                        <span>
                            This ticket requires additional details. <br />
                        </span>
                        <button className={`${styles.button} button`} onClick={() => goToExtraQuestions()}>Finish now</button>
                    </>
                    :
                    <>
                        <button className={`${styles.button} button`} onClick={() => goToEvent()}>Access event now</button>
                    </>
                :
                <>
                    <span>
                        The event will start on {startDateFormatted.date} at {startDateFormatted.time} {summit.time_zone_label} <br /><br />
                        {ownedTickets ?
                            `You may visit the My Orders/Tickets tab in the top right-hand corner of the navigation bar to
                            assign/reassign tickets or to complete any required ticket details.`
                            :
                            `A ticket has been assigned to you. To complete your additional ticket details, please click the "Finish Now" button.`
                        }
                    </span>
                    <div className={styles.actions}>
                        {ownedTickets ?
                            <button className={`${styles.button} button`} onClick={() => goToMyOrders()}>View My Orders/Tickets</button>
                            :
                            <button className={`${styles.button} button`} onClick={() => goToExtraQuestions()}>Finish Now</button>
                        }
                    </div>
                </>
            }
            <span className={styles.footer}>
                {ownedTickets ?
                    <>
                        For further assistance, please email <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
                    </>
                    :
                    <>
                        If you wish to transfer your assigned ticket, close this window and visit the "My Orders/Tickets" tab
                        in the top navigation bar. For further assistance, please email <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
                    </>}

            </span>
        </div>
    )
}
export default PurchaseComplete;
