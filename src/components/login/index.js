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

const LoginComponent = ({ options, login }) => {

    return (
        <div className={`${styles.loginWrapper} step-wrapper`}>
            <>
                <div className={`${styles.innerWrapper}`}>
                    <span>Log in with one of the following</span>
                    {options.map(o => {
                        return (
                            <div className={styles.button} key={o.provider_param}
                                style={{ backgroundColor: o.button_color }}
                                onClick={() => login(o.provider_param)}>
                                {o.provider_label}
                            </div>
                        )
                    })}
                    <div className={styles.loginCode}>
                        or get a login code emailed to you
                        <div className={styles.input}>
                            <input placeholder="youremail@example.com" />
                            <div>
                                &gt;
                            </div>
                        </div>
                    </div>
                </div>
            </>
        </div>
    );
}


export default LoginComponent

