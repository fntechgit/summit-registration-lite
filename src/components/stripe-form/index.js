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
import { useForm } from 'react-hook-form';

import {
    useStripe,
    useElements,
    PaymentElement,
} from '@stripe/react-stripe-js';

import Swal from 'sweetalert2';

import styles from "./index.module.scss";

const stripeErrorCodeMap = {
    'incomplete_number': {
        field: 'cardNumber',
        message: 'This field is required.'
    },
    'incorrect_number': {
        field: 'cardNumber'
    },
    'invalid_number': {
        field: 'cardNumber'
    },
    'card_declined': {
        field: 'cardNumber'
    },
    'incomplete_cvc': {
        field: 'cardCvc',
        message: 'This field is required.'
    },
    'incorrect_cvc': {
        field: 'cardCvc'
    },
    'invalid_cvc': {
        field: 'cardCvc'
    },
    'incomplete_expiry': {
        field: 'cardExpiry',
        message: 'This field is required.'
    },
    'invalid_expiry_month': {
        field: 'cardExpiry'
    },
    'invalid_expiry_year': {
        field: 'cardExpiry'
    },
    'expired_card': {
        field: 'cardExpiry'
    }
};


const StripeForm = ({ reservation, payTicket, provider, hidePostalCode, stripeReturnUrl, onPaymentError }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [stripeErrors, setStripeErrors] = useState({});
    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data, ev) => {

        setStripeErrors({});

        if (!stripe || !elements) {
            // Stripe.js has not loaded yet. Make sure to disable
            // form submission until Stripe.js has loaded.
            return;
        }
        const btn = document.getElementById('payment-form-btn');
        if (btn) btn.disabled = true;

        // Trigger form validation and wallet collection
        const { error: submitError } = await elements.submit();
        if (submitError) {
            return;
        }

        try {
            // Create a payment method using PaymentElement
            const { paymentMethod, error } = await stripe.createPaymentMethod({
                elements
            });

            if (error) {
                if (stripeErrorCodeMap[error.code]) {
                    setStripeErrors({
                        [stripeErrorCodeMap[error.code].field]: stripeErrorCodeMap[error.code].message || error.message
                    });
                }
                if (btn) btn.disabled = false;
            } else {
                // Send the paymentMethod ID to your server
                if (paymentMethod) {
                    payTicket(provider, { elements, paymentMethod, stripe, stripeReturnUrl, onPaymentError});
                } else if (error) {
                    if (stripeErrorCodeMap[error.code]) {
                        setStripeErrors({
                            [stripeErrorCodeMap[error.code].field]: stripeErrorCodeMap[error.code].message || error.message
                        });
                    } else {
                        onPaymentError(error.message);
                    }
                }
            }
        } catch (error) {
            // setPaymentError('Error processing payment');
            if (stripeErrorCodeMap[error.code]) {
                setStripeErrors({
                    [stripeErrorCodeMap[error.code].field]: stripeErrorCodeMap[error.code].message || error.message
                });
                return;
            }
            onPaymentError(error.message);
        }
    };

    const paymentOptions = {
        fields: {
            billingDetails: {
                address: {
                    postalCode: hidePostalCode ? "never" : "auto"
                }
            }
        }
    }

    return (
        <form className={styles.form} id="payment-form" onSubmit={handleSubmit(onSubmit)}>
            <PaymentElement options={paymentOptions} />
        </form>
    )
};

export default StripeForm;
