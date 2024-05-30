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
import PropTypes from 'prop-types';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';

import styles from "./index.module.scss";

const LoginComponent = ({
    summitData,
    loginOptions,
    login,
    allowsNativeAuth,
    allowsOtpAuthlogin,
    getLoginCode,
    getPasswordlessCode,
    initialEmailValue,
    title }) => {

    const [email, setEmail] = useState(initialEmailValue);
    const [emailError, setEmailError] = useState();

    const isValidEmail = (email) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    const loginCode = () => {
        let isValid = isValidEmail(email);
        setEmailError(!isValid);
        if (isValid) {
            getLoginCode(email, getPasswordlessCode);
        }
    }

    return (
        <div className={`${styles.loginWrapper}`}>
            <>
                <div className={`${styles.innerWrapper}`}>
                    <div className={styles.loginCode}>
                        {summitData?.secondary_logo && <img className="login-logo" src={`${summitData?.secondary_logo}`} />}
                        <div className={styles.title}>{title}</div>
                        <div className={styles.input}>
                            <input placeholder="youremail@example.com" value={email} onChange={e => setEmail(e.target.value)}
                                   onKeyPress={(ev) => ev.key === 'Enter' ? loginCode() : null} data-testid="email-input" />
                        </div>
                        <button onClick={() => loginCode()} data-testid="email-button" disabled={!email}
                            className={`${styles.button} ${styles.primaryEmailButton}`}>
                            <EmailRoundedIcon style={{ fontSize: "20px" }} />
                            <span>Email me a single-use code</span>
                            <span></span>
                        </button>
                        {emailError && <span data-testid="email-error">Please enter a valid email address</span>}
                        <h2 className={styles.h2Styled}>or</h2>
                    </div>
                    {loginOptions.map((o, index) => {
                        return (
                            o.provider_param ?
                                <div className={`${styles.button}`} key={`provider-${o.provider_param}`} data-testid="login-button"
                                    style={{
                                        color: o.button_text_color ? o.button_text_color : '#ffffff',
                                        border: `thin solid ${o.button_border_color ? o.button_border_color : o.button_color}`,
                                        backgroundColor: o.button_color,
                                        backgroundImage: o.provider_logo ? `url(${o.provider_logo})` : 'none',
                                        backgroundSize: o.provider_logo_size ? o.provider_logo_size : '',
                                    }}
                                    onClick={() => login(o.provider_param)}>
                                    {o.provider_label}
                                </div>
                                :
                                allowsNativeAuth ?
                                    <div className={`${styles.button}`} key={`provider-fnid`} data-testid="login-button"
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
                                    :
                                    null
                        )
                    })}
                    {allowsOtpAuthlogin &&
                        <div className={styles.loginCode}>
                            or get a login code emailed to you
                            <div className={styles.input}>
                                <input placeholder="youremail@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyPress={(ev) => ev.key === 'Enter' ? loginCode() : null} data-testid="email-input" />
                                <br />
                            </div>
                            <div onClick={() => loginCode()} data-testid="email-button" className="button" style={{ background: "#000", color: "#fff"}}>
                                Email me a login code
                            </div>
                            {emailError && <span data-testid="email-error">Please enter a valid email adress</span>}
                        </div>
                    }
                </div>
            </>
        </div>
    );
}

LoginComponent.propTypes = {
    loginOptions: PropTypes.array.isRequired,
    login: PropTypes.func.isRequired,
    allowsNativeAuth: PropTypes.bool,
    allowsOtpAuthlogin: PropTypes.bool,
    getLoginCode: PropTypes.func.isRequired,
    getPasswordlessCode: PropTypes.func,
    initialEmailValue: PropTypes.string,
    title: PropTypes.string,
}

LoginComponent.defaultProps = {
    allowsNativeAuth: true,
    allowsOtpAuthlogin: false,
    initialEmailValue: '',
    title: 'Enter your email to begin registration:',
}


export default LoginComponent

