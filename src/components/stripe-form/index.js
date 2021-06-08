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

import {
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement,
    useStripe,
    useElements,
    CardElement
} from '@stripe/react-stripe-js';

import Swal from 'sweetalert2';

import styles from "./index.module.scss";

const StripeForm = ({ reservation, payTicket, getAccessToken }) => {

    const stripe = useStripe();
    const elements = useElements();

    const stripeStyle = {
        base: {
            // Add your base input styles here. For example: #d4e5f4
            color: '#3486cd',
            fontSize: '16px',
            backgroundColor: '#e6f3ff',
            '::placeholder': {
                color: '#A4C7E6'
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

        if (!stripe) {
            // Stripe.js has not loaded yet. Make sure to disable
            // form submission until Stripe.js has loaded.
            return;
        }

        const cardElement = elements.getElement(CardElement);

        const { error, token } = await stripe.createToken(cardElement,
            {
                name: `${reservation.owner_first_name} ${reservation.owner_last_name}`,
            }
        );

        if (token) {
            payTicket(token, stripe, getAccessToken);
        } else if (error) {
            Swal.fire("Payment error", "There's an error generating your payment, please retry.", "warning");
        }

    };

    return (
        <form className={styles.form} id="payment-form" onSubmit={handleSubmit}>
            <div className={styles.fieldWrapper}>
                <CardElement options={{ style: stripeStyle }} />
            </div>
        </form>
    )
}
export default StripeForm;