import {
    createAction,
    putRequest,
    authErrorHandler
} from 'openstack-uicore-foundation/lib/utils/actions';

import { CLEAR_RESERVATION, PAY_RESERVATION } from '../../actions';

import { changeStep, removeReservedTicket, startWidgetLoading, stopWidgetLoading } from '../../actions';

import Swal from 'sweetalert2';
import { isFreeOrder, isPrePaidOrder } from '../utils';
import { STEP_COMPLETE, STEP_PERSONAL_INFO } from '../constants';

export class StripeProvider {

    constructor({ reservation, summitId, userProfile, access_token, apiBaseUrl, dispatch }) {
        this.reservation = reservation;
        this.summitId = summitId;
        this.userProfile = userProfile;
        this.access_token = access_token;
        this.apiBaseUrl = apiBaseUrl;
        this.dispatch = dispatch;
    }

    payTicket = ({ token = null, stripe = null, zipCode = null }) => async (dispatch) => {

        const errorHandler = (err, res) => (dispatch, state) => {
            let code = err.status;
            switch (code) {
                case 404: {
                    let msg = res.body.message;
                    Swal.fire('Validation Error', msg, 'warning');
                }
                    break;
                case 500: {
                    let msg = res.body.message;
                    Swal.fire('Validation Error', msg, 'warning');
                }
                    break;
                default:
                    authErrorHandler(err, res)(dispatch, state);
                    break;
            }
        };

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
                'tickets.ticket_type.taxes'
        };

        let normalizedEntity = {
            billing_address_1: this.userProfile?.address1 || '',
            billing_address_2: this.userProfile?.address2 || '',
            billing_address_zip_code: zipCode,
            billing_address_city: this.userProfile?.locality || '',
            billing_address_state: this.userProfile?.region || '',
            billing_address_country: this.userProfile?.country || ''
        };

        dispatch(startWidgetLoading());
        if (isFreeOrder(this.reservation) || isPrePaidOrder(this.reservation)) {

            return putRequest(
                null,
                createAction(PAY_RESERVATION),
                `${this.apiBaseUrl}/api/v1/summits/${this.summitId}/orders/${this.reservation.hash}/checkout`,
                normalizedEntity,
                errorHandler
                // entity
            )(params)(this.dispatch)
                .then((payload) => {
                    this.dispatch(stopWidgetLoading());
                    this.dispatch(createAction(CLEAR_RESERVATION)({}));
                    this.dispatch(changeStep(STEP_COMPLETE));
                    return (payload);
                })
                .catch(e => {
                    this.dispatch(removeReservedTicket());
                    this.dispatch(changeStep(STEP_PERSONAL_INFO));
                    this.dispatch(stopWidgetLoading());
                    return (e);
                });
            // The payment has succeeded. Display a success message.

        }
        // regular flow
        const { id } = token;
        stripe.confirmCardPayment(
            this.reservation.payment_gateway_client_token, { payment_method: { card: { token: id } } }
        ).then((result) => {
            if (result.error) {
                // Reserve error.message in your UI.
                Swal.fire(result.error.message, 'Please retry purchase.', 'warning');
                this.dispatch(changeStep(STEP_PERSONAL_INFO));
                this.dispatch(removeReservedTicket());
                this.dispatch(stopWidgetLoading());
            } else {
                return putRequest(
                    null,
                    createAction(PAY_RESERVATION),
                    `${this.apiBaseUrl}/api/v1/summits/${this.summitId}/orders/${this.reservation.hash}/checkout`,
                    normalizedEntity,
                    errorHandler
                    // entity
                )(params)(this.dispatch)
                    .then((payload) => {
                        this.dispatch(stopWidgetLoading());
                        this.dispatch(createAction(CLEAR_RESERVATION)({}));
                        this.dispatch(changeStep(STEP_COMPLETE));
                        return (payload);
                    })
                    .catch(e => {
                        this.dispatch(stopWidgetLoading());
                        return (e);
                    });
                // The payment has succeeded. Display a success message.
            }
        })
            .catch(e => {
                this.dispatch(removeReservedTicket());
                this.dispatch(changeStep(STEP_PERSONAL_INFO));
                this.dispatch(stopWidgetLoading());
                return (e);
            });

    };
}
