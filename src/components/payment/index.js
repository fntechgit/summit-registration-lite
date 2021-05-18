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

const PaymentComponent = ({ isActive }) => {

    const [paymentInfo, setPaymentInfo] = useState(
        {
            cardNumber: '',
            expirationDate: '',
            cvc: '',
            zipCode: '',
        }
    )

    useEffect(() => {
    }, [paymentInfo])

    return (
        <div className={`${styles.outerWrapper} step-wrapper`}>
            <>
                <div className={`${styles.innerWrapper}`}>
                    <div className={styles.title} >
                        <span>Payment</span>
                    </div>
                    <div className={styles.form}>
                        <div>
                            <input
                                onChange={e => setPaymentInfo({ ...paymentInfo, cardNumber: e.target.value })}
                                value={paymentInfo.cardNumber}
                                placeholder="Card Number *"
                            />
                            <i className="fa fa-credit-card"></i>
                        </div>
                        <input
                            onChange={e => setPaymentInfo({ ...paymentInfo, expirationDate: e.target.value })}
                            value={paymentInfo.expirationDate}
                            placeholder="Expiration Date *"
                        />
                        <input
                            onChange={e => setPaymentInfo({ ...paymentInfo, cvc: e.target.value })}
                            value={paymentInfo.cvc}
                            placeholder="CVC *"
                        />
                        <input
                            onChange={e => setPaymentInfo({ ...paymentInfo, zipCode: e.target.value })}
                            value={paymentInfo.zipCode}
                            placeholder="Zip Code *"
                        />
                    </div>
                </div>
            </>
        </div>
    );
}


export default PaymentComponent

