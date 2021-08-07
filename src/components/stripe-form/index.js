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

import React, { useState } from 'react';
import { connect } from "react-redux";

import {
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';

import Swal from 'sweetalert2';

import styles from "./index.module.scss";

const StripeForm = ({ reservation, payTicket, userProfile, marketingData }) => {

    const stripe = useStripe();
    const elements = useElements();

    const [zipCode, setZipCode] = useState('');
    const [zipCodeError, setZipCodeError] = useState({
        required: false,
    })

    const stripeStyle = {
        base: {
            // Add your base input styles here. For example: #d4e5f4
            color: marketingData.color_text_dark,
            fontSize: '16px',
            //fontFamily: 'inherit',
            backgroundColor: '#ffffff',
            '::placeholder': {
                color: marketingData.color_text_input_hints
            }
        },
        invalid: {
            color: '#e5424d',
            ':focus': {
                color: '#3486cd',
            },
        },
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!zipCode) {
            setZipCodeError({ required: true });
            return;
        } else {
            setZipCodeError({ required: false })
        }

        if (!stripe) {
            // Stripe.js has not loaded yet. Make sure to disable
            // form submission until Stripe.js has loaded.
            return;
        }

        const cardElement = elements.getElement(CardNumberElement);

        const { error, token } = await stripe.createToken(cardElement,
            {
                name: `${reservation.owner_first_name} ${reservation.owner_last_name}`,
                address_zip: zipCode,
                address_country: userProfile.country || '',
            }
        );

        if (token) {
            payTicket(token, stripe, zipCode);
        } else if (error) {
            Swal.fire("Payment error", "There's an error generating your payment, please retry.", "warning");
        }
    };

    return (
        <form className={styles.form} id="payment-form" onSubmit={handleSubmit}>
            <div className={styles.fieldWrapper}>
                <CardNumberElement options={{ style: stripeStyle }} />
                <i className="fa fa-credit-card" />
            </div>
            <div className={styles.fieldWrapper}>
                <CardExpiryElement options={{ style: stripeStyle }} />
            </div>
            <div className={styles.fieldWrapper}>
                <CardCvcElement options={{ style: stripeStyle }} />
            </div>
            <div className={styles.fieldWrapper} style={{ marginBottom: `${zipCodeError.required ? '25px' : '0px'}` }}>
                <input
                    placeholder="Zip Code" value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)} />
                {zipCodeError.required && <span>This field is required</span>}
            </div>
        </form>
    )
}

const mapStateToProps = ({ registrationLiteState }) => ({
    marketingData: registrationLiteState.settings.marketingData
})

export default connect(mapStateToProps, null)(StripeForm)