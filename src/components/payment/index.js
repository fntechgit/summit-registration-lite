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

import { useSpring, config, animated } from "react-spring";
import { useMeasure } from "react-use";

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

import styles from "./index.module.scss";
import StripeForm from '../stripe-form';


const PaymentComponent = ({ isActive, summit, reservation, payTicket, getAccessToken }) => {

    const [ref, { height }] = useMeasure();    

    const toggleAnimation = useSpring({
        config: { bounce: 0, ...config.stiff },
        from: { opacity: 0, height: 0 },
        to: {
            opacity: 1,
            height: isActive ? height + 10 : 0,
            marginBottom: isActive ? 5 : 0
        }
    });

    let publicKey = null;
    for (let profile of summit.payment_profiles) {
        if (profile.application_type === 'Registration') {
            publicKey = profile.test_mode_enabled ? profile.test_publishable_key : profile.live_publishable_key;
            break;
        }
    }

    const [stripePromise, setStripePromise] = useState(() => loadStripe(publicKey))

    return (
        <div className={`${styles.outerWrapper} step-wrapper`}>
            <>
                <div className={`${styles.innerWrapper}`}>
                    <div className={styles.title} >
                        <span>Payment</span>
                    </div>
                    <animated.div style={{ overflow: 'hidden', ...toggleAnimation }}>
                        <div ref={ref}>
                            <Elements stripe={stripePromise}>
                                <StripeForm reservation={reservation} payTicket={payTicket} getAccessToken={getAccessToken} />
                            </Elements>
                        </div>
                    </animated.div>
                </div>
            </>
        </div>
    );
}


export default PaymentComponent;

