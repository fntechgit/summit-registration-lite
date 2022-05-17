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

import React, { useState, useEffect, useMemo } from 'react';
import { connect } from "react-redux";

import { useSpring, config, animated } from "react-spring";
import { useMeasure } from "react-use";

import {
    loadSession, changeStep, reserveTicket, removeReservedTicket,
    payTicket, getTicketTypes, getTaxesTypes, getLoginCode, passwordlessLogin, goToLogin
} from "../actions";

import AjaxLoader from "openstack-uicore-foundation/lib/components/ajaxloader";

import { loadStripe } from '@stripe/stripe-js';

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

const RegistrationLite = (
    {
        loadSession,
        setMarketingSettings,
        changeStep,
        removeReservedTicket,
        reserveTicket,
        payTicket,
        onPurchaseComplete,
        getTicketTypes,
        getTaxesTypes,
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
        goToEvent,
        goToRegistration,
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

    const { values: formValues, errors: formErrors } = registrationForm;

    const setFormValues = (values) => setRegistrationForm({ ...registrationForm, values });

    const setFormErrors = (errors) => setRegistrationForm({ ...registrationForm, errors });

    let publicKey = null;
    for (let profile of summitData.payment_profiles) {
        if (profile.application_type === 'Registration') {
            publicKey = profile.test_mode_enabled ? profile.test_publishable_key : profile.live_publishable_key;
            break;
        }
    }

    const stripePromise = useMemo(() => loadStripe(publicKey), [publicKey])

    useEffect(() => {
        loadSession({ ...rest, summitData, profileData });
        if (!profileData) {
            changeStep(0);
        }
    }, [profileData])

    useEffect(() => {
        if (summitData && profileData) {
            getTicketTypes(summitData.id).then(() => getTaxesTypes(summitData.id));
        }
    }, [summitData, profileData]);

    useEffect(() => {
        if (step === 1 && formValues?.ticketType && formValues?.personalInformation) {
            reserveTicket({
                personalInformation: formValues?.personalInformation,
                ticket: formValues?.ticketType,
                ticketQuantity: formValues?.ticketQuantity,
            }, {
                onError: (err, res) => setFormErrors(res.body.errors)
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
        rest.closeWidget();
    };

    return (
        <div id="modal" className="modal is-active">
            <div className="modal-background"></div>
            <div className="modal-content">
                <AjaxLoader relative={true} color={'#ffffff'} show={widgetLoading || loading} size={80} />
                <div className={`${styles.outerWrapper} summit-registration-lite`}>
                    <div className={styles.innerWrapper}>
                        <div className={styles.title} >
                            <span>{summitData.name}</span>
                            <i className="fa fa-close" aria-label="close" onClick={handleCloseClick}></i>
                        </div>

                        <div className={styles.stepsWrapper}>
                            {!profileData && !passwordlessCodeSent && (
                                <LoginComponent
                                    options={loginOptions}
                                    allowsNativeAuth={allowsNativeAuth}
                                    allowsOtpAuth={allowsOtpAuth}
                                    login={(provider) => rest.authUser(provider)}
                                    getLoginCode={getLoginCode}
                                    getPasswordlessCode={getPasswordlessCode}
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

                            {profileData && step !== 3 && ticketTypes.length > 0 && (
                                <>
                                    {ticketOwned && <TicketOwnedComponent ownedTickets={ownedTickets} ticketTypes={ticketTypes} />}

                                    <TicketTypeComponent
                                        ticketTypes={ticketTypes}
                                        inPersonDisclaimer={inPersonDisclaimer}
                                        taxTypes={taxTypes}
                                        reservation={reservation}
                                        isActive={step === 0}
                                        changeForm={ticketForm => setFormValues({ ...formValues, ...ticketForm })}
                                    />
                                    <PersonalInfoComponent
                                        isActive={step === 1}
                                        reservation={reservation}
                                        userProfile={profileData}
                                        summitId={summitData.id}
                                        changeForm={personalInformation => setFormValues({ ...formValues, personalInformation })}
                                        handleCompanyError={handleCompanyError}
                                        formErrors={formErrors}
                                    />
                                    <animated.div style={{ ...toggleAnimation }}>
                                        <div ref={ref}>
                                            <PaymentComponent
                                                isActive={step === 2}
                                                reservation={reservation}
                                                payTicket={payTicket}
                                                userProfile={profileData}
                                                stripeKey={stripePromise}
                                            />
                                        </div>
                                    </animated.div>
                                </>
                            )}

                            {profileData && step === 3 && (
                                <PurchaseComplete
                                    checkout={checkout}
                                    summit={summitData}
                                    onPurchaseComplete={onPurchaseComplete}
                                    supportEmail={supportEmail}
                                    goToEvent={goToEvent}
                                    goToExtraQuestions={goToExtraQuestions}
                                />
                            )}
                        </div>

                        {profileData && step !== 3 && (
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
    userProfile: registrationLiteState.settings.userProfile,
    checkout: registrationLiteState.checkout,
    ticketTypes: registrationLiteState.ticketTypes,
    taxTypes: registrationLiteState.taxTypes,
    step: registrationLiteState.step,
    passwordlessEmail: registrationLiteState.passwordless.email,
    passwordlessCode: registrationLiteState.passwordless.otp_length,
    passwordlessCodeSent: registrationLiteState.passwordless.code_sent,
    passwordlessCodeError: registrationLiteState.passwordless.error
})

export default connect(mapStateToProps, {
    loadSession,
    changeStep,
    reserveTicket,
    removeReservedTicket,
    payTicket,
    getTicketTypes,
    getTaxesTypes,
    getLoginCode,
    passwordlessLogin,
    goToLogin
})(RegistrationLite)

