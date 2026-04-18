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
import T from 'i18n-react';
import styles from "./index.module.scss";
import { avoidTooltipOverflow, isEmptyString } from '../../utils/utils';

const PromoCodeInput = ({ label, applyPromoCode, promoCode, promoCodeVerified, promoCodeValidating, removePromoCode, showMultipleTicketTexts, onPromoCodeChange }) => {

    const [statePromoCode, setStatePromoCode] = useState(promoCode);

    const handlePromoCodeChange = (value) => {
        onPromoCodeChange(value);
        setStatePromoCode(value);
    }

    useEffect(() => {
        if (isEmptyString(promoCode)) handlePromoCodeChange(promoCode);
    }, [promoCode])

    return (
        <>
            <div className={styles.promoCodeWrapper}>
                <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{label || 'Do you have a promo code?'}</span>
                    {showMultipleTicketTexts &&
                        <a data-tip data-for="promo-code-info" className={styles.moreInfo} style={{ margin: 0 }}>
                            <i className="glyphicon glyphicon-info-sign" aria-hidden="true" />{` `}
                            Have multiple promo codes?
                        </a>
                    }
                </span>
                <div className={styles.promoCodeInput}>
                    <input className={`${promoCode ? styles.promoCodeActive : ''}`}
                        type="text"
                        value={statePromoCode}
                        onChange={(ev) => handlePromoCodeChange(ev.target.value)}
                        placeholder="Enter your promo code"
                        onKeyDown={(e) => {
                            if (e.key === "Enter")
                                applyPromoCode(statePromoCode)
                        }}
                        readOnly={!isEmptyString(promoCode)} />

                    {promoCodeValidating && <span className={`${styles.statusIcon} ${styles.spinner}`} />}
                    {!promoCodeValidating && promoCodeVerified === true && <span className={`${styles.statusIcon} ${styles.valid}`}>✓</span>}
                    {!promoCodeValidating && promoCodeVerified === false && <span className={`${styles.statusIcon} ${styles.invalid}`}>✕</span>}
                    <div className={`${styles.codeButtonWrapper} ${statePromoCode ? '' : styles.noCode}`}>
                        {promoCode !== '' ?
                            <button onClick={() => removePromoCode()}>Remove</button>
                            :
                            <button disabled={!statePromoCode} onClick={() => applyPromoCode(statePromoCode)}>Apply</button>
                        }
                    </div>
                </div>

            </div>
            <ReactTooltip id="promo-code-info" overridePosition={avoidTooltipOverflow}>
                <div className={styles.moreInfoTooltip}>
                    {T.translate("promo_code.promo_code_tooltip")}
                </div>
            </ReactTooltip>
        </>
    );
}

export default PromoCodeInput;
