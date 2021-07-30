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
import { loadSession, changeStep, reserveTicket, removeReservedTicket, payTicket, getTicketTypes, getTaxesTypes, getLoginCode, passwordlessLogin, goToLogin } from "../actions";

import { AjaxLoader } from "openstack-uicore-foundation/lib/components";

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
        profileData,
        summitData,
        supportEmail,
        getAccessToken,
        widgetLoading,
        loading,
        inPersonDisclaimer,
        ...rest
    }) => {

    const [registrationForm, setRegistrationForm] = useState(
        {
            ticketType: null,
            personalInformation: null,
            paymentInformation: null,
        }
    );

    let publicKey = null;
    for (let profile of summitData.payment_profiles) {
        if (profile.application_type === 'Registration') {
            publicKey = profile.test_mode_enabled ? profile.test_publishable_key : profile.live_publishable_key;
            break;
        }
    }

    const stripePromise = useMemo(() => loadStripe(publicKey), [publicKey])

    const ticketReservation = () => {
        reserveTicket(registrationForm.personalInformation, registrationForm.ticketType, getAccessToken)
    }

    useEffect(() => {
        loadSession({ ...rest, getAccessToken, summitData, profileData });
        if (!profileData) {
            changeStep(0);
            return;
        }
    }, [ profileData ])

    useEffect(() => {
        getTicketTypes(getAccessToken);
        getTaxesTypes(getAccessToken);
    });

    useEffect(() => {
        if (step === 1 && registrationForm.ticketType && registrationForm.personalInformation) {
            ticketReservation();
        }
        if (step > 0 && !registrationForm.ticketType) {
            changeStep(0);
        }
    }, [registrationForm])

    return (
        <div id="modal" className="modal is-active">
            <div className="modal-background"></div>
            <div className="modal-content">
                <AjaxLoader relative={true} color={'#ffffff'} show={widgetLoading || loading} size={80} />
                <div className={`${styles.outerWrapper} summit-registration-lite`}>
                    <>
                        <div className={`${styles.innerWrapper}`}>
                            <div className={styles.title} >
                                <span>{summitData.name}</span>
                                <i className="fa fa-close" aria-label="close" onClick={() => rest.closeWidget()}></i>
                            </div>
                            <div className={styles.stepsWrapper}>
                                {!profileData && !passwordlessCodeSent &&
                                    <LoginComponent
                                        options={loginOptions}
                                        login={(provider) => rest.authUser(provider)}
                                        getLoginCode={getLoginCode}
                                        getPasswordlessCode={getPasswordlessCode} />
                                }
                                {!profileData && passwordlessCodeSent &&
                                    <PasswordlessLoginComponent
                                        codeLength={passwordlessCode}
                                        email={passwordlessEmail}
                                        passwordlessLogin={passwordlessLogin}
                                        loginWithCode={loginWithCode}
                                        codeError={passwordlessCodeError}
                                        goToLogin={goToLogin}
                                        getLoginCode={getLoginCode}
                                        getPasswordlessCode={getPasswordlessCode} />
                                }
                                {profileData && step !== 3 &&
                                    <>
                                        <TicketTypeComponent
                                            ticketTypes={ticketTypes}
                                            inPersonDisclaimer={inPersonDisclaimer}
                                            taxTypes={taxTypes}
                                            reservation={reservation}
                                            isActive={step === 0}
                                            changeForm={t => setRegistrationForm({ ...registrationForm, ticketType: t })}
                                        />
                                        <PersonalInfoComponent
                                            isActive={step === 1}
                                            reservation={reservation}
                                            userProfile={profileData}
                                            changeForm={personalForm => setRegistrationForm({ ...registrationForm, personalInformation: personalForm })}
                                        />
                                        {reservation?.amount !== 0 &&
                                            <PaymentComponent
                                                isActive={step === 2}
                                                reservation={reservation}
                                                getAccessToken={getAccessToken}
                                                payTicket={payTicket}
                                                userProfile={profileData}
                                                stripeKey={stripePromise}
                                            />
                                        }
                                    </>
                                }
                                {profileData && step === 3 &&
                                    <PurchaseComplete
                                        checkout={checkout}
                                        summit={summitData}
                                        onPurchaseComplete={onPurchaseComplete}
                                        supportEmail={supportEmail}
                                        goToEvent={goToEvent}
                                        goToExtraQuestions={goToExtraQuestions}
                                    />
                                }
                            </div>
                            {profileData && step !== 3 &&
                                <ButtonBarComponent
                                    step={step}
                                    registrationForm={registrationForm}
                                    removeReservedTicket={removeReservedTicket}
                                    changeStep={changeStep}
                                    getAccessToken={getAccessToken} />}
                        </div>
                    </>
                </div>
            </div>
        </div>
    );
}

const mapStateToProps = ({ widgetState }) => ({
    widgetLoading: widgetState.widgetLoading,
    reservation: widgetState.reservation,
    checkout: widgetState.checkout,
    ticketTypes: widgetState.settings.ticketTypes,
    taxTypes: widgetState.settings.taxTypes,
    step: widgetState.step,
    passwordlessEmail: widgetState.passwordless.email,
    passwordlessCode: widgetState.passwordless.otp_length,
    passwordlessCodeSent: widgetState.passwordless.code_sent,
    passwordlessCodeError: widgetState.passwordless.error
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

