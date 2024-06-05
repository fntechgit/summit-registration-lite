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

import React, { useMemo } from 'react';
import merge from 'lodash/merge';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeForm from '../stripe-form';

import { DefaultBGColor, DefaultTextColor, DefaultHintColor } from '../../utils/constants';


const StripeProvider = ({ userProfile, reservation, payTicket, providerKey, provider, stripeOptions, hidePostalCode }) => {

    const stripePromise = useMemo(() => loadStripe(providerKey), [providerKey]);

    let bgColor = DefaultBGColor;
    let bgColorDark = DefaultBGColor;
    let textColor = DefaultTextColor;
    let textColorDark = DefaultTextColor;
    let hintColor = DefaultHintColor;
    let borderColor = DefaultHintColor;

    if (document && document.documentElement) {
        const documentStyles = getComputedStyle(document.documentElement);
        bgColor = documentStyles.getPropertyValue('--color_input_background_color');
        textColor = documentStyles.getPropertyValue('--color_input_text_color');
        textColorDark = documentStyles.getPropertyValue('--color_text_light');
        bgColorDark = documentStyles.getPropertyValue('--color_background_dark');
        hintColor = documentStyles.getPropertyValue('--color_text_input_hints');
        borderColor = documentStyles.getPropertyValue('--color_input_border_color');

    }    

    const stripeStyle = merge({}, {        
        variables: {
            borderRadius: '5px',
            colorBackground: bgColor,
            colorTextPlaceholder: hintColor,
            colorText: textColor,
            colorDanger: '#e5424d',
            textColorDark: textColorDark,
            bgColorDark: bgColorDark,
        },
        rules: {
            '.Block': {
                backgroundColor: 'var(--colorBackground)',
                boxShadow: 'none',
                padding: '12px'
            },
            '.Input': {
                color: 'var(--textColor)',
                backgroundColor: 'var(--colorBackground)',
                borderColor: 'var(--hintColor)',
                padding: '12px'
            },
            '.Input:disabled, .Input--invalid:disabled': {
                color: 'lightgray'
            },
            '.Tab': {
                padding: '10px 12px 8px 12px',
                border: 'none'
            },
            '.Tab:hover': {
                border: 'none',
                boxShadow: '0px 1px 1px rgba(0, 0, 0, 0.03), 0px 3px 7px rgba(18, 42, 66, 0.04)'
            },
            '.Tab--selected, .Tab--selected:focus, .Tab--selected:hover': {
                border: 'none',
                backgroundColor: 'var(--bgColorDark)',
                color: 'var(--textColorDark)',
                boxShadow: '0 0 0 1.5px var(--colorPrimaryText), 0px 1px 1px rgba(0, 0, 0, 0.03), 0px 3px 7px rgba(18, 42, 66, 0.04)'
            },
            '.Label': {
                fontWeight: '500',
                color: 'var(--textColor)',
            }
        },
        invalid: {
            color: '#e5424d',
            ':focus': {
                color: '#3486cd',
            },
        },
    }, stripeOptions?.style);

    const options = {
        fonts: stripeOptions?.fonts,
        mode: 'payment',
        paymentMethodCreation: 'manual',
        currency: reservation?.currency.toLowerCase(),
        amount: reservation?.amount_in_cents,
        appearance: stripeStyle
    };

    return (
        reservation ?
        <Elements stripe={stripePromise} options={options}>
            <StripeForm
                reservation={reservation}
                payTicket={payTicket}
                userProfile={userProfile}
                stripeOptions={stripeOptions}
                provider={provider}
                hidePostalCode={hidePostalCode}
            />
        </Elements>        
        :
        <div>Loading...</div>
    );
}


export default StripeProvider;

