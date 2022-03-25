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

import React, { useState } from 'react';

import styles from "./index.module.scss";

const LoginComponent = ({ options, login, getLoginCode, getPasswordlessCode }) => {

    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState();

    const isValidEmail= (email) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    const loginCode = () => {
        let isValid = isValidEmail(email);
        setEmailError(!isValid);
        if (isValid) {
            getLoginCode(email, getPasswordlessCode)
        }
    }

    return (
        <div className={`${styles.loginWrapper} step-wrapper`}>
            <>
                <div className={`${styles.innerWrapper}`}>
                    <div className={styles.loginCode}>
                        Enter your email address to login or signup: 
                        <div className={styles.input}>
                            <input placeholder="youremail@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyPress={(ev) => ev.key === 'Enter' ? loginCode() : null} data-testid="email-input" />
                            <button onClick={() => loginCode()} data-testid="email-button">
                                &gt;
                            </button>
                            <br />
                        </div>
                        {emailError && <span data-testid="email-error">Please enter a valid email adress</span>}
                    </div>
                    <span>Or you may signup or login with a social provider:</span>
                    {options.map((o, index) => {
                        return (
                            <div className={`${styles.button}`} key={`provider-${o.provider_param ? o.provider_param : 'fnid'}`} data-testid="login-button"
                                style={{
                                    color: o.button_border_color ? o.button_border_color : '#ffffff',
                                    border: `thin solid ${o.button_border_color ? o.button_border_color : o.button_color}`,
                                    backgroundColor: o.button_color,
                                    backgroundImage: o.provider_logo ? `url(${o.provider_logo})` : 'none',
                                    backgroundSize: o.provider_logo_size ? o.provider_logo_size : ''
                                }}
                                onClick={() => login(o.provider_param)}>
                                {o.provider_label}
                            </div>
                        )
                    })}
                </div>
            </>
        </div>
    );
}


export default LoginComponent

