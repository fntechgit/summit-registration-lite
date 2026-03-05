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
    SET_PASSWORDLESS_SETTINGS,
    SET_PASSWORDLESS_ERROR,
    GO_TO_LOGIN,
    GET_MY_INVITATION,
    CLEAR_MY_INVITATION,
    CLEAR_WIDGET_STATE,
    REQUESTED_TICKET_TYPES,
    UPDATE_CLOCK,
    LOAD_PROFILE_DATA,
    SET_CURRENT_PROMO_CODE,
    CLEAR_CURRENT_PROMO_CODE,
    VALIDATE_PROMO_CODE,
    VALIDATE_PROMO_CODE_ERROR,
} from './actions';

import { LOGOUT_USER } from 'openstack-uicore-foundation/lib/security/actions';
import moment from 'moment';
import { STEP_SELECT_TICKET_TYPE } from './utils/constants';

const localNowUtc = moment().unix();


const DEFAULT_STATE = {
    reservation: null,
    checkout: null,
    step: STEP_SELECT_TICKET_TYPE,
    widgetLoading: false,
    passwordless: {
        email: null,
        otp_length: 0,
        otp_lifetime: 0,
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
        userProfile: null,
    },
    nowUtc: localNowUtc,
    promoCode: '',
    promoCodeAllowsReassign: true
};

const RegistrationLiteReducer = (state = DEFAULT_STATE, action) => {
    const { type, payload } = action;
    switch (type) {
        case CLEAR_WIDGET_STATE:
        case LOGOUT_USER: {
            return DEFAULT_STATE;
        }
        case REQUESTED_TICKET_TYPES: {
            return { ...state, requestedTicketTypes: false }
        }
        case START_WIDGET_LOADING: {
            return { ...state, widgetLoading: true };
        }
        case STOP_WIDGET_LOADING: {
            return { ...state, widgetLoading: false };
        }
        case LOAD_INITIAL_VARS:
            const { summitData, apiBaseUrl, profileData } = payload;

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
                    summitId: summitData.id,
                    userProfile: profileData,
                    apiBaseUrl: apiBaseUrl,
                }
            };
        case LOAD_PROFILE_DATA: {
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
            return { ...state, passwordless: { ...state.passwordless, email: payload, error: false, otp_lifetime: 0 } }
        }
        case SET_PASSWORDLESS_SETTINGS: {
            const { otp_length, otp_lifetime } = payload;
            return { ...state, passwordless: { ...state.passwordless, otp_length, otp_lifetime, code_sent: true, error: false } }
        }
        case SET_PASSWORDLESS_ERROR: {
            return { ...state, passwordless: { ...state.passwordless, error: true } }
        }
        case CREATE_RESERVATION_SUCCESS: {
            const reservation = payload.response;
            return { ...state, reservation }
        }
        case DELETE_RESERVATION_SUCCESS: {
            return { ...state, reservation: null }
        }
        case CLEAR_RESERVATION: {
            return { ...state, reservation: null, promoCode: '', promoCodeAllowsReassign: true }
        }
        case PAY_RESERVATION: {
            return { ...state, checkout: payload.response, reservation: null, userProfile: null, invitation: null, promoCode: '', promoCodeAllowsReassign: true };
        }
        case GET_MY_INVITATION: {
            return { ...state, invitation: payload.response };
        }
        case CLEAR_MY_INVITATION: {
            return { ...state, invitation: null };
        }
        case UPDATE_CLOCK: {
            const { timestamp } = payload;
            return { ...state, nowUtc: timestamp };
        }
        case CLEAR_CURRENT_PROMO_CODE: {
            return { ...state, promoCode: '', promoCodeAllowsReassign: true }
        }
        case SET_CURRENT_PROMO_CODE:{
            const { currentPromoCode } = payload;
            return { ...state, promoCode: currentPromoCode }
        }
        case VALIDATE_PROMO_CODE: {
            const { allows_to_reassign } = payload.response;
            return { ...state, promoCodeAllowsReassign: allows_to_reassign ?? true }
        }
        case VALIDATE_PROMO_CODE_ERROR: {
            return { ...state, promoCodeAllowsReassign: true }
        }
        default: {
            return state;
        }
    }
}

export default RegistrationLiteReducer;
