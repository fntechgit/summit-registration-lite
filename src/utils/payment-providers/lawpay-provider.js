import {
    createAction,
    putRequest,
    authErrorHandler
} from "openstack-uicore-foundation/lib/utils/actions";

import { CLEAR_RESERVATION, PAY_RESERVATION } from "../../actions";

import { changeStep, removeReservedTicket, startWidgetLoading, stopWidgetLoading } from '../../actions'

export class LawPayProvider {

    constructor({ reservation, summitId, userProfile, access_token, apiBaseUrl, dispatch }) {
        this.reservation = reservation;
        this.summitId = summitId;
        this.userProfile = userProfile;
        this.access_token = access_token;
        this.apiBaseUrl = apiBaseUrl;
        this.dispatch = dispatch;
    }

    payTicket = ({ token }) => async (dispatch) => {
        // Pay using affinity lawpay

        let params = {
            access_token: this.access_token,
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
            billing_address_1: token.address1 || '',
            billing_address_2: this.userProfile?.address2 || '',
            billing_address_zip_code: token.postal_code,
            billing_address_city: this.userProfile?.locality || '',
            billing_address_state: this.userProfile?.region || '',
            billing_address_country: this.userProfile?.country || '',
            payment_method_id: token.id,
        };

        this.dispatch(startWidgetLoading());

        if (this.reservation.amount > 0) {
            return putRequest(
                null,
                createAction(PAY_RESERVATION),
                `${this.apiBaseUrl}/api/v1/summits/${this.summitId}/orders/${this.reservation.hash}/checkout`,
                normalizedEntity,
                authErrorHandler,
                // entity
            )(params)(this.dispatch)
                .then((payload) => {
                    this.dispatch(stopWidgetLoading());
                    this.dispatch(createAction(CLEAR_RESERVATION)({}));
                    this.dispatch(changeStep(3));
                    return (payload);
                })
                .catch(e => {
                    this.dispatch(removeReservedTicket());
                    this.dispatch(changeStep(1));
                    this.dispatch(stopWidgetLoading());
                    return (e);
                });
            // The payment has succeeded. Display a success message.            
        } else {
            // FREE TICKET
            return putRequest(
                null,
                createAction(PAY_RESERVATION),
                `${this.apiBaseUrl}/api/v1/summits/${this.summitId}/orders/${this.reservation.hash}/checkout`,
                normalizedEntity,
                authErrorHandler,
                // entity
            )(params)(this.dispatch)
                .then((payload) => {
                    this.dispatch(stopWidgetLoading());
                    this.dispatch(createAction(CLEAR_RESERVATION)({}));
                    this.dispatch(changeStep(3));
                    return (payload);
                })
                .catch(e => {
                    this.dispatch(removeReservedTicket());
                    this.dispatch(changeStep(1));
                    this.dispatch(stopWidgetLoading());
                    return (e);
                });
            // The payment has succeeded. Display a success message.
        }
    }
}