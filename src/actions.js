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
import { authErrorHandler } from "openstack-uicore-foundation/lib/utils/actions";
import Swal from 'sweetalert2';
import { LawPayProvider } from "./utils/payment-providers/lawpay-provider";
import { StripeProvider } from "./utils/payment-providers/stripe-provider";
import { PaymentStrategy } from "./utils/payment-strategy";
import {PaymentProviderFactory} from "./utils/payment-providers/payment-provider-factory";

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

export const startWidgetLoading = createAction(START_WIDGET_LOADING);
export const stopWidgetLoading = createAction(STOP_WIDGET_LOADING);

export const loadSession = (settings) => (dispatch) => {
    dispatch(createAction(LOAD_INITIAL_VARS)(settings));
};

/*********************************************************************************/
/*                               TICKETS                                         */
/*********************************************************************************/

// api/v1/summits/{id}/ticket-types

// api/v1/summits/{id}/tax-types

export const getTicketTypes = (summitId) => async (dispatch, getState, { apiBaseUrl, getAccessToken }) => {

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
    catch (e) {
        return Promise.reject();
    }
}

export const getTaxesTypes = (summitId) => async (dispatch, getState, { apiBaseUrl, getAccessToken }) => {

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
    catch (e) {
        return Promise.reject();
    }
}

export const reserveTicket = ({ personalInformation, ticket, ticketQuantity }, { onError }) =>
    async (dispatch, getState, { apiBaseUrl, getAccessToken }) => {
        const { registrationLiteState: { settings: { summitId } } } = getState();
        let { firstName, lastName, email, company, promoCode } = personalInformation;

        dispatch(startWidgetLoading());

        const access_token = await getAccessToken();

        const tickets = [...Array(ticketQuantity)].map(() => ({
            type_id: ticket.id,
            promo_code: promoCode || null
        }));

        // Only set the attendee for the first ticket.
        tickets[0].attendee_first_name = firstName;
        tickets[0].attendee_last_name = lastName;
        tickets[0].attendee_email = email;

        let params = {
            access_token,
            expand: 'tickets,tickets.owner,tickets.ticket_type,tickets.ticket_type.taxes',
        };

        const normalizedEntity = normalizeReservation({
            owner_email: email,
            owner_first_name: firstName,
            owner_last_name: lastName,
            owner_company: company,
            tickets
        });

        const errorHandler = (err, res) => (dispatch, state) => {
            if (res && res.statusCode === 412 && onError) return onError(err, res);

            return authErrorHandler(err, res);
        };

        return postRequest(
            createAction(CREATE_RESERVATION),
            createAction(CREATE_RESERVATION_SUCCESS),
            `${apiBaseUrl}/api/v1/summits/${summitId}/orders/reserve`,
            normalizedEntity,
            errorHandler,
            // entity
        )(params)(dispatch)
            .then((payload) => {
                dispatch(stopWidgetLoading());
                payload.response.promo_code = promoCode || null;
                if (!payload.response.amount) {
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

export const payTicketWithProvider = (provider, params = {}) => async (dispatch, getState, { apiBaseUrl, getAccessToken }) => {

    let { registrationLiteState: { settings: { summitId, userProfile }, reservation } } = getState();

    const access_token = await getAccessToken();

    dispatch(startWidgetLoading());

    const currentProvider = PaymentProviderFactory.build(provider, { summitId, userProfile, access_token, apiBaseUrl, dispatch});

    return dispatch(currentProvider.payTicket({...params}));
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
            if (res) {
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
    if (ticketType.hasOwnProperty("badge_type")) {
        let badgeType = ticketType.badge_type;
        return badgeType.access_levels.some((al) => { return al.name == 'IN_PERSON' });
    }
    return false;
}

const normalizeReservation = (entity) => {
    const normalizedEntity = { ...entity };

    if (!entity.owner_company.id) {
        normalizedEntity['owner_company'] = entity.owner_company.name;
    } else {
        delete (normalizedEntity['owner_company']);
        normalizedEntity['owner_company_id'] = entity.owner_company.id;
    }

    return normalizedEntity;

}
