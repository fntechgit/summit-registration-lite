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

import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

import styles from "./index.module.scss";

const PasswordlessLoginComponent = ({ email, codeLength, passwordlessLogin, loginWithCode, codeError, goToLogin }) => {

    const [code, setCode] = useState(Array(codeLength).fill(''));

    const inputRef = useRef([]);

    useState(() => {
        console.log('reset code', codeError)
        setCode(Array(codeLength).fill(''));
    }, [codeError])

    const changeCode = (ev, index) => {
        const newCode = [...code];
        newCode[index] = ev.target.value;
        setCode(newCode);
        if (index !== codeLength - 1) {
            inputRef.current[index + 1].focus();
        }
    }

    const tryPasswordlessLogin = (code) => {
        if (code.length === codeLength) {
            const stringCode = code.join('').toUpperCase();
            passwordlessLogin(stringCode, loginWithCode)
        }
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
                            Add the {code.length} digit code below
                        </span>
                    </span>
                    <div className={styles.codeInput}>
                        {code.map((digit, index) => {
                            return (
                                <input ref={el => inputRef.current[index] = el} value={digit} maxLength="1" onChange={e => changeCode(e, index)} key={`digit${index}`} autoComplete="off" />
                            )
                        })}
                    </div>
                    {codeError && (
                        <span className={styles.error}>
                            The code you entered it's incorrect. <br/> Please try again.
                        </span>
                    )}
                    <div className={styles.verify}>
                        <div className={styles.button} onClick={() => tryPasswordlessLogin(code)}>Verify</div>
                        <b>or go back and <span className={styles.link} onClick={() => goToLogin()}>try another way</span></b>
                    </div>
                </div>
                <div className={styles.resend}>
                    Didn't receive it? Check your spam folder or <span className={styles.link}>resend email</span>.
                </div>
            </>
        </div>
    );
}


export default PasswordlessLoginComponent

