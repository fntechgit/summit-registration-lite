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
 *
 * RegistrationModal - Modal wrapper for RegistrationForm
 *
 * This component wraps RegistrationForm in a modal overlay.
 * For standalone/dedicated page usage without modal, use RegistrationForm directly.
 *
 * Also exported as RegistrationLite for backward compatibility.
 **/

import React from 'react';
import PropTypes from 'prop-types';
import RegistrationForm from './registration-form';
import styles from "../styles/general.module.scss";

const RegistrationModal = ({ summitData, closeWidget, ...props }) => {
    return (
        <div id={`${styles.modal}`} className="modal is-active">
            <div className="modal-background"></div>
            <div className={`${styles.modalContent} modal-content`}>
                <div className={`${styles.outerWrapper} summit-registration-lite`}>
                    <div className={styles.innerWrapper}>
                        <div className={styles.title}>
                            {props.profileData && <span>{summitData?.name}</span>}
                            {closeWidget && (
                                <i className="fa fa-close" aria-label="close" onClick={closeWidget}></i>
                            )}
                        </div>
                        <RegistrationForm {...props} summitData={summitData} closeWidget={closeWidget} />
                    </div>
                </div>
            </div>
        </div>
    );
}

RegistrationModal.defaultProps = {
    loginInitialEmailInputValue: '',
    showMultipleTicketTexts: true,
    showCompanyInput: true,
    noAllowedTicketsMessage: '<span>You already have purchased all available tickets for this event and/or there are no tickets available for you to purchase.</span><br/><span><a href="/a/my-tickets">Visit the my orders / my tickets page</a> to review your existing tickets.</span>',
    ticketTaxesErrorMessage: '<span>There was an error getting the information for the tickets. Please try it again.</span>',
    allowPromoCodes: true,
    companyDDLPlaceholder: 'Company',
    authErrorCallback: (error) => { console.log(error) },
    onError: (error) => { console.log("payment error : ", error) },
    hasVirtualAccessLevel: false,
    supportEmail: 'support@fntech.com',
    showCompanyInputDefaultOptions: false,
    companyDDLOptions2Show: 25,
    idpLogoLight: null,
    idpLogoDark: null,
    hidePostalCode: false,
    successfullPaymentReturnUrl: '',
};

RegistrationModal.propTypes = {
    apiBaseUrl: PropTypes.string.isRequired,
    clientId: PropTypes.string.isRequired,
    getAccessToken: PropTypes.func.isRequired,
    loginInitialEmailInputValue: PropTypes.string,
    showMultipleTicketTexts: PropTypes.bool,
    showCompanyInput: PropTypes.bool,
    authErrorCallback: PropTypes.func,
    onError: PropTypes.func,
    successfulPaymentReturnUrl: PropTypes.string,
    goToMyOrders: PropTypes.func.isRequired,
    goToExtraQuestions: PropTypes.func.isRequired,
    completedExtraQuestions: PropTypes.func.isRequired,
    closeWidget: PropTypes.func,
    hasVirtualAccessLevel: PropTypes.bool,
    hidePostalCode: PropTypes.bool,
    supportEmail: PropTypes.string,
    initialOrderComplete1stParagraph: PropTypes.string,
    initialOrderComplete2ndParagraph: PropTypes.string,
    initialOrderCompleteButton: PropTypes.string,
    orderCompleteTitle: PropTypes.string,
    orderComplete1stParagraph: PropTypes.string,
    orderComplete2ndParagraph: PropTypes.string,
    orderCompleteButton: PropTypes.string,
    showCompanyInputDefaultOptions: PropTypes.bool,
    companyDDLOptions2Show: PropTypes.number,
};

// Backward compatibility alias
const RegistrationLite = RegistrationModal;

export default RegistrationModal;
export { RegistrationModal, RegistrationLite };
