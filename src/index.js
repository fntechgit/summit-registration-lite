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

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import RegistrationModal from './summit-registration-modal';
import RegistrationForm from './summit-registration-form';

import MarketingData from './marketing-data.json';
import SummitData from './summit-data.json';
import ProfileData from './profile.json';

// Dev environment setup
window.API_BASE_URL = process.env.API_BASE_URL;
window.TIMEINTERVALSINCE1970_API_URL = process.env.TIMEINTERVALSINCE1970_API_URL;
if (typeof window !== 'undefined') {
    window.localStorage.setItem('authInfo', JSON.stringify({ accessToken: process.env.ACCESS_TOKEN }));
}

const DevApp = () => {
    const [mode, setMode] = useState('modal');

    const filterProps = {
    authUser: (provider) => console.log('login with ', provider),
    getPasswordlessCode: (email) => Promise.resolve({response: { otp_length: 5, otp_lifetime: 600}}),
    loginWithCode: (code) => Promise.reject('error'),
    getAccessToken: () => process.env.ACCESS_TOKEN,
    closeWidget: () => console.log('close widget'),
    goToExtraQuestions: (attendeeId) => console.log('extra questions required for attendee: ', attendeeId),
    goToMyOrders: () => console.log('go to my orders'),
    goToEvent: () => console.log('go to event'),
    onPurchaseComplete: (order) => console.log('purchase complete', order),
    trackEvent: console.log,
    loading: false,
    apiBaseUrl: process.env.API_BASE_URL,
    summitData: SummitData,
    profileData: ProfileData /* or null */,
    ticketOwned: false,
    ownedTickets: [],
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
    providerOptions: {
        fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap' }],
        style: { base: { fontFamily: `'Nunito Sans', sans-serif` } }
    },
    noAllowedTicketsMessage: '<span>You already have purchased all available tickets for this event and/or there are no tickets available for you to purchase.</span><br/><span>Visit the my orders / my tickets page to review your existing tickets.</span>',
    ticketTaxesErrorMessage: '<span>There was an error getting the information for tickets. Please try again.</span>',
    allowPromoCodes: true,
    showCompanyInput: true,
    // hidePostalCode: true,
    companyDDLPlaceholder: 'Select a company',
    completedExtraQuestions: (attendeeId) => {
        console.log('evalulate user extra questions...', attendeeId)
        return Promise.resolve(true);
    },
        successfulPaymentReturnUrl: `${window.location.origin}`,
        handleCompanyError: (err) => console.log('catch error company', err)
    };

    const toggleStyle = {
        display: 'flex',
        gap: '10px',
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 99999,
        backgroundColor: 'white',
        padding: '10px 15px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
    };

    const buttonStyle = (isActive) => ({
        padding: '10px 20px',
        cursor: 'pointer',
        backgroundColor: isActive ? '#1EAAA3' : '#f0f0f0',
        color: isActive ? '#fff' : '#333',
        border: 'none',
        borderRadius: '4px',
        fontWeight: isActive ? 'bold' : 'normal'
    });

    return (
        <div style={{ width: '1080px', margin: '0 auto' }}>
            <div style={toggleStyle}>
                <button style={buttonStyle(mode === 'modal')} onClick={() => setMode('modal')}>
                    Modal
                </button>
                <button style={buttonStyle(mode === 'form')} onClick={() => setMode('form')}>
                    Standalone Form
                </button>
            </div>
            {mode === 'modal' && <RegistrationModal {...filterProps} />}
            {mode === 'form' && <RegistrationForm {...filterProps} />}
        </div>
    );
};

ReactDOM.render(<DevApp />, document.querySelector('#root'));
