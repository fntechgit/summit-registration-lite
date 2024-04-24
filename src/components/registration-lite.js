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

import React, { useEffect, useState, useMemo } from 'react';
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
    removePromoCode,
    applyPromoCode,
    validatePromoCode
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
import { buildTrackEvent, getCurrentProvider } from '../utils/utils';
import NoAllowedTickets from './no-allowed-tickets';
import TicketTaxesError from './ticket-taxes-error';
import T from 'i18n-react';
import { getCurrentUserLanguage } from '../utils/utils';
import {
    ADD_TO_CART, BEGIN_CHECKOUT,
    STEP_COMPLETE,
    STEP_PAYMENT,
    STEP_PERSONAL_INFO,
    STEP_SELECT_TICKET_TYPE, VIEW_ITEM
} from '../utils/constants';

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
        trackEvent,
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
        companyDDLPlaceholder,
        nowUtc,
        updateClock,
        completedExtraQuestions,
        loadProfileData,
        closeWidget,
        hasVirtualAccessLevel,
        idpLogoLight,
        idpLogoDark,
        idpLogoAlt,
        showCompanyInputDefaultOptions,
        companyDDLOptions2Show,
        promoCode,
        hasDiscount,
        getTicketDiscount,
        removePromoCode,
        applyPromoCode,
        validatePromoCode,
        ...rest
    }) => {

    const [registrationForm, setRegistrationForm] = useState({
        values: {
            ticketType: null,
            ticketQuantity: 1,
            personalInformation: null,
            paymentInformation: null,
            promoCode: '',
        },
        errors: []
    });

    const [ticketTaxesError, setTicketTaxesError] = useState(false);
    const [ticketTaxesLoaded, setTicketTaxesLoaded] = useState(false);

    const { values: formValues, errors: formErrors } = registrationForm;

    const setFormValues = (values) => setRegistrationForm({ ...registrationForm, values });

    const setFormErrors = (errors) => setRegistrationForm({ ...registrationForm, errors });

    const { publicKey, provider } = getCurrentProvider(summitData);

    const allowedTicketTypes = ticketTaxesLoaded ? ticketTypes.filter((tt) => (tt.sales_start_date === null && tt.sales_end_date === null) || (nowUtc >= tt.sales_start_date && nowUtc <= tt.sales_end_date)) : [];
    
    const noAvailableTickets = useMemo(() => profileData && ticketTaxesLoaded && !ticketTaxesError && allowedTicketTypes.length === 0 && step !== STEP_COMPLETE, [allowedTicketTypes]);
    const alreadyOwnedTickets = useMemo(() => profileData && ticketTaxesLoaded && !ticketTaxesError && allowedTicketTypes.length > 0 && ownedTickets.length > 0, [ownedTickets, allowedTicketTypes]);

    useEffect(() => {
        if(profileData)
            loadProfileData(profileData);
    }, [profileData])

    // just initial load ( once )
    useEffect(() => {
        loadSession({ ...rest, summitData, profileData });
        if (!profileData) {
            changeStep(STEP_SELECT_TICKET_TYPE);
        }
    }, [])

    useEffect(() => {
        if (summitData && profileData) {
            getMyInvitation(summitData.id).catch(e => console.log(e)).finally(() => handleGetTicketTypesAndTaxes(summitData.id));
        }
    }, [summitData, profileData]);

    useEffect(() => {
        // check if there's personal information data and no ticket data to reset widget
        if (step > STEP_SELECT_TICKET_TYPE && !registrationForm.values?.ticketType && !reservation) {
            changeStep(STEP_SELECT_TICKET_TYPE);
        }
    }, [registrationForm.values, step]);

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
        const closeAndClearState = () => {
            changeStep(STEP_SELECT_TICKET_TYPE);
            clearWidgetState();
            if (closeWidget) {
                closeWidget();
            }
        }
        // if there's a reservation on the state, delete it before close the widget
        if (reservation) {
            removeReservedTicket().finally(() => {
                closeAndClearState()
            });
        } else {
            closeAndClearState()
        }
    };

    const handleGetTicketTypesAndTaxes = (summitId) => {
        setTicketTaxesError(false);
        setTicketTaxesLoaded(false);
        getTicketTypesAndTaxes(summitId)
            .then()
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
            })
            .finally(() => {
                setTicketTaxesLoaded(true);
            });
    }

    const handleValidatePromocode = (data, onError) => {
        validatePromoCode(data, onError).then(() => {
            trackAddToCart(data);
        });
    }

    const trackViewItem = (data) => {
        const eventData = buildTrackEvent(data);
        trackEvent(VIEW_ITEM, eventData);
    }

    const trackAddToCart = (data) => {
        const eventData = buildTrackEvent(data, data.ticketQuantity, promoCode);
        trackEvent(ADD_TO_CART, eventData);
    }

    const trackBeginCheckout = (data) => {
        const eventData = buildTrackEvent(data.ticketType, data.ticketQuantity, promoCode);
        trackEvent(BEGIN_CHECKOUT, eventData);
    }

    // if we dont have yet ticket types and we didnt requested so far for them but we are already logged in
    // just dont render
    if(ticketTypes.length === 0 && !requestedTicketTypes && profileData) return null;

    return (
        <div id={`${styles.modal}`} className="modal is-active">
            <div className="modal-background"></div>
            <div className={`${styles.modalContent} modal-content`}>
                <AjaxLoader relative={true} color={'#ffffff'} show={widgetLoading || loading} size={80} />
                <Clock onTick={(timestamp) => updateClock(timestamp)} timezone={summitData.time_zone_id} />
                <div className={`${styles.outerWrapper} summit-registration-lite`}>
                    <div className={styles.innerWrapper}>
                        <div className={styles.title}>
                            {profileData && <span>{summitData.name}</span>}
                            <i className="fa fa-close" aria-label="close" onClick={handleCloseClick}></i>
                        </div>

                        {profileData && ticketTaxesError && <TicketTaxesError ticketTaxesErrorMessage={ticketTaxesErrorMessage} retryTicketTaxes={() => handleGetTicketTypesAndTaxes(summitData?.id)} />}

                        {noAvailableTickets && <NoAllowedTickets noAllowedTicketsMessage={noAllowedTicketsMessage} />}

                        {!ticketTaxesError &&
                            <div className={styles.stepsWrapper}>
                                {!profileData && !passwordlessCodeSent && (
                                    <LoginComponent
                                        summitData={summitData}
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
                                        idpLogoLight={idpLogoLight}
                                        idpLogoDark={idpLogoDark}
                                        idpLogoAlt={idpLogoAlt}
                                    />
                                )}

                                {profileData && step !== STEP_COMPLETE && (
                                    <>
                                        { alreadyOwnedTickets &&
                                            <TicketOwnedComponent ownedTickets={ownedTickets} />}

                                        <TicketTypeComponent
                                            allowedTicketTypes={allowedTicketTypes}
                                            originalTicketTypes={ticketTypes}
                                            inPersonDisclaimer={inPersonDisclaimer}
                                            taxTypes={taxTypes}
                                            reservation={reservation}
                                            isActive={step === STEP_SELECT_TICKET_TYPE}
                                            allowPromoCodes={allowPromoCodes}
                                            applyPromoCode={applyPromoCode}
                                            removePromoCode={() => {setFormErrors({});removePromoCode()}}
                                            promoCode={promoCode}
                                            formErrors={formErrors}
                                            changeForm={ticketForm => setFormValues({ ...formValues, ...ticketForm })}
                                            trackViewItem={trackViewItem}
                                            showMultipleTicketTexts={showMultipleTicketTexts}
                                        />

                                        <PersonalInfoComponent
                                            isActive={step === STEP_PERSONAL_INFO}
                                            reservation={reservation}
                                            userProfile={profileData}
                                            invitation={invitation}
                                            summitId={summitData.id}
                                            changeForm={(personalInformation) => {
                                                setFormValues({
                                                    ...registrationForm.values,
                                                    personalInformation
                                                });

                                                reserveTicket({
                                                    provider,
                                                    personalInformation: personalInformation,
                                                    ticket: registrationForm.values?.ticketType,
                                                    ticketQuantity: registrationForm.values?.ticketQuantity,
                                                }, {
                                                    onError: (err, res) => setFormErrors(res.body.errors)
                                                })
                                                    .then(() => {
                                                        trackBeginCheckout(registrationForm.values);
                                                    })
                                                    .catch((error) => {
                                                        let { message } = error;
                                                        if(message && (message.includes(AUTH_ERROR_MISSING_AUTH_INFO) ||
                                                            message.includes(AUTH_ERROR_MISSING_REFRESH_TOKEN) ||
                                                            message.includes(AUTH_ERROR_REFRESH_TOKEN_REQUEST_ERROR))){
                                                            // we dont have an access token, init log out process
                                                            clearWidgetState();
                                                            return authErrorCallback(error);
                                                        }
                                                    });
                                            }}
                                            handleCompanyError={handleCompanyError}
                                            formValues={formValues}
                                            formErrors={formErrors}
                                            showMultipleTicketTexts={showMultipleTicketTexts}
                                            showCompanyInput={showCompanyInput}
                                            companyDDLPlaceholder={companyDDLPlaceholder}
                                            showCompanyInputDefaultOptions={showCompanyInputDefaultOptions}
                                            companyDDLOptions2Show={companyDDLOptions2Show}
                                        />

                                        <animated.div style={{ ...toggleAnimation }}>
                                            <div ref={ref}>
                                                <PaymentComponent
                                                    isActive={step === STEP_PAYMENT}
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

                                {profileData && step === STEP_COMPLETE && (
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
                                        initialOrderComplete1stParagraph={rest.initialOrderComplete1stParagraph}
                                        initialOrderComplete2ndParagraph={rest.initialOrderComplete2ndParagraph}
                                        initialOrderCompleteButton={rest.initialOrderCompleteButton}
                                        orderComplete1stParagraph={rest.orderComplete1stParagraph}
                                        orderComplete2ndParagraph={rest.orderComplete2ndParagraph}
                                        orderCompleteButton={rest.orderCompleteButton}
                                    />
                                )}
                            </div>
                        }

                        {!ticketTaxesError && profileData && step !== STEP_COMPLETE && (
                            <ButtonBarComponent
                                step={step}
                                inPersonDisclaimer={inPersonDisclaimer}
                                formValues={formValues}
                                removeReservedTicket={removeReservedTicket}
                                validatePromoCode={handleValidatePromocode}
                                onValidateError={{
                                    onError: (err, res) => setFormErrors(res.body.errors)
                                }}
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
    promoCode: registrationLiteState.promoCode,
})

RegistrationLite.defaultProps = {
    loginInitialEmailInputValue: '',
    showMultipleTicketTexts: true,
    showCompanyInput: true,
    noAllowedTicketsMessage: '<span>You already have purchased all available tickets for this event and/or there are no tickets available for you to purchase.</span><br/><span><a href="/a/my-tickets">Visit the my orders / my tickets page</a> to review your existing tickets.</span>',
    ticketTaxesErrorMessage: '<span>There was an error getting the information for the tickets. Please try it again.</span>',
    allowPromoCodes: true,
    companyDDLPlaceholder: 'Select a company',
    authErrorCallback: (error) => { console.log(error) },
    hasVirtualAccessLevel: false,
    supportEmail : 'support@fntech.com',
    showCompanyInputDefaultOptions: false,
    companyDDLOptions2Show: 25,
    idpLogoLight: null,
    idpLogoDark: null
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
    initialOrderComplete1stParagraph: PropTypes.string,
    initialOrderComplete2ndParagraph: PropTypes.string,
    initialOrderCompleteButton: PropTypes.string,
    orderComplete1stParagraph: PropTypes.string,
    orderComplete2ndParagraph: PropTypes.string,
    orderCompleteButton: PropTypes.string,
    showCompanyInputDefaultOptions: PropTypes.bool,
    companyDDLOptions2Show: PropTypes.number,
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
    applyPromoCode,
    removePromoCode,
    validatePromoCode
})(RegistrationLite)
