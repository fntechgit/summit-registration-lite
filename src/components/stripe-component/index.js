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

import { loadStripe } from '@stripe/stripe-js';

import { Elements } from '@stripe/react-stripe-js';

import StripeForm from '../stripe-form';


const StripeProvider = ({ userProfile, reservation, payTicket, providerKey, provider, stripeOptions }) => {

    const stripePromise = useMemo(() => loadStripe(providerKey), [providerKey])

    const options = {
        fonts: stripeOptions?.fonts,
        mode: 'payment',
        currency: 'usd',
        amount: 15
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
            />
        </Elements>        
        :
        <div>Loading...</div>
    );
}


export default StripeProvider;

