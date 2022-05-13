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
import { RegistrationCompanyInput } from 'openstack-uicore-foundation/lib/components'
import { useForm } from 'react-hook-form';
import { useSpring, config, animated } from "react-spring";
import { useMeasure } from "react-use";
import ReactTooltip from 'react-tooltip';
import { capitalizeFirstLetter } from '../../helpers';

import styles from "./index.module.scss";

const PersonalInfoComponent = ({ isActive, changeForm, reservation, userProfile, summitId, handleCompanyError }) => {

    const [personalInfo, setPersonalInfo] = useState(
        {
            firstName: userProfile.given_name || '',
            lastName: userProfile.family_name || '',
            email: userProfile.email || '',
            company: { id: null, name: userProfile.company || '' },
            promoCode: '',
        }
    )

    const [companyError, setCompanyError] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm();

    useEffect(() => {
        if (reservation) {
            setPersonalInfo({
                firstName: reservation.owner_first_name ? reservation.owner_first_name : personalInfo.firstName,
                lastName: reservation.owner_last_name ? reservation.owner_last_name : personalInfo.lastName,
                email: reservation.owner_email ? reservation.owner_email : personalInfo.email,
                company: { id: null, name: reservation.owner_company ? reservation.owner_company : personalInfo.company },
            });
        }
    }, [])

    const onCompanyChange = (ev) => {
        const newCompany = ev.target.value;
        setCompanyError(false);
        setPersonalInfo({ ...personalInfo, company: newCompany });
    }

    const onSubmit = data => {
        if (!personalInfo.company.name) {
            setCompanyError(true);
            return;
        }
        setPersonalInfo({ ...personalInfo, ...data });
        changeForm({ ...personalInfo, ...data });
    };

    const [ref, { height }] = useMeasure();

    const toggleAnimation = useSpring({
        config: { bounce: 0, ...config.stiff },
        from: { opacity: 0, height: 0 },
        to: {
            opacity: 1,
            height: isActive ? height + 10 : 0,
        }
    });

    return (
        <div className={`${styles.outerWrapper} step-wrapper`}>
            <>
                <div className={`${styles.innerWrapper}`}>
                    <div className={styles.title} >
                        <span>Personal Information</span>
                        {!isActive &&
                            <div data-testid="personal-info">
                                <span>
                                    {`${personalInfo.firstName} ${personalInfo.lastName} ${personalInfo.company.name ? `- ${personalInfo.company.name}` : ''}`}
                                </span>
                                <br />
                                <span>
                                    {personalInfo.email}
                                </span>
                            </div>
                        }
                    </div>
                    <animated.div style={{ overflow: 'hidden', ...toggleAnimation }}>
                        <div ref={ref}>
                            <form id="personal-info-form" onSubmit={handleSubmit(onSubmit)} className={styles.form} data-testid="personal-form">
                                <div>
                                    <input type="text" placeholder="First name *" defaultValue={personalInfo.firstName || ''} {...register("firstName", { required: true, maxLength: 80 })} data-testid="first-name" />
                                    {errors.firstName && <span data-testid="first-name-error">This field is required</span>}
                                </div>
                                <div>
                                    <input type="text" placeholder="Last name *" defaultValue={personalInfo.lastName || ''} {...register("lastName", { required: true, maxLength: 100 })} data-testid="last-name" />
                                    {errors.lastName && <span data-testid="last-name-error">This field is required</span>}
                                </div>
                                <div>
                                    <input type="text" placeholder="Email *" className={styles.readOnly} readOnly={true} defaultValue={personalInfo.email || ''} {...register("email", { required: true, pattern: /^\S+@\S+$/i })} data-testid="email" />
                                    {errors.email?.type === 'required' && <span data-testid="email-error-required">This field is required</span>}
                                    {errors.email?.type === 'pattern' && <span data-testid="email-error-invalid">The email is invalid</span>}
                                </div>
                                <div className={styles.companies}>
                                    <RegistrationCompanyInput
                                        id="company"
                                        summitId={summitId}
                                        onChange={onCompanyChange}
                                        onError={handleCompanyError}
                                        value={personalInfo.company}
                                    />
                                    {companyError && <span data-testid="company-error">This field is required</span>}
                                </div>
                                <div>
                                    <input type="text" placeholder="Promo Code" {...register("promoCode")} />
                                </div>
                            </form>

                            {formErrors?.length > 0 && (
                                <div className={styles.formErrors}>
                                    {formErrors.map((error, index) => (
                                        <div key={index} className={`${styles.alert} alert alert-danger`} role="alert">
                                            {capitalizeFirstLetter(error)}.
                                        </div>
                                    ))}
                                </div>
                            )}

                            <a className={styles.moreInfo} data-tip data-for="promo-code-info">
                                <i className="glyphicon glyphicon-info-sign" aria-hidden="true" />{` `}
                                Have multiple promo codes?
                            </a>
                            <ReactTooltip id="promo-code-info">
                                <div className={styles.moreInfoTooltip}>In order to use multiple promo codes, you may place a new registration order with the new promo code after you complete this order. This promo code will be applied to all tickets in this order.</div>
                            </ReactTooltip>
                        </div>
                    </animated.div>
                </div>
            </>
        </div>
    );
}


export default PersonalInfoComponent

