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
import OtpInput from 'react-otp-input';

import styles from "./index.module.scss";

import FNidLogo from '../../assets/FNid_WHT_logo_rgb.svg';
import FNidLogoDark from '../../assets/FNid_BLK_logo_rgb.svg';

const PasswordlessLoginComponent = ({
        email, codeLength, passwordlessLogin, loginWithCode, codeError, goToLogin,
        getLoginCode, getPasswordlessCode, idpLogoLight, idpLogoDark, idpLogoAlt }) => {

    const [otpCode, setOtpCode] = useState('');
    const [otpError, setOtpError] = useState(false)
    const [codeSent, setCodeSent] = useState(false);

    const tryPasswordlessLogin = (code) => {
        if (code.length === codeLength) {
            setOtpError(false)
            passwordlessLogin(otpCode, loginWithCode)
        } else {
            setOtpError(true)
        }
    }

    const resendCode = () => {
        getLoginCode(email, getPasswordlessCode)
            .then(() => {
                setCodeSent(true);
                setTimeout(() => setCodeSent(false), 3000);
            });
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        tryPasswordlessLogin(otpCode);
    };

    return (
        <div className={`${styles.passwordlessWrapper} step-wrapper`}>
            <>
                {codeSent &&
                <div className={styles.codeSent}>Code has been resent.</div>
                }
                <div className={`${styles.innerWrapper}`}>
                    {/* Only one logo is displayed based on data-theme through CSS */}
                    <img src={idpLogoDark || FNidLogoDark} alt={idpLogoAlt || "FNid"} className={`${styles.logo} ${styles.logoDark}`} />
                    <img src={idpLogoLight || FNidLogo} alt={idpLogoAlt || "FNid"} className={`${styles.logo} ${styles.logoLight}`} />
                    <span>
                        We sent your single-use code to <br />
                        <span data-testid="email">{email}</span>
                        <br />
                        <span className={styles.digits} data-testid="code-digits">
                            Add the {codeLength} digit code below
                        </span>
                    </span>
                    <div className={styles.codeInput}>
                        <form onSubmit={handleSubmit}>
                            <OtpInput
                                value={otpCode}
                                onChange={(code) => setOtpCode(code)}
                                numInputs={codeLength}
                                shouldAutoFocus={true}
                                hasErrored={otpError || codeError}
                                errorStyle={{ border: '1px solid #e5424d' }}
                                data-testid="otp-input"
                            />
                            {/*
                                this is to simulate the on key press submit (enter)
                                @see https://github.com/devfolioco/react-otp-input/issues/98
                            */}
                            <button style={{display:'none'}} type='submit' />
                        </form>
                    </div>
                    {codeError && (
                        <span className={styles.error} data-testid="error">
                            The code you entered it's incorrect. <br /> Please try again.
                        </span>
                    )}
                    <div className={styles.verify}>
                        <div className={`${styles.button} button`} onClick={() => tryPasswordlessLogin(otpCode)} data-testid="verify">Verify Email</div>
                        <b>or go back and <span className={styles.link} onClick={() => goToLogin()} data-testid="go-back">try another way</span></b>
                    </div>
                </div>
                <div className={styles.resend}>
                    Didn’t receive it? Check your spam/junk folder, or <span className={styles.link} onClick={() => resendCode()} data-testid="resend">resend code</span> now.
                </div>
            </>
        </div>
    );
}

PasswordlessLoginComponent.propTypes = {
    email: PropTypes.string.isRequired,
    codeLength: PropTypes.number.isRequired,
    passwordlessLogin: PropTypes.func.isRequired,
    loginWithCode: PropTypes.func,
    codeError: PropTypes.bool,
    goToLogin: PropTypes.func.isRequired,
    getLoginCode: PropTypes.func.isRequired,
    getPasswordlessCode: PropTypes.func,
    idpLogoLight: PropTypes.string,
    idpLogoDark: PropTypes.string,
    idpLogoAlt: PropTypes.string.isRequired
}

export default PasswordlessLoginComponent;
