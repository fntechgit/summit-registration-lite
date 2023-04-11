/**
 * Copyright 2017 OpenStack Foundation
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

import React from 'react';
import ReactDOM from 'react-dom';
import RegistrationLiteWidget from './summit-registration-lite';

import MarketingData from './marketing-data.json';
import SummitData from './summit-data.json';
import ProfileData from './profile.json';

const filterProps = {
    authUser: (provider) => console.log('login with ', provider),
    getPasswordlessCode: (email) => console.log('get code', email),
    loginWithCode: (code) => console.log('login with code', code),
    getAccessToken: () => 'IPojz~XCin7pOgu7v_THLLheZh6J2yILgbuAZ6FUnArI.vXAKtngyYBSmT~rDObZ19ypD6hpThi.ZnTdlGBRZKw4u2YvBW2Y_R8FTXaxlmdpJqF3Y5qN1eJ0_vMIklJ1',
    closeWidget: () => console.log('close widget'),
    goToExtraQuestions: () => console.log('extra questions required'),
    goToMyOrders: () => console.log('go to my orders'),
    goToEvent: () => console.log('go to event'),    
    onPurchaseComplete: (order) => console.log('purchase complete', order),
    loading: false,
    apiBaseUrl: process.env.API_BASE_URL,
    summitData: SummitData,
    profileData: ProfileData,
    ticketOwned: false,
    // ownedTickets: [
    //     {type_id: 77, qty: 7},
    //     {type_id: 78, qty: 61},
    // ],
    marketingData: MarketingData.colors,
    supportEmail: 'support@fntech.com',
    allowsNativeAuth: true,
    allowsOtpAuth: true,
    loginOptions: [
        { button_color: '#082238', provider_label: 'FNid', provider_param: 'fnid' },
        { button_color: '#1877F2', provider_label: 'Continue with Facebook', provider_param: 'facebook', provider_logo: 'https://facebookbrand.com/wp-content/uploads/2019/10/Copy-of-facebook-app.svg', provider_logo_size: 22 },
        { button_color: '#0A66C2', provider_label: 'Sign in with LinkedIn', provider_param: 'linkedin', provider_logo: 'https://svgur.com/i/ZxJ.svg', provider_logo_size: 21 },
        { button_color: '#000000', provider_label: 'Continue with Apple', provider_param: 'apple_id', provider_logo: 'https://upload.wikimedia.org/wikipedia/commons/3/31/Apple_logo_white.svg', provider_logo_size: 19 },
        { button_color: '#FFFFFF', font_color: '#00297a', provider_label: 'Continue with Okta', provider_param: 'okta', provider_logo: 'https://cdn.icon-icons.com/icons2/2699/PNG/512/okta_logo_icon_169896.png', provider_logo_size: 19 },
        { button_color: '#2272E7', provider_label: 'Microsoft', provider_param: 'microsoft' },
    ],
    stripeOptions: {
        fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap' }],
        style: { base: { fontFamily: `'Nunito Sans', sans-serif` } }
    },
    noAllowedTicketsMessage: '<span>You already have purchased all available tickets for this event and/or there are no tickets available for you to purchase.</span><br/><span>Visit the my orders / my tickets page to review your existing tickets.</span>',
    ticketTaxesErrorMessage: '<span>There was an error getting the information for tickets. Please try again.</span>',
    allowPromoCodes: true,
    showCompanyInput: true,
    companyInputPlaceholder: 'Enter your company!',
    companyDDLPlaceholder: 'Select a company',
    completedExtraQuestions: () => console.log('evalulate user extra questions...')
};

// width 780px or 230px

ReactDOM.render(
    <div style={{ width: '1080px', margin: '0 auto' }}>
        {window.TIMEINTERVALSINCE1970_API_URL=process.env.TIMEINTERVALSINCE1970_API_URL}
        <RegistrationLiteWidget {...filterProps} />
    </div>,
    document.querySelector('#root')
);
