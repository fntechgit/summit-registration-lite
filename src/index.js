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
    getAccessToken: () => 'userAccesToken',
    closeWidget: () => console.log('close widget'),
    goToExtraQuestions: () => console.log('extra questions required'),
    goToEvent: () => console.log('go to event'),
    apiBaseUrl: 'https://api.dev.fnopen.com',
    summitData: SummitData.summit,
    profileData: ProfileData,
    marketingData: MarketingData.colors,
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
