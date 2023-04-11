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

import React, { useEffect, useState } from 'react';
import { connect } from "react-redux";
import PropTypes from 'prop-types';
import { animated, config, useSpring } from "react-spring";
import { useMeasure } from "react-use";
import {
    AUTH_ERROR_MISSING_AUTH_INFO,
    AUTH_ERROR_MISSING_REFRESH_TOKEN ,
    AUTH_ERROR_REFRESH_TOKEN_REQUEST_ERROR
} from 'openstack-uicore-foundation/lib/security/constants';

import {
    changeStep,
    getLoginCode,
    getMyInvitation,
    getTicketTypesAndTaxes,
    goToLogin,
    loadSession,
    passwordlessLogin,
    payTicketWithProvider,
    removeReservedTicket,
    reserveTicket,
    clearWidgetState,
    updateClock,
    loadProfileData,
} from '../actions';

import AjaxLoader from "openstack-uicore-foundation/lib/components/ajaxloader";
import Clock  from "openstack-uicore-foundation/lib/components/clock";

import styles from "../styles/general.module.scss";
import '../styles/styles.scss';

import LoginComponent from './login';
import PaymentComponent from './payment';
import PersonalInfoComponent from './personal-information';
import TicketTypeComponent from './ticket-type';
import ButtonBarComponent from './button-bar';
import PurchaseComplete from './purchase-complete';
import PasswordlessLoginComponent from './login-passwordless';
import TicketOwnedComponent from './ticket-owned';
import { getCurrentProvider } from "../utils/utils";
import NoAllowedTickets from './no-allowed-tickets';
import TicketTaxesError from './ticket-taxes-error';
import T from 'i18n-react';
import { getCurrentUserLanguage } from '../utils/utils';

let language = getCurrentUserLanguage();

// language would be something like es-ES or es_ES
// However we store our files with format es.json or en.json
// therefore retrieve only the first 2 digits

if (language.length > 2) {
    language = language.split("-")[0];
    language = language.split("_")[0];
}

try {
    T.setTexts(require(`../i18n/${language}.json`));
} catch (e) {
    T.setTexts(require(`../i18n/en.json`));
}


const RegistrationLite = (
    {
        loadSession,
        setMarketingSettings,
        changeStep,
        removeReservedTicket,
        reserveTicket,
        payTicketWithProvider,
        onPurchaseComplete,
        getTicketTypesAndTaxes,
        getLoginCode,
        passwordlessLogin,
        goToLogin,
        loginOptions,
        allowsNativeAuth,
        allowsOtpAuth,
        reservation,
        checkout,
        ticketTypes,
        taxTypes,
        step,
        passwordlessCodeSent,
        passwordlessEmail,
        passwordlessCode,
        getPasswordlessCode,
        passwordlessCodeError,
        loginWithCode,
        goToExtraQuestions,
        goToMyOrders,
        goToEvent,
        profileData,
        summitData,
        supportEmail,
        ticketOwned,
        ownedTickets,
        widgetLoading,
        loading,
        inPersonDisclaimer,
        userProfile,
        handleCompanyError,
        stripeOptions,
        invitation,
        loginInitialEmailInputValue,
        getMyInvitation,
        showMultipleTicketTexts,
        noAllowedTicketsMessage,
        ticketTaxesErrorMessage,
        authErrorCallback,
        clearWidgetState,
        requestedTicketTypes,
        allowPromoCodes,
        showCompanyInput,
        companyInputPlaceholder,
        companyDDLPlaceholder,
        nowUtc,
        updateClock,
        completedExtraQuestions,
        loadProfileData,
        closeWidget,
        hasVirtualAccessLevel,
        ...rest
    }) => {

    const [registrationForm, setRegistrationForm] = useState({
        values: {
            ticketType: null,
            ticketQuantity: 1,
            personalInformation: null,
            paymentInformation: null,
        },
        errors: []
    });

    const [ticketTaxesError, setTicketTaxesError] = useState(false);

    const { values: formValues, errors: formErrors } = registrationForm;

    const setFormValues = (values) => setRegistrationForm({ ...registrationForm, values });

    const setFormErrors = (errors) => setRegistrationForm({ ...registrationForm, errors });

    const { publicKey, provider } = getCurrentProvider(summitData);

    useEffect(() => {
        if(profileData)
            loadProfileData(profileData);
    }, [profileData])

    // just initial load ( once )
    useEffect(() => {
        loadSession({ ...rest, summitData, profileData });
        if (!profileData) {
            changeStep(0);
        }
    }, [])

    useEffect(() => {
        if (summitData && profileData) {
            handleGetTicketTypesAndTaxes(summitData.id);
        }
    }, [summitData, profileData]);

    useEffect(() => {
        if (summitData && profileData) {
            getMyInvitation(summitData.id).catch(e => console.log(e));
        }
    }, [summitData, profileData]);

    useEffect(() => {
        if (step === 1 && formValues?.ticketType && formValues?.personalInformation) {
            reserveTicket({
                provider,
                personalInformation: formValues?.personalInformation,
                ticket: formValues?.ticketType,
                ticketQuantity: formValues?.ticketQuantity,
            }, {
                onError: (err, res) => setFormErrors(res.body.errors)
            }).catch((error) => {
                let { message } = error;
                if(message && (message.includes(AUTH_ERROR_MISSING_AUTH_INFO) ||
                    message.includes(AUTH_ERROR_MISSING_REFRESH_TOKEN) ||
                    message.includes(AUTH_ERROR_REFRESH_TOKEN_REQUEST_ERROR))){
                    // we dont have an access token, init log out process
                    clearWidgetState();
                    return authErrorCallback(error);
                }
            });
        }

        if (step > 0 && !formValues?.ticketType) {
            changeStep(0);
        }
    }, [formValues]);

    useEffect(() => {
        setFormErrors([]);
    }, [step])

    const [ref, { height }] = useMeasure();

    const toggleAnimation = useSpring({
        config: { bounce: 0, ...config.stiff },
        to: {
            opacity: formValues?.ticketType?.cost === 0 ? 0 : 1,
            height: formValues?.ticketType?.cost === 0 ? 0 : height,
        }
    });

    const handleCloseClick = () => {
        // Reset the step when closed to avoid unexpected behavior from `useEffect`s w/in other steps.
        // (i.e., recalling `onPurchaseComplete` after a user completes one order, closes the window, and then reopens the registration widget)
        changeStep(0);
        clearWidgetState();
        if(closeWidget)
            closeWidget();
    };

    const handleGetTicketTypesAndTaxes = (summitId) => {
        setTicketTaxesError(false);
        getTicketTypesAndTaxes(summitId).
            then()
            .catch((error) => {
                let { message } = error;
                if(message && (message.includes(AUTH_ERROR_MISSING_AUTH_INFO) ||
                    message.includes(AUTH_ERROR_MISSING_REFRESH_TOKEN) ||
                    message.includes(AUTH_ERROR_REFRESH_TOKEN_REQUEST_ERROR))){
                   // we dont have an access token, init log out process
                    clearWidgetState();
                    return authErrorCallback(error);
                }
                setTicketTaxesError(true);
            });
    }

    // if we dont have yet ticket types and we didnt requested so far for them but we are already logged in
    // just dont render
    if(ticketTypes.length === 0 && !requestedTicketTypes && profileData) return null;

    const allowedTicketTypes = ticketTypes.filter((tt) => (tt.sales_start_date === null && tt.sales_end_date === null) ||
        (nowUtc >= tt.sales_start_date && nowUtc <= tt.sales_end_date));

    return (
        <div id={`${styles.modal}`} className="modal is-active">
            <div className="modal-background"></div>
            <div className={`${styles.modalContent} modal-content`}>
                <AjaxLoader relative={true} color={'#ffffff'} show={widgetLoading || loading} size={80} />
                <Clock onTick={(timestamp) => updateClock(timestamp)} timezone={summitData.time_zone_id} />
                <div className={`${styles.outerWrapper} summit-registration-lite`}>
                    <div className={styles.innerWrapper}>
                        <div className={styles.title}>
                            <span>{summitData.name}</span>
                            <i className="fa fa-close" aria-label="close" onClick={handleCloseClick}></i>
                        </div>

                        {ticketTaxesError && profileData && <TicketTaxesError ticketTaxesErrorMessage={ticketTaxesErrorMessage} retryTicketTaxes={() => handleGetTicketTypesAndTaxes(summitData?.id)} />}

                        {!ticketTaxesError && profileData && allowedTicketTypes.length === 0 && requestedTicketTypes && <NoAllowedTickets noAllowedTicketsMessage={noAllowedTicketsMessage} />}

                        {!ticketTaxesError &&
                            <div className={styles.stepsWrapper}>
                                {!profileData && !passwordlessCodeSent && (
                                    <LoginComponent
                                        loginOptions={loginOptions}
                                        allowsNativeAuth={allowsNativeAuth}
                                        allowsOtpAuth={allowsOtpAuth}
                                        login={(provider) => rest.authUser(provider)}
                                        getLoginCode={getLoginCode}
                                        getPasswordlessCode={getPasswordlessCode}
                                        initialEmailValue={loginInitialEmailInputValue}
                                    />
                                )}

                                {!profileData && passwordlessCodeSent && (
                                    <PasswordlessLoginComponent
                                        codeLength={passwordlessCode}
                                        email={passwordlessEmail}
                                        passwordlessLogin={passwordlessLogin}
                                        loginWithCode={loginWithCode}
                                        codeError={passwordlessCodeError}
                                        goToLogin={goToLogin}
                                        getLoginCode={getLoginCode}
                                        getPasswordlessCode={getPasswordlessCode}
                                    />
                                )}

                                {profileData && step !== 3 && allowedTicketTypes.length > 0 && (
                                    <>
                                        {ticketOwned &&
                                            <TicketOwnedComponent ownedTickets={ownedTickets}
                                                                  ticketTypes={allowedTicketTypes} />}

                                        <TicketTypeComponent
                                            ticketTypes={allowedTicketTypes}
                                            inPersonDisclaimer={inPersonDisclaimer}
                                            taxTypes={taxTypes}
                                            reservation={reservation}
                                            isActive={step === 0}
                                            changeForm={ticketForm => setFormValues({ ...formValues, ...ticketForm })}
                                            showMultipleTicketTexts={showMultipleTicketTexts}
                                        />

                                        <PersonalInfoComponent
                                            isActive={step === 1}
                                            reservation={reservation}
                                            userProfile={profileData}
                                            invitation={invitation}
                                            summitId={summitData.id}
                                            changeForm={personalInformation => setFormValues({
                                                ...formValues,
                                                personalInformation
                                            })}
                                            handleCompanyError={handleCompanyError}
                                            formValues={formValues}
                                            formErrors={formErrors}
                                            showMultipleTicketTexts={showMultipleTicketTexts}
                                            allowPromoCodes={allowPromoCodes}
                                            showCompanyInput={showCompanyInput}
                                            companyInputPlaceholder={companyInputPlaceholder}
                                            companyDDLPlaceholder={companyDDLPlaceholder}
                                        />

                                        <animated.div style={{ ...toggleAnimation }}>
                                            <div ref={ref}>
                                                <PaymentComponent
                                                    isActive={step === 2}
                                                    reservation={reservation}
                                                    payTicket={payTicketWithProvider}
                                                    userProfile={profileData}
                                                    timestamp={summitData.timestamp}
                                                    provider={provider}
                                                    providerKey={publicKey}
                                                    stripeOptions={stripeOptions}
                                                />
                                            </div>
                                        </animated.div>
                                    </>
                                )}

                                {profileData && step === 3 && (
                                    <PurchaseComplete
                                        checkout={checkout}
                                        user={profileData}
                                        summit={summitData}
                                        onPurchaseComplete={onPurchaseComplete}
                                        goToEvent={goToEvent}
                                        goToMyOrders={goToMyOrders}
                                        goToExtraQuestions={goToExtraQuestions}
                                        completedExtraQuestions={completedExtraQuestions}
                                        nowUtc={nowUtc}
                                        clearWidgetState={clearWidgetState}
                                        closeWidget={closeWidget}
                                        hasVirtualAccessLevel={hasVirtualAccessLevel}
                                        supportEmail={supportEmail}
                                        footerHasTicketText={rest.footerHasTicketText}
                                    />
                                )}
                            </div>
                        }

                        {!ticketTaxesError && profileData && step !== 3 && allowedTicketTypes.length > 0 && (
                            <ButtonBarComponent
                                step={step}
                                inPersonDisclaimer={inPersonDisclaimer}
                                formValues={formValues}
                                removeReservedTicket={removeReservedTicket}
                                changeStep={changeStep}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const mapStateToProps = ({ registrationLiteState }) => ({
    widgetLoading: registrationLiteState.widgetLoading,
    reservation: registrationLiteState.reservation,
    invitation: registrationLiteState.invitation,
    userProfile: registrationLiteState.settings.userProfile,
    checkout: registrationLiteState.checkout,
    ticketTypes: registrationLiteState.ticketTypes,
    requestedTicketTypes: registrationLiteState.requestedTicketTypes,
    taxTypes: registrationLiteState.taxTypes,
    step: registrationLiteState.step,
    passwordlessEmail: registrationLiteState.passwordless.email,
    passwordlessCode: registrationLiteState.passwordless.otp_length,
    passwordlessCodeSent: registrationLiteState.passwordless.code_sent,
    passwordlessCodeError: registrationLiteState.passwordless.error,
    nowUtc: registrationLiteState.nowUtc,
})

RegistrationLite.defaultProps = {
    loginInitialEmailInputValue: '',
    showMultipleTicketTexts: true,
    showCompanyInput: true,
    noAllowedTicketsMessage: '<span>You already have purchased all available tickets for this event and/or there are no tickets available for you to purchase.</span><br/><span><a href="/a/my-tickets">Visit the my orders / my tickets page</a> to review your existing tickets.</span>',
    ticketTaxesErrorMessage: '<span>There was an error getting the information for the tickets. Please try it again.</span>',
    allowPromoCodes: true,
    companyInputPlaceholder: 'Enter your company',
    companyDDLPlaceholder: 'Select a company',
    authErrorCallback: (error) => { console.log(error) },
    hasVirtualAccessLevel: false,
    supportEmail : 'support@fntech.com',
};

RegistrationLite.propTypes = {
    loginInitialEmailInputValue: PropTypes.string,
    showMultipleTicketTexts: PropTypes.bool,
    showCompanyInput: PropTypes.bool,
    authErrorCallback : PropTypes.func,
    goToMyOrders: PropTypes.func.isRequired,
    goToExtraQuestions: PropTypes.func.isRequired,
    completedExtraQuestions: PropTypes.func.isRequired,
    closeWidget:PropTypes.func,
    hasVirtualAccessLevel:PropTypes.bool,
    supportEmail: PropTypes.string,
    footerHasTicketText: PropTypes.string,
};

export default connect(mapStateToProps, {
    loadSession,
    changeStep,
    reserveTicket,
    removeReservedTicket,
    payTicketWithProvider,
    getTicketTypesAndTaxes,
    getLoginCode,
    passwordlessLogin,
    goToLogin,
    getMyInvitation,
    clearWidgetState,
    updateClock,
    loadProfileData,
})(RegistrationLite)
