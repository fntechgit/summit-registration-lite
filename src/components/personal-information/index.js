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

import styles from "./index.module.scss";

const PersonalInfoComponent = ({ isActive }) => {

    const [personalInfo, setPersonalInfo] = useState(
        {
            firstName: '',
            lastName: '',
            email: '',
            company: '',
            promoCode: '',
        }
    )

    useEffect(() => {        
    }, [personalInfo])

    return (
        <div className={`${styles.outerWrapper} step-wrapper`}>
            <>
                <div className={`${styles.innerWrapper}`}>
                    <div className={styles.title} >
                        <span>Personal Information</span>
                    </div>
                    <div className={styles.form}>
                        <input
                            onChange={e => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                            value={personalInfo.firstName}
                            placeholder="First Name *"
                        />
                        <input
                            onChange={e => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
                            value={personalInfo.lastName}
                            placeholder="Last Name *"
                        />
                        <input
                            onChange={e => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                            value={personalInfo.email}
                            placeholder="Email *"
                        />
                        <input
                            onChange={e => setPersonalInfo({ ...personalInfo, company: e.target.value })}
                            value={personalInfo.company}
                            placeholder="Company *"
                        />
                        <input
                            onChange={e => setPersonalInfo({ ...personalInfo, promoCode: e.target.value })}
                            value={personalInfo.promoCode}
                            placeholder="Promo Code (optional)"
                        />
                    </div>
                </div>
            </>
        </div>
    );
}


export default PersonalInfoComponent

