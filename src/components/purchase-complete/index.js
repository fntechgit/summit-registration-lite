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

import moment from "moment-timezone";

const PurchaseComplete = ({ checkout, onPurchaseComplete, goToExtraQuestions, goToEvent, summit, supportEmail = "support@fntech.com" }) => {

    useEffect(() => {
        onPurchaseComplete(checkout)
    }, []);

    const date = new Date();
    let now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
        date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()) / 1000;

    const isActive = summit.start_date < now_utc && summit.end_date > now_utc;

    const startDateFormatted = {
        date: epochToMomentTimeZone(summit.start_date, summit.time_zone_id).format('MMMM D'),
        time: epochToMomentTimeZone(summit.start_date, summit.time_zone_id).format('HH:mm'),
    };

    const formattedTimeZone = moment().tz(summit.time_zone_id).format('Z z');

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
                        The event will start on {startDateFormatted.date} at {startDateFormatted.time} {formattedTimeZone} <br />
                        This ticket requires additional details.
                    </span>
                    <div className={styles.actions}>
                        <button className={`${styles.button} button`} onClick={() => goToExtraQuestions()}>Finish Now</button>
                        <button className={`${styles.button} button`} onClick={() => goToEvent()}>Do this later</button>
                    </div>
                </>
            }
            <span className={styles.footer}>
                For further assistance, please email <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
            </span>
        </div>
    )
}
export default PurchaseComplete;