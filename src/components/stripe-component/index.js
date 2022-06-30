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
import PropTypes from 'prop-types';

import { loadStripe } from '@stripe/stripe-js';

import { Elements } from '@stripe/react-stripe-js';

import StripeForm from '../stripe-form';


const StripeProvider = ({ userProfile, reservation, payTicket, providerKey, provider, stripeOptions }) => {

    const stripePromise = useMemo(() => loadStripe(providerKey), [providerKey])

    const options = {
        fonts: stripeOptions?.fonts
    };

    return (
        <Elements options={options} stripe={stripePromise}>
            <StripeForm
                reservation={reservation}
                payTicket={payTicket}
                userProfile={userProfile}
                stripeOptions={stripeOptions}
                provider={provider}
            />
        </Elements>
    );
}


export default StripeProvider;

