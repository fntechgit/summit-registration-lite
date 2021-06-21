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
import { Provider } from 'react-redux'
import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import { persistStore, persistCombineReducers } from 'redux-persist'
import storage from 'redux-persist/es/storage' // default: localStorage if web, AsyncStorage if react-native
import { PersistGate } from 'redux-persist/integration/react';
import WidgetReducer from './reducer'
import RegistrationLite from "./components/registration-lite";

const RegistrationLiteWidget = ( props ) => {    
    
    const config = {
        key: `root_registration_lite`,
        storage,
    }

    const persistedReducers = persistCombineReducers(config, {
        widgetState: WidgetReducer
    });

    const composeEnhancers = typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ : compose;

    const store = createStore(persistedReducers, compose(applyMiddleware(thunk)));

    const onRehydrateComplete = () => { }

    const persistor = persistStore(store, null, onRehydrateComplete);


    return (
        <Provider store={store}>
            <PersistGate persistor={persistor}>
                <RegistrationLite {...props} />
            </PersistGate>
        </Provider>
    );
}

export default RegistrationLiteWidget;
