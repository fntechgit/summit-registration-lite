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

import React, { useState, useEffect, useMemo } from 'react';
import ReactTooltip from 'react-tooltip';
import T from 'i18n-react';
import styles from "./index.module.scss";
import { avoidTooltipOverflow } from '../../utils/utils';
import { PROMO_STATUS } from '../../utils/constants';

const PromoCodeInput = ({ promoStatus, promoCode, suggestedCode, wasAutoApplied, onApply, onRemove, onInputChange, showMultipleTicketTexts }) => {

    const [userTypedValue, setUserTypedValue] = useState('');

    useEffect(() => {
        if (!promoCode) setUserTypedValue('');
    }, [promoCode]);

    const isApplied = promoStatus === PROMO_STATUS.APPLYING || promoStatus === PROMO_STATUS.VALIDATING
        || promoStatus === PROMO_STATUS.VALID || promoStatus === PROMO_STATUS.INVALID;

    const inputValue = useMemo(() => {
        if (promoCode) return promoCode;
        if (promoStatus === PROMO_STATUS.SUGGESTED) return suggestedCode || '';
        return userTypedValue;
    }, [promoCode, promoStatus, suggestedCode, userTypedValue]);

    const label = useMemo(() => {
        switch (promoStatus) {
            case PROMO_STATUS.VALID:
                if (wasAutoApplied) return T.translate('promo_code.auto_applied_label');
                return T.translate('promo_code.applied_label');
            case PROMO_STATUS.APPLYING:
            case PROMO_STATUS.VALIDATING:
                if (wasAutoApplied) return T.translate('promo_code.auto_applied_label');
                return T.translate('promo_code.applied_label');
            case PROMO_STATUS.INVALID:
                return undefined;
            case PROMO_STATUS.SUGGESTED:
                return T.translate('promo_code.suggestion_label');
            default:
                return undefined;
        }
    }, [promoStatus, wasAutoApplied]);

    const canApply = !isApplied && !!inputValue;

    const handleInputChange = (value) => {
        setUserTypedValue(value);
        onInputChange(value);
    };

    return (
        <>
            <div className={styles.promoCodeWrapper}>
                <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{label || T.translate('promo_code.default_label')}</span>
                    {showMultipleTicketTexts &&
                        <a data-tip data-for="promo-code-info" className={styles.moreInfo} style={{ margin: 0 }}>
                            <i className="glyphicon glyphicon-info-sign" aria-hidden="true" />{` `}
                            Have multiple promo codes?
                        </a>
                    }
                </span>
                <div className={styles.promoCodeInput}>
                    <input className={`${isApplied ? styles.promoCodeActive : ''}`}
                        type="text"
                        value={inputValue}
                        onChange={(ev) => handleInputChange(ev.target.value)}
                        placeholder="Enter your promo code"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && canApply) onApply(inputValue)
                        }}
                        readOnly={isApplied} />

                    {promoStatus === PROMO_STATUS.VALIDATING && <span className={`${styles.statusIcon} ${styles.spinner}`} />}
                    {(promoStatus === PROMO_STATUS.VALID || promoStatus === PROMO_STATUS.APPLYING) && <span className={`${styles.statusIcon} ${styles.valid}`}>✓</span>}
                    {promoStatus === PROMO_STATUS.INVALID && <span className={`${styles.statusIcon} ${styles.invalid}`}>✕</span>}
                    <div className={`${styles.codeButtonWrapper} ${inputValue ? '' : styles.noCode}`}>
                        {isApplied ?
                            <button onClick={onRemove}>Remove</button>
                            :
                            <button disabled={!canApply} onClick={() => onApply(inputValue)}>Apply</button>
                        }
                    </div>
                </div>

            </div>
            <ReactTooltip id="promo-code-info" place="bottom" overridePosition={avoidTooltipOverflow}>
                <div className={styles.moreInfoTooltip}>
                    {T.translate("promo_code.promo_code_tooltip")}
                </div>
            </ReactTooltip>
        </>
    );
}

export default PromoCodeInput;
