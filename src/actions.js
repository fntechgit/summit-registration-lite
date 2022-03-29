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
    getRequest,
    postRequest,
    putRequest,
    deleteRequest
} from "openstack-uicore-foundation/lib/utils/actions";

import { authErrorHandler } from "openstack-uicore-foundation/lib/utils/methods";

import Swal from 'sweetalert2';

export const START_WIDGET_LOADING = 'START_WIDGET_LOADING';
export const STOP_WIDGET_LOADING = 'STOP_WIDGET_LOADING';
export const LOAD_INITIAL_VARS = 'LOAD_INITIAL_VARS';
export const CHANGE_STEP = 'CHANGE_STEP';
export const GET_TICKET_TYPES = 'GET_TICKET_TYPES';
export const GET_TAX_TYPES = 'GET_TAX_TYPES';
export const CREATE_RESERVATION = 'CREATE_RESERVATION';
export const CREATE_RESERVATION_SUCCESS = 'CREATE_RESERVATION_SUCCESS';
export const CREATE_RESERVATION_ERROR = 'CREATE_RESERVATION_ERROR';
export const DELETE_RESERVATION = 'DELETE_RESERVATION';
export const DELETE_RESERVATION_SUCCESS = 'DELETE_RESERVATION_SUCCESS';
export const DELETE_RESERVATION_ERROR = 'DELETE_RESERVATION_ERROR';
export const PAY_RESERVATION = 'PAY_RESERVATION';
export const CLEAR_RESERVATION = 'CLEAR_RESERVATION';
export const SET_PASSWORDLESS_LOGIN = 'SET_PASSWORDLESS_LOGIN';
export const SET_PASSWORDLESS_LENGTH = 'SET_PASSWORDLESS_LENGTH';
export const SET_PASSWORDLESS_ERROR = 'SET_PASSWORDLESS_ERROR';
export const GO_TO_LOGIN = 'GO_TO_LOGIN';

const startWidgetLoading = createAction(START_WIDGET_LOADING);
const stopWidgetLoading = createAction(STOP_WIDGET_LOADING);

export const loadSession = (settings) => (dispatch) => {
    dispatch(createAction(LOAD_INITIAL_VARS)(settings));
};

/*********************************************************************************/
/*                               TICKETS                                         */
/*********************************************************************************/

// api/v1/summits/{id}/ticket-types  

// api/v1/summits/{id}/tax-types   

export const getTicketTypes =  (summitId) => async (dispatch, getState, { apiBaseUrl, getAccessToken }) => {

    try {
        const accessToken = await getAccessToken();

        let params = {
            expand: 'badge_type,badge_type.access_levels,badge_type.badge_features',
            access_token: accessToken
        };

        dispatch(startWidgetLoading());
        return getRequest(
            null,
            createAction(GET_TICKET_TYPES),
            `${apiBaseUrl}/api/v1/summits/${summitId}/ticket-types`,
            authErrorHandler
        )(params)(dispatch).then(() => {
            dispatch(stopWidgetLoading());
        })
    }
    catch (e){
        return Promise.reject();
    }
}

export const getTaxesTypes = (summitId) =>  async (dispatch, getState, { apiBaseUrl, getAccessToken }) => {

    try {
        const accessToken = await getAccessToken();
        let params = {
            access_token: accessToken
        };

        dispatch(startWidgetLoading());

        return getRequest(
            null,
            createAction(GET_TAX_TYPES),
            `${apiBaseUrl}/api/v1/summits/${summitId}/tax-types`,
            authErrorHandler
        )(params)(dispatch).then(() => {
            dispatch(stopWidgetLoading());
        })
    }
    catch (e){
        return Promise.reject();
    }
}

export const reserveTicket = (personalInformation, ticket) => async (dispatch, getState, { apiBaseUrl, getAccessToken }) => {

    const { registrationLiteState: { settings: { summitId} } } = getState();

    let { firstName, lastName, email, company, promoCode } = personalInformation;

    dispatch(startWidgetLoading());

    const access_token = await getAccessToken();

    let params = {
        access_token,
        expand: 'tickets,tickets.owner,tickets.ticket_type,tickets.ticket_type.taxes',
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
            payload.response.promo_code = promoCode || null;
            if (!payload.response.payment_gateway_client_token) {
                dispatch(payTicket(null, null, getAccessToken));
                return (payload)
            } else {
                dispatch(changeStep(2));
                return (payload)
            }
        })
        .catch(e => {
            dispatch(createAction(CREATE_RESERVATION_ERROR)(e));
            dispatch(stopWidgetLoading());
            return (e);
        })
}

export const removeReservedTicket = () => async (dispatch, getState, { apiBaseUrl, getAccessToken }) => {
    let { registrationLiteState: { settings: { summitId }, reservation: { hash } } } = getState();

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

export const payTicket = (token = null, stripe = null, zipCode = null) => async (dispatch, getState, { apiBaseUrl, getAccessToken }) => {

    let { registrationLiteState: { settings: { summitId, userProfile }, reservation } } = getState();

    const access_token = await getAccessToken();

    let params = {
        access_token,
        expand: 'tickets,' +
            'tickets.owner,' +
            'tickets.owner.extra_questions,' +
            'tickets.badge,' +
            'tickets.badge.type,' +
            'tickets.badge.type.access_levels,' +
            'tickets.badge.type.features,' +
            'tickets.ticket_type,' +
            'tickets.ticket_type.taxes',
    }

    let normalizedEntity = {
        billing_address_1: userProfile?.address1 || '',
        billing_address_2: userProfile?.address2 || '',
        billing_address_zip_code: zipCode,
        billing_address_city: userProfile?.locality || '',
        billing_address_state: userProfile?.region || '',
        billing_address_country: userProfile?.country || '',
    };

    dispatch(startWidgetLoading());

    if (reservation.payment_gateway_client_token) {
        const { id } = token;
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

export const goToLogin = () => (dispatch, getState) => {
    dispatch(createAction(GO_TO_LOGIN)());
}

export const getLoginCode = (email, getPasswordlessCode) => async (dispatch, getState) => {
    dispatch(createAction(SET_PASSWORDLESS_LOGIN)(email));

    return new Promise((resolve, reject) => {
        getPasswordlessCode(email).then((res) => {            
            dispatch(createAction(SET_PASSWORDLESS_LENGTH)(res.response))
            resolve(res);
        }, (err) => {
            reject(err);
        });
    });

};

export const passwordlessLogin = (code, loginWithCode) => async (dispatch, getState) => {

    const { registrationLiteState: { passwordless: { email } } } = getState();

    return new Promise((resolve, reject) => {
        loginWithCode(code, email).then((res) => {
            if(res) {
                dispatch(createAction(SET_PASSWORDLESS_ERROR)())
            }
            resolve(res);
        }, (err) => {
            reject(err);
        });
    });
}

export const isInPersonTicketType = (ticketType) => {
    /** check is the current order has or not IN_PERSON tickets types **/
    if(ticketType.hasOwnProperty("badge_type")){
        let badgeType = ticketType.badge_type;
        return badgeType.access_levels.some((al) => { return al.name == 'IN_PERSON'});
    }
    return false;
}
