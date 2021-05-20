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
import { connect } from "react-redux";

import { changeStep } from '../../actions';

import styles from "./index.module.scss";

const ButtonBarComponent = ({ step }) => {

    return (
        <div className={`${styles.outerWrapper}`}>
            <>
                <div className={`${styles.innerWrapper}`}>
                    <div className={styles.required} >
                        <span>* Required fields</span>
                    </div>
                    <div className={styles.buttons} >
                        <button className="button">&lt; Back</button>
                        <button className="button">Save and Continue</button>
                    </div>
                </div>
            </>
        </div>
    );
}

export default connect(null, { changeStep })(ButtonBarComponent)

