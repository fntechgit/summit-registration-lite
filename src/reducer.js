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
    LOAD_INITIAL_VARS
} from './actions';

const DEFAULT_STATE = {
    summit: null,
    ticketTypes: null,
    profile: null,
    reservedTicket: null,
    settings: {
        marketingData: null,
        getAccessToken: null,
        closeWidget: null,
        onRef: null,
    },
    widgetLoading: false,
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

            const { summitData, profileData } = payload;

            const newSettings = {
                onRef: payload.onRef,
                getAccessToken: payload.getAccessToken,
                closeWidget: payload.closeWidget,
                marketingData: payload.marketingData
            };

            return {
                ...state,
                summit: summitData,
                ticketTypes: summitData.ticket_types,
                profile: profileData,
                settings: {
                    ...state.settings,
                    ...newSettings
                }
            };
        default: {
            return state;
        }
    }
}

export default WidgetReducer
