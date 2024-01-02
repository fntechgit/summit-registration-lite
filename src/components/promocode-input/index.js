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
import ReactTooltip from 'react-tooltip';
import PropTypes from 'prop-types';

import appliedCode from '../../assets/icon-check-circle.svg';

import styles from "./index.module.scss";

const PromoCodeInput = ({ applyPromoCode, hasDiscount, promoCodeLoader, promoCode, removePromoCode, showMultipleTicketTexts }) => {

    const [statePromoCode, setStatePromoCode] = useState(promoCode);

    useEffect(() => {
        if (!promoCode) setStatePromoCode('');
    }, [promoCode])

    const handleInputSubmit = (ev) => {
        ev.preventDefault()
        return hasDiscount ? removePromoCode() : applyPromoCode(statePromoCode)
    }

    return (
        <>
            <form onSubmit={handleInputSubmit}>
                <fieldset disabled={promoCodeLoader}>
                    <div className={styles.promoCodeWrapper}>
                        <span>Do you have a promo code?</span>

                        <div className={styles.promoCodeInput}>
                            <input className={`${promoCode ? styles.promoCodeActive : ''}`} type="text" value={statePromoCode} onChange={(ev) => setStatePromoCode(ev.target.value)} placeholder="Enter your promo code" />
                            {hasDiscount ?
                                <div className={styles.appliedCode}>
                                    <img src={appliedCode} className={styles.appliedCodeIcon} />
                                    <button onClick={() => removePromoCode()}>Remove</button>
                                </div>
                                :
                                <button onClick={() => applyPromoCode(statePromoCode)}>Apply</button>
                            }
                        </div>

                        {showMultipleTicketTexts &&
                            <a className={styles.moreInfo} data-tip data-for="promo-code-info">
                                <i className="glyphicon glyphicon-info-sign" aria-hidden="true" />{` `}
                                Have multiple promo codes?
                            </a>
                        }
                    </div>
                </fieldset>
                <ReactTooltip id="promo-code-info">
                    <div className={styles.moreInfoTooltip}>
                        Promo code will be applied to all tickets in this order.  If you wish to utilize more than one promo code, simply place another order after you complete this registration order. Only one promo code can be applied per order.
                    </div>
                </ReactTooltip>
            </form>
        </>
    );
}

export default PromoCodeInput;