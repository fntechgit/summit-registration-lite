/**
 * Copyright 2026 OpenStack Foundation
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
 * RegistrationForm - Core registration form component
 **/

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { connect } from "react-redux";
import PropTypes from 'prop-types';
import { withReduxProvider } from '../../utils/withReduxProvider';
import { animated, config, useSpring } from "react-spring";
import { useMeasure } from "react-use";
import {
    AUTH_ERROR_MISSING_AUTH_INFO,
    AUTH_ERROR_MISSING_REFRESH_TOKEN,
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
    validatePromoCode,
    discoverPromoCodes,
    startWidgetLoading,
    stopWidgetLoading
} from '../../actions';

import usePromoCode from '../../hooks/usePromoCode';

import AjaxLoader from "openstack-uicore-foundation/lib/components/ajaxloader";
import Clock from "openstack-uicore-foundation/lib/components/clock";

import '../../styles/styles.scss';

import LoginComponent from '../login';
import PaymentComponent from '../payment';
import PersonalInfoComponent from '../personal-information';
import TicketTypeComponent from '../ticket-type';
import ButtonBarComponent from '../button-bar';
import PurchaseComplete from '../purchase-complete';
import PasswordlessLoginComponent from '../login-passwordless';
import TicketOwnedComponent from '../ticket-owned';
import { buildTrackEvent, getCurrentProvider } from '../../utils/utils';
import NoAllowedTickets from '../no-allowed-tickets';
import TicketTaxesError from '../ticket-taxes-error';
import T from 'i18n-react';
import { getCurrentUserLanguage } from '../../utils/utils';
import {
    ADD_TO_CART, BEGIN_CHECKOUT, PURCHASE_COMPLETE, PROMO_STATUS,
    STEP_COMPLETE,
    STEP_PAYMENT,
    STEP_PERSONAL_INFO,
    STEP_SELECT_TICKET_TYPE, TICKET_TYPE_SUBTYPE_PREPAID, VIEW_ITEM
} from '../../utils/constants';

let language = getCurrentUserLanguage();

if (language.length > 2) {
    language = language.split("-")[0];
    language = language.split("_")[0];
}

try {
    T.setTexts(require(`../../i18n/${language}.json`));
} catch (e) {
    T.setTexts(require(`../../i18n/en.json`));
}


const RegistrationFormContent = (
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
        passwordlessCodeLifeTime,
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
        providerOptions,
        invitation,
        loginInitialEmailInputValue,
        getMyInvitation,
        showMultipleTicketTexts,
        noAllowedTicketsMessage,
        noTicketsAvailableMessage,
        ticketTaxesErrorMessage,
        authErrorCallback,
        clearWidgetState,
        allowPromoCodes,
        showCompanyInput,
        companyDDLPlaceholder,
        nowUtc,
        updateClock,
        completedExtraQuestions,
        loadProfileData,
        closeWidget,
        hasVirtualAccessLevel,
        hidePostalCode,
        onError,
        successfulPaymentReturnUrl,
        idpLogoLight,
        idpLogoDark,
        idpLogoAlt,
        showCompanyInputDefaultOptions,
        companyDDLOptions2Show,
        promoCode,
        promoCodeVerified,
        promoCodeValidating,
        promoCodeAllowsReassign,
        discoveredPromoCodes,
        hasDiscount,
        getTicketDiscount,
        removePromoCode,
        applyPromoCode,
        validatePromoCode,
        discoverPromoCodes,
        startWidgetLoading,
        stopWidgetLoading,
        closeHandlerRef,
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

    const [ticketDataError, setTicketDataError] = useState(false);
    const [ticketDataLoaded, setTicketDataLoaded] = useState(false);
    const [unappliedCodeWarning, setUnappliedCodeWarning] = useState(null);

    const { values: formValues, errors: formErrors } = registrationForm;

    const mergeFormValues = useCallback((partial) => setRegistrationForm(prev => ({ ...prev, values: { ...prev.values, ...partial } })), []);

    const setFormErrors = useCallback((errors) => setRegistrationForm(prev => ({ ...prev, errors })), []);

    const { publicKey, provider } = getCurrentProvider(summitData);

    const allowedTicketTypes = ticketDataLoaded ? ticketTypes.filter((tt) => tt.sub_type === TICKET_TYPE_SUBTYPE_PREPAID || (tt.sales_start_date === null && tt.sales_end_date === null) || (nowUtc >= tt.sales_start_date && nowUtc <= tt.sales_end_date)) : [];

    const noAvailableTickets = useMemo(() => profileData && ticketDataLoaded && !ticketDataError && allowedTicketTypes.length === 0 && step !== STEP_COMPLETE, [profileData, ticketDataLoaded, ticketDataError, allowedTicketTypes, step]);
    const alreadyOwnedTickets = useMemo(() => profileData && ticketDataLoaded && !ticketDataError && allowedTicketTypes.length > 0 && ownedTickets.length > 0, [profileData, ticketDataLoaded, ticketDataError, allowedTicketTypes, ownedTickets]);

    useEffect(() => {
        if (profileData)
            loadProfileData(profileData);
    }, [profileData])

    useEffect(() => {
        loadSession({ ...rest, summitData, profileData });
        if (!profileData) {
            changeStep(STEP_SELECT_TICKET_TYPE);
        }
    }, [])

    useEffect(() => {
        if (summitData && profileData) {
            const ensureInvitation = () =>
                summitData.invite_only_registration
                    ? getMyInvitation(summitData.id)
                    : Promise.resolve();

            ensureInvitation()
                .catch(e => console.log(e))
                .finally(() => handleGetTicketTypesAndTaxes(summitData.id));
        }
    }, [summitData?.id, profileData]);

    useEffect(() => {
        if (step > STEP_SELECT_TICKET_TYPE && !registrationForm.values?.ticketType && !reservation) {
            changeStep(STEP_SELECT_TICKET_TYPE);
        }
    }, [registrationForm.values, step]);

    useEffect(() => {
        setFormErrors([]);
    }, [step])

    // Discovery: fetch qualifying promo codes after auth
    useEffect(() => {
        if (profileData && summitData?.id) {
            discoverPromoCodes(summitData.id);
        }
    }, [profileData, summitData?.id]);

    const handleFormPromoCodeChange = useCallback((code) => mergeFormValues({ promoCode: code }), [mergeFormValues]);
    const handleClearFormErrors = useCallback(() => setFormErrors([]), [setFormErrors]);

    const promo = usePromoCode({
        discoveredPromoCodes,
        promoCode,
        promoCodeVerified,
        promoCodeValidating,
        applyPromoCode,
        removePromoCode,
        validatePromoCode,
        onFormPromoCodeChange: handleFormPromoCodeChange,
        clearFormErrors: handleClearFormErrors,
        ticketDataLoaded: ticketDataLoaded && !ticketDataError,
        hasTickets: allowedTicketTypes.length > 0,
        errorOverride: unappliedCodeWarning,
    });

    // Local destructure for readability at call sites.
    const { state: promoState, actions: promoActions } = promo;

    // Clear the unapplied-code warning once the condition that would have raised it
    // no longer holds (input cleared, code applied, or a suggestion is showing).
    useEffect(() => {
        if (!formValues?.promoCode || promoCode || promoState.status === PROMO_STATUS.SUGGESTED) {
            setUnappliedCodeWarning(null);
        }
    }, [formValues?.promoCode, promoCode, promoState.status])

    const [ref, { height }] = useMeasure();

    const toggleAnimation = useSpring({
        config: { bounce: 0, ...config.stiff },
        to: {
            opacity: formValues?.ticketType?.cost === 0 ? 0 : 1,
            height: formValues?.ticketType?.cost === 0 ? 0 : height,
        }
    });

    const handleCloseClick = () => {
        const closeAndClearState = () => {
            changeStep(STEP_SELECT_TICKET_TYPE);
            clearWidgetState();
            if (closeWidget) {
                closeWidget();
            }
        }
        if (reservation) {
            removeReservedTicket().finally(() => {
                closeAndClearState()
            });
        } else {
            closeAndClearState()
        }
    };

    // Expose close handler to parent via ref so it can trigger cleanup on close
    useEffect(() => {
        if (closeHandlerRef) {
            closeHandlerRef.current = handleCloseClick;
        }
    });

    const handleGetTicketTypesAndTaxes = (summitId) => {
        setTicketDataError(false);
        setTicketDataLoaded(false);
        getTicketTypesAndTaxes(summitId)
            .catch((error) => {
                let { message } = error;
                if (message && (message.includes(AUTH_ERROR_MISSING_AUTH_INFO) ||
                    message.includes(AUTH_ERROR_MISSING_REFRESH_TOKEN) ||
                    message.includes(AUTH_ERROR_REFRESH_TOKEN_REQUEST_ERROR))) {
                    clearWidgetState();
                    return authErrorCallback(error);
                }
                setTicketDataError(true);
            })
            .finally(() => {
                setTicketDataLoaded(true);
            });
    }

    const handleAdvanceFromTicketStep = async (data) => {
        if (formValues?.promoCode && !promoCode && promoState.status !== PROMO_STATUS.SUGGESTED) {
            setUnappliedCodeWarning(T.translate('promo_code.unapplied_code_warning'));
            return;
        }
        // Re-validate manual codes with final quantity before advancing
        if (promoCode && !promoState.isDiscoveredCode) {
            startWidgetLoading();
            let valid = false;
            try {
                valid = await promoActions.onRevalidate(formValues.ticketType, data.ticketQuantity);
            } finally {
                stopWidgetLoading();
            }
            if (!valid) return;
        }
        trackAddToCart(data);
        changeStep(STEP_PERSONAL_INFO);
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

    const handlePurchaseComplete = (order) => {
        onPurchaseComplete(order);
        trackEvent(PURCHASE_COMPLETE, { order });
    }

    // If user is logged in but ticket data hasn't loaded yet (and no error occurred),
    // don't render to avoid flash. Uses local state instead of Redux to prevent
    // race conditions with redux-persist rehydration.
    if (profileData && !ticketDataLoaded && !ticketDataError) return null;

    return (
        <div className="summit-registration-lite">
            <AjaxLoader relative={true} color={'#ffffff'} show={widgetLoading || loading} size={80} />
            <Clock onTick={(timestamp) => updateClock(timestamp)} timezone={summitData.time_zone_id} />

            {profileData && ticketDataError && <TicketTaxesError ticketTaxesErrorMessage={ticketTaxesErrorMessage} retryTicketTaxes={() => handleGetTicketTypesAndTaxes(summitData?.id)} />}

            {!ticketDataError && (
                <>
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
                            codeLifeTime={passwordlessCodeLifeTime}
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
                            {alreadyOwnedTickets &&
                                <TicketOwnedComponent ownedTickets={ownedTickets} />}

                            <TicketTypeComponent
                                allowedTicketTypes={allowedTicketTypes}
                                originalTicketTypes={ticketTypes}
                                inPersonDisclaimer={inPersonDisclaimer}
                                taxTypes={taxTypes}
                                reservation={reservation}
                                isActive={step === STEP_SELECT_TICKET_TYPE}
                                allowPromoCodes={allowPromoCodes}
                                promo={promo}
                                promoCode={promoCode}
                                promoCodeAllowsReassign={promoCodeAllowsReassign}
                                changeForm={mergeFormValues}
                                trackViewItem={trackViewItem}
                                showMultipleTicketTexts={showMultipleTicketTexts}
                                noTicketsAvailableMessage={noTicketsAvailableMessage}
                            />

                            <PersonalInfoComponent
                                isActive={step === STEP_PERSONAL_INFO}
                                reservation={reservation}
                                userProfile={profileData}
                                invitation={invitation}
                                summitId={summitData.id}
                                changeForm={(personalInformation) => {
                                    mergeFormValues({ personalInformation });

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
                                            if (message && (message.includes(AUTH_ERROR_MISSING_AUTH_INFO) ||
                                                message.includes(AUTH_ERROR_MISSING_REFRESH_TOKEN) ||
                                                message.includes(AUTH_ERROR_REFRESH_TOKEN_REQUEST_ERROR))) {
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
                                promoCodeAllowsReassign={promoCodeAllowsReassign}
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
                                        providerOptions={providerOptions}
                                        hidePostalCode={hidePostalCode}
                                        onError={onError}
                                        successfulPaymentReturnUrl={successfulPaymentReturnUrl}
                                    />
                                </div>
                            </animated.div>

                            <ButtonBarComponent
                                step={step}
                                inPersonDisclaimer={inPersonDisclaimer}
                                formValues={formValues}
                                promoIsReady={promoState.isReady}
                                removeReservedTicket={removeReservedTicket}
                                onNextStep={handleAdvanceFromTicketStep}
                                changeStep={changeStep}
                            />
                        </>
                    )}

                    {profileData && step === STEP_COMPLETE && (
                        <PurchaseComplete
                            checkout={checkout}
                            user={profileData}
                            summit={summitData}
                            onPurchaseComplete={handlePurchaseComplete}
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
                            orderCompleteTitle={rest.orderCompleteTitle}
                            orderComplete1stParagraph={rest.orderComplete1stParagraph}
                            orderComplete2ndParagraph={rest.orderComplete2ndParagraph}
                            orderCompleteButton={rest.orderCompleteButton}
                        />
                    )}
                </>
            )}
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
    taxTypes: registrationLiteState.taxTypes,
    step: registrationLiteState.step,
    passwordlessEmail: registrationLiteState.passwordless.email,
    passwordlessCode: registrationLiteState.passwordless.otp_length,
    passwordlessCodeLifeTime: registrationLiteState.passwordless.otp_lifetime,
    passwordlessCodeSent: registrationLiteState.passwordless.code_sent,
    passwordlessCodeError: registrationLiteState.passwordless.error,
    nowUtc: registrationLiteState.nowUtc,
    promoCode: registrationLiteState.promoCode,
    promoCodeVerified: registrationLiteState.promoCodeVerified,
    promoCodeValidating: registrationLiteState.promoCodeValidating,
    promoCodeAllowsReassign: registrationLiteState.promoCodeAllowsReassign,
    discoveredPromoCodes: registrationLiteState.discoveredPromoCodes,
})

const RegistrationForm = connect(mapStateToProps, {
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
    validatePromoCode,
    discoverPromoCodes,
    startWidgetLoading,
    stopWidgetLoading
})(RegistrationFormContent);

RegistrationForm.defaultProps = {
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
    successfulPaymentReturnUrl: '',
};

RegistrationForm.propTypes = {
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

export { RegistrationForm };
export default withReduxProvider(RegistrationForm);
