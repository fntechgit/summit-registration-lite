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

import { useForm } from 'react-hook-form';
import { useSpring, config, animated } from "react-spring";
import { useMeasure } from "react-use";

import styles from "./index.module.scss";

const PersonalInfoComponent = ({ isActive, changeForm, reservation, userProfile }) => {

    const [personalInfo, setPersonalInfo] = useState(
        {
            firstName: userProfile.given_name || '',
            lastName: userProfile.family_name || '',
            email: userProfile.email || '',
            company: userProfile.company || '',
            promoCode: '',
        }
    )

    const { register, handleSubmit, formState: { errors } } = useForm();

    useEffect(() => {
        if (reservation) {
            setPersonalInfo({
                firstName: reservation.owner_first_name ? reservation.owner_first_name : personalInfo.firstName,
                lastName: reservation.owner_last_name ? reservation.owner_last_name : personalInfo.lastName,
                email: reservation.owner_email ? reservation.owner_email : personalInfo.email,
                company: reservation.owner_company ? reservation.owner_company : personalInfo.company,
            });
        }
    }, [])

    const onSubmit = data => {
        setPersonalInfo(data);
        changeForm(data);
    };

    const [ref, { height }] = useMeasure();

    const toggleAnimation = useSpring({
        config: { bounce: 0, ...config.stiff },
        from: { opacity: 0, height: 0 },
        to: {
            opacity: 1,
            height: isActive ? height + 10 : 0,
            marginBottom: isActive ? 5 : 0
        }
    });

    return (
        <div className={`${styles.outerWrapper} step-wrapper`}>
            <>
                <div className={`${styles.innerWrapper}`}>
                    <div className={styles.title} >
                        <span>Personal Information</span>
                        {!isActive &&
                            <div>
                                <span>
                                    {`${personalInfo.firstName} ${personalInfo.lastName} ${personalInfo.company ? `- ${personalInfo.company}` : ''}`}
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
                            <form id="personal-info-form" onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                                <div>
                                    <input type="text" placeholder="First name *" defaultValue={personalInfo.firstName || ''} {...register("firstName", { required: true, maxLength: 80 })} />
                                    {errors.firstName && <span>This field is required</span>}
                                </div>
                                <div>
                                    <input type="text" placeholder="Last name *" defaultValue={personalInfo.lastName || ''} {...register("lastName", { required: true, maxLength: 100 })} />
                                    {errors.lastName && <span>This field is required</span>}
                                </div>
                                <div>
                                    <input type="text" placeholder="Email *" defaultValue={personalInfo.email || ''} {...register("email", { required: true, pattern: /^\S+@\S+$/i })} />
                                    {errors.email?.type === 'required' && <span>This field is required</span>}
                                    {errors.email?.type === 'pattern' && <span>The email is invalid</span>}
                                </div>
                                <div>
                                    <input type="text" placeholder="Company *" defaultValue={personalInfo.company || ''} {...register("company", { required: true })} />
                                    {errors.company && <span>This field is required</span>}
                                </div>
                                <div>
                                    <input type="text" placeholder="Promo Code" {...register("promoCode")} />
                                </div>
                            </form>
                        </div>
                    </animated.div>
                </div>
            </>
        </div>
    );
}


export default PersonalInfoComponent

