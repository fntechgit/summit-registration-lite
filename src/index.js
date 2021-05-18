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
import RegistrationLiteWidget from './registration-lite-widget';

import MarketingData from './marketing-data.json';
import SummitData from './summit-data.json';
import ProfileData from './profile.json';

const filterProps = {
    summitData: SummitData.summit,
    profileData: ProfileData,
    marketingData: MarketingData.colors,
    getAccessToken: () => console.log('access token request'),
    closeWidget: () => console.log('close widget'),
    onRef: console.log,
};


// width 780px or 230px

ReactDOM.render(
    <div style={{ width: '1080px', margin: '0 auto' }}>
        <RegistrationLiteWidget {...filterProps} />
    </div>,
    document.querySelector('#root')
);
