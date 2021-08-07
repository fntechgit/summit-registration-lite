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
    getAccessToken: () => '4sblb~TCB4.X8Yzk713kztvjAY2N2RRnX0VgnVK3PSYhwEZqRCwyDbXE3gxaLz53cEbFptfR4C1rm0jWsuAMtzCyLxOktJ4I1DvV7i3GYmNP4B_k2BuYzWs-JMkXncDh',
    closeWidget: () => console.log('close widget'),
    goToExtraQuestions: () => console.log('extra questions required'),
    goToEvent: () => console.log('go to event'),
    goToRegistration: () => console.log('go to registration page'),
    onPurchaseComplete: (order) => console.log('purchase complete', order),
    loading: false,
    apiBaseUrl: 'https://api.dev.fnopen.com',
    summitData: SummitData.summit,
    profileData: ProfileData,
    ticketOwned: false,
    marketingData: MarketingData.colors,
    supportEmail: 'support@fntech.com',
    loginOptions: [
        { button_color: '#082238', provider_label: 'FNid', provider_param: 'fnid' },
        { button_color: '#0370C5', provider_label: 'Facebook', provider_param: 'facebook' },
        { button_color: '#DD4437', provider_label: 'Google', provider_param: 'google' },
        { button_color: '#000000', provider_label: 'Apple ID', provider_param: 'apple_id' },
        { button_color: '#2272E7', provider_label: 'Microsoft', provider_param: 'microsoft' },
    ],
};


// width 780px or 230px

ReactDOM.render(
    <div style={{ width: '1080px', margin: '0 auto' }}>
        <RegistrationLiteWidget {...filterProps} />
    </div>,
    document.querySelector('#root')
);
