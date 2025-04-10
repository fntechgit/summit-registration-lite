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

import styles from "./index.module.scss";
import LawpayForm from '../lawpay-form';
import StripeProvider from '../stripe-component';
import { Helmet } from 'react-helmet';


const PaymentComponent = ({ isActive, userProfile, reservation, payTicket, providerKey, provider, stripeOptions, timestamp, hidePostalCode }) => {

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

    return (
        <div className={`${styles.outerWrapper} step-wrapper`}>
            <>
                <div className={`${styles.innerWrapper}`}>
                    <div className={styles.title} >
                        <span>Payment</span>
                    </div>
                    <animated.div style={{ overflow: `${isActive ? '' : 'hidden'}`, ...toggleAnimation }}>
                        <div ref={ref}>
                            {provider === 'Stripe' &&
                                <StripeProvider
                                    provider={provider}
                                    providerKey={providerKey}
                                    reservation={reservation}
                                    payTicket={payTicket}
                                    userProfile={userProfile}
                                    stripeOptions={stripeOptions}
                                    hidePostalCode={hidePostalCode}
                                />
                            }
                            {provider === 'LawPay' &&
                                <>
                                    <Helmet>
                                        <script src="https://cdn.affinipay.com/hostedfields/1.1.1/fieldGen_1.1.1.js"></script>
                                    </Helmet>
                                    <LawpayForm
                                        provider={provider}
                                        reservation={reservation}
                                        payTicket={payTicket}
                                        userProfile={userProfile}
                                        providerKey={providerKey}
                                        timestamp={timestamp} />
                                </>
                            }
                        </div>
                    </animated.div>
                </div>
            </>
        </div>
    );
}


export default PaymentComponent;

