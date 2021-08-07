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

import React from 'react';
import styles from "./index.module.scss";


const TicketOwnedComponent = ({ goToRegistration }) => {

    return (
        <div className={`${styles.wrapper}`}>
            <>
                <div className={styles.circle}>
                    <i className="fa fa-ticket"></i>
                </div>
                <span className={styles.complete}>
                    Our records show you have a ticket(s) to this event. If you would like to purchase more, <a onClick={() => goToRegistration()}>click here</a>.
                </span>
            </>
        </div>
    );
}


export default TicketOwnedComponent


