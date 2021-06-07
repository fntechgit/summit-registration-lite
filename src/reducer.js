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
    PAY_RESERVATION
} from './actions';

const DEFAULT_STATE = {
    reservation: null,
    checkout: null,
    step: 0,
    widgetLoading: false,
    settings: {
        apiBaseUrl: null,
        summitId: null,
        marketingData: null,
        getAccessToken: null,
    }
};

const WidgetReducer = (state = DEFAULT_STATE, action) => {
    const { type, payload } = action;
    switch (type) {
        case START_WIDGET_LOADING: {
            let widgetLoading = state.widgetLoading + 1;
            return { ...state, widgetLoading };
        }
        case STOP_WIDGET_LOADING: {
            let widgetLoading = state.widgetLoading < 2 ? 0 : (state.widgetLoading - 1);
            return { ...state, widgetLoading };
        }
        case LOAD_INITIAL_VARS:

            const { marketingData, summitData, apiBaseUrl, profileData } = payload;

            return {
                ...state,
                settings: {
                    ...state.settings,
                    marketingData: marketingData,
                    ticketTypes: summitData.ticket_types,
                    summitId: summitData.id,
                    userProfile: profileData,
                    apiBaseUrl: apiBaseUrl
                }
            };
        case CHANGE_STEP: {
            return { ...state, step: payload }
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
            const { settings: { ticketTypes }, reservation } = state;
            return {
                ...state, checkout: payload.response
            };
        }
        default: {
            return state;
        }
    }
}

export default WidgetReducer
