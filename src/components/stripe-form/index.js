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
import { useForm } from 'react-hook-form';
import merge from 'lodash/merge';

import {
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement,
    useStripe,
    useElements,
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

const StripeForm = ({ reservation, payTicket, userProfile, marketingData, stripeOptions, provider }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [stripeErrors, setStripeErrors] = useState({});
    const { register, handleSubmit, formState: { errors } } = useForm();

    const stripeStyle = merge({}, {
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
    }, stripeOptions?.style);

    const onSubmit = async (data) => {
        setStripeErrors({});

        if (!stripe) {
            // Stripe.js has not loaded yet. Make sure to disable
            // form submission until Stripe.js has loaded.
            return;
        }

        const cardElement = elements.getElement(CardNumberElement);

        const { error, token } = await stripe.createToken(cardElement, {
            name: `${reservation.owner_first_name} ${reservation.owner_last_name}`,
            address_zip: data.zipCode,
            address_country: userProfile.country || '',
        });

        if (token) {
            payTicket(provider, token, stripe, data.zipCode);
        } else if (error) {
            if (stripeErrorCodeMap[error.code]) {
                setStripeErrors({
                    [stripeErrorCodeMap[error.code].field]: stripeErrorCodeMap[error.code].message || error.message
                });
            } else {
                Swal.fire("Payment error", error.message, "warning");
            }
        }
    };

    return (
        <form className={styles.form} id="payment-form" onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.fieldWrapper}>
                <div className={styles.inputWrapper}>
                    <CardNumberElement options={{ style: stripeStyle, placeholder: '1234 1234 1234 1234 *' }} />
                    <i className="fa fa-credit-card" />
                </div>
                {stripeErrors.cardNumber && <div className={styles.fieldError}>{stripeErrors.cardNumber}</div>}
            </div>

            <div className={styles.fieldWrapper}>
                <div className={styles.inputWrapper}>
                    <CardExpiryElement options={{ style: stripeStyle, placeholder: 'MM / YY *' }} />
                </div>
                {stripeErrors.cardExpiry && <div className={styles.fieldError}>{stripeErrors.cardExpiry}</div>}
            </div>

            <div className={styles.fieldWrapper}>
                <div className={styles.inputWrapper}>
                    <CardCvcElement options={{ style: stripeStyle, placeholder: 'CVC *' }} />
                </div>
                {stripeErrors.cardCvc && <div className={styles.fieldError}>{stripeErrors.cardCvc}</div>}
            </div>

            <div className={styles.fieldWrapper}>
                <div className={styles.inputWrapper}>
                    <input type="text" placeholder="ZIP Code *" onChange={(e) => setZipCode(e.target.value)} {...register("zipCode", { required: true })} />
                </div>
                {(errors.zipCode) && (
                    <div className={styles.fieldError}>This field is required.</div>
                )}
            </div>
        </form>
    )
};

const mapStateToProps = ({ registrationLiteState }) => ({
    marketingData: registrationLiteState.settings.marketingData
});

export default connect(mapStateToProps, null)(StripeForm);
