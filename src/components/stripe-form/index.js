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

import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';

import {
    useStripe,
    useElements,
    PaymentElement,
} from '@stripe/react-stripe-js';

import styles from "./index.module.scss";
import { ERROR_TYPE_PAYMENT } from '../../utils/constants';

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


// Slot names are scoped to their shadow root, so widgets on one page don't collide.
const PAYMENT_SLOT = 'stripe-payment';

const StripeForm = ({ reservation, payTicket, userProfile, provider, hidePostalCode, stripeReturnUrl, onError }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [paymentElement, setPaymentElement] = useState(null);

    // Stripe cannot see into a shadow tree, so when shadow-mounted the Element is
    // kept in the light DOM and slotted back in flow (stripe/stripe-js#143).
    // undefined while detecting, null in the light DOM, else the shadow host.
    const [slotHost, setSlotHost] = useState(undefined);
    const detectSlotHost = useCallback((node) => {
        if (!node) return;
        const rootNode = node.getRootNode();
        setSlotHost(rootNode instanceof ShadowRoot ? rootNode.host : null);
    }, []);

    useEffect(() => {
        if (elements) {
            setPaymentElement(elements.getElement('payment'));
        }
    }, [elements]);

    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data, ev) => {

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
            if (btn) btn.disabled = false;
            console.log(`StripeForm::onSubmit elements.submit error`, submitError);
            onError({ type: ERROR_TYPE_PAYMENT, msg: stripeErrorCodeMap[submitError?.code]?.message || submitError?.message, exception: submitError })
            return;
        }

        try {
            // Create a payment method using PaymentElement

            let createPaymentMethodOptions = {
                elements
            }

            let address = {}
            // stripe payment payload requires data that's not an empty string
            if (userProfile.locality) address.city = userProfile.locality;
            if (userProfile.country) address.country = userProfile.country;
            if (userProfile.address1) address.line1 = userProfile.address1;
            if (userProfile.address2) address.line2 = userProfile.address2;
            if (!hidePostalCode && userProfile.postal_code) address.postal_code = userProfile.postal_code;
            if (userProfile.region) address.state = userProfile.region;

            createPaymentMethodOptions = {
                ...createPaymentMethodOptions, params: {
                    billing_details: {
                        // only pass address parameter if there' data on it to not send it empty
                        ...(Object.keys(address).length > 0 && { address }),
                        email: userProfile.email,
                        name: `${reservation.owner_first_name} ${reservation.owner_last_name}`,
                    }
                }
            }

            const { paymentMethod, error } = await stripe.createPaymentMethod(createPaymentMethodOptions);

            if (error) {
                if (btn) btn.disabled = false;
                console.log(`StripeForm::onSubmit stripe.createPaymentMethod error`, error);
                onError({ type: ERROR_TYPE_PAYMENT, msg: stripeErrorCodeMap[error?.code]?.message || error.message, exception: error })
                if (paymentElement) paymentElement.clear();
                return;
            }
            // Send the paymentMethod ID to your server
            if (paymentMethod)
                payTicket(provider, { elements, paymentMethod, stripe, stripeReturnUrl, onError });

        } catch (e) {
            console.log(`StripeForm::onSubmit general error`, e);
            onError({ type: ERROR_TYPE_PAYMENT, msg: stripeErrorCodeMap[e?.code]?.message || e.message, exception: e })
        }
    };

    const paymentOptions = {
        layout: {
            type: 'tabs',
            defaultCollapsed: false,
        },
        fields: {
            billingDetails: {
                address: {
                    postalCode: hidePostalCode ? "never" : "auto"
                }
            }
        }
    }

    const renderPaymentElement = () => {
        const paymentEl = <PaymentElement options={paymentOptions} />;
        // Wait for the callback ref: mounting before the context is known would
        // put the Element in the shadow tree, out of Stripe's reach.
        if (slotHost === undefined) return null;
        if (!slotHost) return paymentEl;
        return (
            <>
                <slot name={PAYMENT_SLOT} />
                {createPortal(<div slot={PAYMENT_SLOT}>{paymentEl}</div>, slotHost)}
            </>
        );
    };

    return (
        <form ref={detectSlotHost} className={styles.form} id="payment-form" onSubmit={handleSubmit(onSubmit)}>
            {renderPaymentElement()}
        </form>
    )
};

export default StripeForm;
