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


import {
    START_WIDGET_LOADING,
    STOP_WIDGET_LOADING,
    LOAD_INITIAL_VARS,
    CHANGE_STEP,
    CREATE_RESERVATION_SUCCESS,
    DELETE_RESERVATION_SUCCESS,
    CLEAR_RESERVATION,
    PAY_RESERVATION,
    GET_TICKET_TYPES,
    GET_TAX_TYPES,
    SET_PASSWORDLESS_LOGIN,
    SET_PASSWORDLESS_LENGTH,
    SET_PASSWORDLESS_ERROR,
    GO_TO_LOGIN,
    GET_MY_INVITATION,
    CLEAR_MY_INVITATION,
    CLEAR_WIDGET_STATE,
    REQUESTED_TICKET_TYPES,
    UPDATE_CLOCK,
    LOAD_PROFILE_DATA,
} from './actions';

import { LOGOUT_USER } from 'openstack-uicore-foundation/lib/security/actions';
const localNowUtc = Date.now();

const DEFAULT_STATE = {
    reservation: null,
    checkout: null,
    step: 0,
    widgetLoading: false,
    passwordless: {
        email: null,
        otp_length: 0,
        code_sent: false,
        error: false
    },
    ticketTypes: [],
    // added this flag to really know if we requested or not the ticket types collection
    // ( empty bc initial value or empty bc api empty response)
    requestedTicketTypes: false,
    taxTypes: [],
    invitation: null,
    settings: {
        apiBaseUrl: null,
        summitId: null,
        marketingData: null,
        userProfile: null,
    },
    nowUtc: localNowUtc,
};

const RegistrationLiteReducer = (state = DEFAULT_STATE, action) => {
    const { type, payload } = action;
    console.log(action);
    switch (type) {
        case CLEAR_WIDGET_STATE:
        case LOGOUT_USER: {
            return DEFAULT_STATE;
        }
        case REQUESTED_TICKET_TYPES:{
            return {...state, requestedTicketTypes: false}
        }
        case START_WIDGET_LOADING: {
            return { ...state, widgetLoading: true };
        }
        case STOP_WIDGET_LOADING: {
            return { ...state, widgetLoading: false };
        }
        case LOAD_INITIAL_VARS:
            const { marketingData, summitData, apiBaseUrl, profileData } = payload;

            Object.keys(marketingData).forEach(setting => {
                if (getComputedStyle(document.documentElement).getPropertyValue(`--${setting}`)) {
                    document.documentElement.style.setProperty(`--${setting}`, marketingData[setting]);
                    document.documentElement.style.setProperty(`--${setting}50`, `${marketingData[setting]}50`);
                }
            });

            return {
                ...state,
                reservation: null,
                checkout: null,
                ticketTypes: [],
                requestedTicketTypes: false,
                taxTypes: [],
                invitation: null,
                passwordless: { ...DEFAULT_STATE.passwordless },
                settings: {
                    ...DEFAULT_STATE.settings,
                    marketingData: marketingData,
                    summitId: summitData.id,
                    userProfile: profileData,
                    apiBaseUrl: apiBaseUrl,
                }
            };
        case LOAD_PROFILE_DATA:{
            return {
                ...state,
                settings: {
                    ...state.settings,
                    userProfile: payload,
                }
            };
        }
        case CHANGE_STEP: {
            return { ...state, step: payload }
        }
        case GET_TICKET_TYPES: {
            return { ...state, ticketTypes: payload.response.data, requestedTicketTypes: true };
        }
        case GET_TAX_TYPES: {
            return { ...state, taxTypes: payload.response.data }
        }
        case GO_TO_LOGIN: {
            return { ...state, passwordless: { ...state.passwordless, code_sent: false, error: false } }
        }
        case SET_PASSWORDLESS_LOGIN: {
            return { ...state, passwordless: { ...state.passwordless, email: payload, error: false } }
        }
        case SET_PASSWORDLESS_LENGTH: {
            const { otp_length } = payload;
            return { ...state, passwordless: { ...state.passwordless, otp_length, code_sent: true, error: false } }
        }
        case SET_PASSWORDLESS_ERROR: {
            return { ...state, passwordless: { ...state.passwordless, error: true } }
        }
        case CREATE_RESERVATION_SUCCESS: {
            const reservation = payload.response;
            return { ...state, reservation }
        }
        case DELETE_RESERVATION_SUCCESS:
            return { ...state, reservation: null }
        case CLEAR_RESERVATION: {
            return { ...state, reservation: null }
        }
        case PAY_RESERVATION: {
            return { ...state, checkout: payload.response, reservation: null, userProfile: null, invitation: null };
        }
        case GET_MY_INVITATION:{
            return {...state, invitation: payload.response};
        }
        case CLEAR_MY_INVITATION:{
            return {...state, invitation: null};
        }
        case UPDATE_CLOCK: {
            const { timestamp } = payload;
            return { ...state, nowUtc: timestamp };
        }
        default: {
            return state;
        }
    }
}

export default RegistrationLiteReducer;
