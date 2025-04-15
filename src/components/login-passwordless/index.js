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
import OtpInput from 'react-otp-input';
import moment from 'moment-timezone';

import styles from "./index.module.scss";

import FNidLogo from '../../assets/FNid_WHT_logo_rgb.svg';
import FNidLogoDark from '../../assets/FNid_BLK_logo_rgb.svg';
import { handleSentryException } from '../../utils/utils';
import { RESEND_TIME } from '../../utils/constants';
import useCountdown from '../../utils/hooks/useCountdown';

const PasswordlessLoginComponent = ({
    email, codeLength, codeLifeTime, passwordlessLogin, loginWithCode, codeError, goToLogin,
    getLoginCode, getPasswordlessCode, idpLogoLight, idpLogoDark, idpLogoAlt }) => {

    const [otpCode, setOtpCode] = useState('');
    const [otpError, setOtpError] = useState(false)
    const [codeSent, setCodeSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [resendCountdown, resetResendCountdown] = useCountdown(0);
    const [lifetimeCountdown, resetLifetimeCountdown] = useCountdown(0);

    useEffect(() => {
        if(codeLifeTime > 0) {
            resetLifetimeCountdown(codeLifeTime);
        }
    }, [codeLifeTime])

    const tryPasswordlessLogin = (code) => {
        if (code.length === codeLength) {
            setOtpError(false);
            setIsLoading(true);
            passwordlessLogin(otpCode, loginWithCode).finally(() => setIsLoading(false));
        } else {
            setOtpError(true)
        }
    }

    const resendCode = () => {
        getLoginCode(email, getPasswordlessCode)
            .then(() => {
                setCodeSent(true);
                setTimeout(() => setCodeSent(false), 3000);
                resetResendCountdown(RESEND_TIME);
            })
            .catch((err) => {
                handleSentryException(err);
            });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        tryPasswordlessLogin(otpCode);
    };

    const formatDuration = (seconds) => {
        const duration = moment.duration(seconds, 'seconds');
        return moment.utc(duration.asMilliseconds()).format('mm:ss');
      };

    return (
        <div className={`${styles.passwordlessWrapper} step-wrapper`}>
            <>
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
                            <button style={{ display: 'none' }} type='submit' />
                        </form>
                    </div>
                    {codeError && (
                        <span className={styles.error} data-testid="error">
                            The code you entered it's incorrect. <br /> Please try again.
                        </span>
                    )}
                    {codeSent &&
                        <p className={styles.codeSent}>Code has been resent.</p>
                    }
                    {lifetimeCountdown > 0 &&
                        <p className={styles.codeSent}>Code expires in {formatDuration(lifetimeCountdown)} minutes.</p>
                    }
                    <div className={styles.verify}>
                        <button className={`${styles.button} button`} disabled={isLoading} onClick={() => tryPasswordlessLogin(otpCode)} data-testid="verify">Verify Email</button>
                        <b>or go back and <span className={styles.link} onClick={() => goToLogin()} data-testid="go-back">try another way</span></b>
                    </div>
                </div>
                <div className={styles.resend}>
                    Didn’t receive it? Check your spam/junk folder, or&nbsp;
                    <button
                        className={`${styles.link} ${resendCountdown > 0 ? styles.disabled : ''}`}
                        disabled={resendCountdown > 0}
                        onClick={() => resendCode()}
                        data-testid="resend">
                        resend code {' '} {resendCountdown > 0 && (<span>({resendCountdown})</span>)}
                    </button>
                    &nbsp;now.
                </div>
            </>
        </div>
    );
}

PasswordlessLoginComponent.propTypes = {
    email: PropTypes.string.isRequired,
    codeLength: PropTypes.number.isRequired,
    codeLifeTime: PropTypes.number.isRequired,
    passwordlessLogin: PropTypes.func.isRequired,
    loginWithCode: PropTypes.func,
    codeError: PropTypes.bool,
    goToLogin: PropTypes.func.isRequired,
    getLoginCode: PropTypes.func.isRequired,
    getPasswordlessCode: PropTypes.func,
    idpLogoLight: PropTypes.string,
    idpLogoDark: PropTypes.string,
    idpLogoAlt: PropTypes.string
}

export default PasswordlessLoginComponent;
