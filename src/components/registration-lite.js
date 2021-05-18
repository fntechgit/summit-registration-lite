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

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { loadSession, setMarketingSettings } from "../actions";

import styles from "../styles/general.module.scss";
import 'openstack-uicore-foundation/lib/css/components.css';
import '../styles/styles.scss';

import LoginComponent from './login';
import PaymentComponent from './payment';
import PersonalInfoComponent from './personal-information';
import TicketTypeComponent from './ticket-type';
import ButtonBarComponent from './button-bar';

const RegistrationLite = ({ loadSession, setMarketingSettings, profile, summit, ticketTypes, settings, widgetLoading, ...rest }) => {

    const [step, setStep] = useState(0);

    const [registrationForm, setRegistrationForm] = useState(
        {
            ticketType: null,
            personalInformation: null,
            paymentInformation: null,
        }
    );

    useEffect(() => {
        loadSession(rest).then(() => {
            setMarketingSettings();
        });
    }, [])

    return (
        <div id="modal" className="modal is-active">
            <div className="modal-background"></div>
            <div className="modal-content">
                <div className={`${styles.outerWrapper} registration-lite-widget`}>
                    <>
                        <div className={`${styles.innerWrapper}`}>
                            <div className={styles.title} >
                                <i className="fa fa-close" aria-label="close"></i>
                            </div>
                            <div className={styles.stepsWrapper}>
                                {!profile &&
                                    <LoginComponent />
                                }
                                {profile &&
                                    <>
                                        <TicketTypeComponent ticketTypes={ticketTypes} isActive={step === 0} />
                                        <PersonalInfoComponent isActive={step === 1} />
                                        <PaymentComponent isActive={step === 2} />
                                    </>
                                }
                            </div>
                            <ButtonBarComponent step={step} registrationForm={registrationForm} />
                        </div>
                    </>
                </div>
            </div>
        </div>
    );
}

const mapStateToProps = (registrationReducer) => {
    return {
        ...registrationReducer
    }
}

export default connect(mapStateToProps, {
    loadSession,
    setMarketingSettings
})(RegistrationLite)

