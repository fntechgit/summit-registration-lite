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

import React from "react";
import { Provider } from "react-redux";
import { getStore, getPersistor } from "./store";
import { PersistGate } from "redux-persist/integration/react";
import RegistrationLite from "./components/registration-lite";

window.API_BASE_URL             = process.env['API_BASE_URL'];

if(typeof window !== 'undefined') {
    window.localStorage.setItem('authInfo', JSON.stringify({accessToken: process.env['ACCESS_TOKEN']}));
}

class RegistrationLiteWidget extends React.PureComponent {

    constructor(props) {
        super(props);
        this.store = getStore(props.clientId, props.apiBaseUrl, props.getAccessToken);
    }

    render() {
        return (
            <Provider store={this.store}>
                <PersistGate persistor={getPersistor()}>
                    <RegistrationLite {...this.props} />
                </PersistGate>
            </Provider>
        );
    }
}

export {default as LoginComponent} from './components/login';
export {default as PasswordlessLoginComponent} from './components/login-passwordless';

export default RegistrationLiteWidget;