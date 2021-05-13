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

import { LOGOUT_USER } from 'openstack-uicore-foundation/lib/actions';


import {
    START_WIDGET_LOADING,
    STOP_WIDGET_LOADING,
    LOAD_INITIAL_VARS    
} from './actions';

const DEFAULT_STATE = {
    settings: {
        title: null,
        filterCallback: null,
        marketingData: null,
    },    
    widgetLoading: false,
};

const WidgetReducer = (state = DEFAULT_STATE, action) => {
    const { type, payload } = action;
    switch (type) {
        case LOGOUT_USER: {
            return DEFAULT_STATE;
        }
        case START_WIDGET_LOADING: {
            let widgetLoading = state.widgetLoading + 1;
            return { ...state, widgetLoading };
        }
        case STOP_WIDGET_LOADING: {
            let widgetLoading = state.widgetLoading < 2 ? 0 : (state.widgetLoading - 1);
            return { ...state, widgetLoading };
        }
        case LOAD_INITIAL_VARS:

            const { filtersData, filteredData } = payload;

            const newSettings = {
                title: payload.title,
                onRef: payload.onRef,
                filterCallback: payload.filterCallback,
                marketingData: payload.marketingData
            };

            return {
                ...state,
                filters: filtersData,
                filtered: filteredData,
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
