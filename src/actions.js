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
    createAction,
    postRequest,
    putRequest,
    deleteRequest
} from "openstack-uicore-foundation/lib/methods";

import { authErrorHandler } from "openstack-uicore-foundation/lib/methods";

import Swal from 'sweetalert2';

export const START_WIDGET_LOADING = 'START_WIDGET_LOADING';
export const STOP_WIDGET_LOADING = 'STOP_WIDGET_LOADING';
export const LOAD_INITIAL_VARS = 'LOAD_INITIAL_VARS';
export const RECEIVE_MARKETING_SETTINGS = 'RECEIVE_MARKETING_SETTINGS';
export const CHANGE_STEP = 'CHANGE_STEP';
export const CREATE_RESERVATION = 'CREATE_RESERVATION';
export const CREATE_RESERVATION_SUCCESS = 'CREATE_RESERVATION_SUCCESS';
export const CREATE_RESERVATION_ERROR = 'CREATE_RESERVATION_ERROR';
export const DELETE_RESERVATION = 'DELETE_RESERVATION';
export const DELETE_RESERVATION_SUCCESS = 'DELETE_RESERVATION_SUCCESS';
export const DELETE_RESERVATION_ERROR = 'DELETE_RESERVATION_ERROR';
export const PAY_RESERVATION = 'PAY_RESERVATION';
export const CLEAR_RESERVATION = 'CLEAR_RESERVATION';


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

export const reserveTicket = (personalInformation, ticket, getAccessToken) => async (dispatch, getState) => {

    const { widgetState: { settings: { summitId, apiBaseUrl } } } = getState();

    let { firstName, lastName, email, company, promoCode } = personalInformation;

    dispatch(startWidgetLoading());

    const access_token = await getAccessToken();

    let params = {        
        access_token,
        expand: 'tickets,tickets.owner',
    };

    let normalizedEntity = {
        owner_email: email,
        owner_first_name: firstName,
        owner_last_name: lastName,
        owner_company: company,
        tickets: [
            {
                type_id: ticket.id,
                promo_code: promoCode || null,
                attendee_first_name: firstName,
                attendee_last_name: lastName,
                attendee_email: email
            }
        ]
    };

    return postRequest(
        createAction(CREATE_RESERVATION),
        createAction(CREATE_RESERVATION_SUCCESS),
        `${apiBaseUrl}/api/v1/summits/${summitId}/orders/reserve`,
        normalizedEntity,
        authErrorHandler,
        // entity
    )(params)(dispatch)
        .then((payload) => {
            dispatch(stopWidgetLoading());
            dispatch(changeStep(2));
            return (payload)
        })
        .catch(e => {
            dispatch(createAction(CREATE_RESERVATION_ERROR)(e));
            dispatch(stopWidgetLoading());
            return (e);
        })
}

export const removeReservedTicket = (getAccessToken) => async (dispatch, getState) => {
    let { widgetState: { settings: { summitId, apiBaseUrl }, reservation: { hash } } } = getState();

    const access_token = await getAccessToken();

    let params = {        
        access_token,
        expand: 'tickets,tickets.owner',
    };

    dispatch(startWidgetLoading());

    return deleteRequest(
        createAction(DELETE_RESERVATION),
        createAction(DELETE_RESERVATION_SUCCESS),
        `${apiBaseUrl}/api/v1/summits/${summitId}/orders/${hash}`,
        {},
        authErrorHandler,
        // entity
    )(params)(dispatch)
        .then((payload) => {
            dispatch(stopWidgetLoading());
            dispatch(changeStep(1));
            return (payload)
        })
        .catch(e => {
            dispatch(createAction(DELETE_RESERVATION_ERROR)(e));
            dispatch(changeStep(1));
            dispatch(stopWidgetLoading());
            return (e);
        })
}

export const payTicket = (token = null, stripe = null, getAccessToken) => async (dispatch, getState) => {

    let { widgetState: { settings: { summitId, apiBaseUrl, userProfile }, reservation } } = getState();

    const { id } = token;

    const access_token = await getAccessToken();

    let params = {        
        access_token,
    }

    let normalizedEntity = {
        billing_address_1: userProfile.address1 || '',
        billing_address_2: userProfile.address2 || '',
        billing_address_zip_code: userProfile.postal_code || '',
        billing_address_city: userProfile.locality || '',
        billing_address_state: userProfile.region || '',
        billing_address_country: userProfile.country || '',
    };

    dispatch(startWidgetLoading());

    if (reservation.payment_gateway_client_token) {
        stripe.confirmCardPayment(
            reservation.payment_gateway_client_token, { payment_method: { card: { token: id } } }
        ).then((result) => {
            if (result.error) {
                // Reserve error.message in your UI.        
                Swal.fire(result.error.message, "Please retry purchase.", "warning");
                dispatch(changeStep(1));
                dispatch(removeReservedTicket());
                dispatch(stopWidgetLoading());
            } else {
                return putRequest(
                    null,
                    createAction(PAY_RESERVATION),
                    `${apiBaseUrl}/api/v1/summits/${summitId}/orders/${reservation.hash}/checkout`,
                    normalizedEntity,
                    authErrorHandler,
                    // entity
                )(params)(dispatch)
                    .then((payload) => {
                        dispatch(stopWidgetLoading());
                        dispatch(createAction(CLEAR_RESERVATION)({}));
                        dispatch(changeStep(3));
                        return (payload);
                    })
                    .catch(e => {
                        dispatch(stopWidgetLoading());
                        return (e);
                    });
                // The payment has succeeded. Display a success message.
            }
        })
            .catch(e => {                
                dispatch(removeReservedTicket());
                dispatch(changeStep(1));
                dispatch(stopWidgetLoading());
                return (e);
            });
    } else {
        // FREE TICKET
        return putRequest(
            null,
            createAction(PAY_RESERVATION),
            `${apiBaseUrl}/api/v1/summits/${summitId}/orders/${reservation.hash}/checkout`,
            normalizedEntity,
            authErrorHandler,
            // entity
        )(params)(dispatch)
            .then((payload) => {
                dispatch(stopWidgetLoading());
                dispatch(createAction(CLEAR_RESERVATION)({}));
                dispatch(changeStep(3));
                return (payload);
            })
            .catch(e => {
                dispatch(removeReservedTicket());
                dispatch(changeStep(1));
                dispatch(stopWidgetLoading());
                return (e);
            });
        // The payment has succeeded. Display a success message.
    }
}

export const changeStep = (step) => (dispatch, getState) => {
    dispatch(startWidgetLoading());
    dispatch(createAction(CHANGE_STEP)(step));
    dispatch(stopWidgetLoading());
}