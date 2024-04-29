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
import { isInPersonTicketType } from "../../actions";
import { STEP_COMPLETE, STEP_PAYMENT, STEP_PERSONAL_INFO, STEP_SELECT_TICKET_TYPE } from '../../utils/constants';

const ButtonBarComponent = ({ step, changeStep, validatePromoCode, onValidateError, formValues, removeReservedTicket, inPersonDisclaimer }) => {
    const { ticketType, ticketQuantity, promoCode } = formValues || {};

    const nextButtonText = inPersonDisclaimer && ticketType && isInPersonTicketType(ticketType) ? 'Accept' : 'Next';

    return (
        <div className={`${styles.outerWrapper}`}>
            {step !== STEP_COMPLETE &&
                <>
                    <div className={`${styles.innerWrapper}`}>
                        <div className={styles.required}>
                            {step !== STEP_SELECT_TICKET_TYPE && <span>* Required fields <br /> </span>}
                        </div>
                        <div className={styles.actions}>
                            {/* Back Button */}
                            {step !== STEP_SELECT_TICKET_TYPE && step !== STEP_PAYMENT && <button className={`${styles.button} button`} onClick={() => changeStep(step - 1)}>&lt; Back</button>}
                            {step !== STEP_SELECT_TICKET_TYPE && step === STEP_PAYMENT && <button className={`${styles.button} button`} onClick={() => removeReservedTicket()}>&lt; Back</button>}
                            {/* Next Button */}
                            {step === STEP_SELECT_TICKET_TYPE && <button disabled={!ticketType} className={`${styles.button} button`} onClick={() => validatePromoCode({ ...ticketType, ticketQuantity, promoCode }, onValidateError)}>{nextButtonText}</button>}
                            {step === STEP_PERSONAL_INFO && ticketType?.cost === 0 && <button className={`${styles.button} button`} type="submit" form="personal-info-form">Get Ticket</button>}
                            {step === STEP_PERSONAL_INFO && ticketType?.cost > 0 && <button className={`${styles.button} button`} type="submit" form="personal-info-form">Next</button>}
                            {step === STEP_PAYMENT && <button className={`${styles.button} button`} id="payment-form-btn" type="submit" form="payment-form">Pay Now</button>}
                        </div>
                    </div>
                </>
            }
        </div>
    );
}

export default ButtonBarComponent;

