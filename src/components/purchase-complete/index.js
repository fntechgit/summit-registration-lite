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

import styles from "./index.module.scss";

import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/methods";

const PurchaseComplete = ({ checkout, goToExtraQuestions, goToEvent, summit, supportEmail = "support@fntech.com" }) => {

    const date = new Date();
    let now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
        date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()) / 1000;

    const isActive = summit.start_date < now_utc && summit.end_date > now_utc;

    const startDateFormatted = {
        date: epochToMomentTimeZone(summit.start_date, summit.time_zone_id).format('MMMM D'),
        time: epochToMomentTimeZone(summit.start_date, summit.time_zone_id).format('HH:mm'),
    };

    const requireExtraQuestions = () => {
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
                requireExtraQuestions() ?
                    <>
                        <span>
                            Before entering the event you need to complete some extra questions <br />
                        </span>
                        <button className="button" onClick={() => goToExtraQuestions()}>Anser now</button>
                    </>
                    :
                    <>
                        <button className="button" onClick={() => goToEvent()}>Access event now</button>
                    </>
                :
                <>
                    <span>
                        The event will start on {startDateFormatted.date} at {startDateFormatted.time} {summit.time_zone_id} <br />
                        Got time for a few extra questions?
                    </span>
                    <button className="button" onClick={() => goToExtraQuestions()}>Anser now</button>
                </>
            }
            <span className={styles.footer}>
                For further assistance, please email <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
            </span>
        </div>
    )
}
export default PurchaseComplete;