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
    createAction
} from "openstack-uicore-foundation/lib/methods";

export const START_WIDGET_LOADING = 'START_WIDGET_LOADING';
export const STOP_WIDGET_LOADING = 'STOP_WIDGET_LOADING';
export const LOAD_INITIAL_VARS = 'LOAD_INITIAL_VARS';
export const RECEIVE_MARKETING_SETTINGS = 'RECEIVE_MARKETING_SETTINGS';
export const CHANGE_STEP = 'CHANGE_STEP';


const startWidgetLoading = () => (dispatch) => {
    dispatch(createAction(START_WIDGET_LOADING)({}));
};

const stopWidgetLoading = () => (dispatch) => {
    dispatch(createAction(STOP_WIDGET_LOADING)({}));
};

export const loadSession = (settings) => (dispatch) => {
    dispatch(createAction(LOAD_INITIAL_VARS)(settings));
    return Promise.resolve();
};

export const setMarketingSettings = () => (dispatch, getState) => {

    dispatch(startWidgetLoading());

    let { widgetState: { settings } } = getState();
    let { marketingData } = settings;

    dispatch(createAction(RECEIVE_MARKETING_SETTINGS)({}));

    Object.keys(marketingData).forEach(setting => {
        if (getComputedStyle(document.documentElement).getPropertyValue(`--${setting}`)) {
            document.documentElement.style.setProperty(`--${setting}`, marketingData[setting]);
            document.documentElement.style.setProperty(`--${setting}50`, `${marketingData[setting]}50`);
        }
    });

    dispatch(stopWidgetLoading());
};


/*********************************************************************************/
/*                               TICKETS                                         */
/*********************************************************************************/

export const changeStep = (step) => (dispatch, getState) => {
    dispatch(startWidgetLoading());
    dispatch(createAction(CHANGE_STEP)(step));
    dispatch(stopWidgetLoading());
}