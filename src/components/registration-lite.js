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
        widgetLoading,
        loading,
        inPersonDisclaimer,
        userProfile,
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
        reserveTicket(registrationForm.personalInformation, registrationForm.ticketType)
    }

    useEffect(() => {
        loadSession({ ...rest, summitData, profileData });
        if (!profileData) {
            changeStep(0);
        }
    }, [profileData])

    useEffect(() => {
        if (summitData && profileData && ticketTypes.length == 0) {
            getTicketTypes(summitData.id).then(() => getTaxesTypes(summitData.id));
        }
    }, [ summitData, ticketTypes, taxTypes, profileData ]);

    useEffect(() => {
        if (step === 1 && registrationForm.ticketType && registrationForm.personalInformation) {
            ticketReservation();
        }
        if (step > 0 && !registrationForm.ticketType) {
            changeStep(0);
        }
    }, [registrationForm])

    const [ref, { height }] = useMeasure();

    const toggleAnimation = useSpring({
        config: { bounce: 0, ...config.stiff },
        to: {
            opacity: registrationForm.ticketType?.cost === 0 ? 0 : 1,
            height: registrationForm.ticketType?.cost === 0 ? 0 : height,
        }
    });

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
                            {ticketOwned &&
                                <div className={styles.stepsWrapper}>
                                    <TicketOwnedComponent goToRegistration={goToRegistration} />
                                </div>
                            }
                            {!ticketOwned &&
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
                                    {profileData && step !== 3 && ticketTypes.length > 0 &&
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
                            }
                            {profileData && !ticketOwned && step !== 3 &&
                                <ButtonBarComponent
                                    step={step}
                                    inPersonDisclaimer={inPersonDisclaimer}
                                    registrationForm={registrationForm}
                                    goToRegistration={goToRegistration}
                                    removeReservedTicket={removeReservedTicket}
                                    changeStep={changeStep}
                                />}
                        </div>
                    </>
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

