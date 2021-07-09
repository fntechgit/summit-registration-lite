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

const PasswordlessLoginComponent = ({ email, codeLength, passwordlessLogin, loginWithCode, codeError, goToLogin, getLoginCode, getPasswordlessCode }) => {

    const [otpCode, setOtpCode] = useState('');
    const [otpError, setOtpError] = useState(false)

    const tryPasswordlessLogin = (code) => {
        if (code.length === codeLength) {
            setOtpError(false)
            passwordlessLogin(otpCode, loginWithCode)
        } else {
            setOtpError(true)
        }
    }

    const resendCode = () => {
        getLoginCode(email, getPasswordlessCode);
    }

    return (
        <div className={`${styles.passwordlessWrapper} step-wrapper`}>
            <>
                <div className={`${styles.innerWrapper}`}>
                    <span>
                        We've sent a code to the email <br />
                        {email}
                        <br />
                        <span className={styles.digits}>
                            Add the {codeLength} digit code below
                        </span>
                    </span>
                    <div className={styles.codeInput}>
                        <OtpInput
                            value={otpCode}
                            onChange={(code) => setOtpCode(code)}
                            numInputs={codeLength}
                            shouldAutoFocus={true}
                            hasErrored={otpError}
                            errorStyle={{ border: '1px solid #e5424d' }}
                        />
                    </div>
                    {codeError && (
                        <span className={styles.error}>
                            The code you entered it's incorrect. <br /> Please try again.
                        </span>
                    )}
                    <div className={styles.verify}>
                        <div className={styles.button} onClick={() => tryPasswordlessLogin(otpCode)}>Verify</div>
                        <b>or go back and <span className={styles.link} onClick={() => goToLogin()}>try another way</span></b>
                    </div>
                </div>
                <div className={styles.resend}>
                    Didn't receive it? Check your spam folder or <span className={styles.link} onClick={() => resendCode()}>resend email</span>.
                </div>
            </>
        </div>
    );
}


export default PasswordlessLoginComponent

