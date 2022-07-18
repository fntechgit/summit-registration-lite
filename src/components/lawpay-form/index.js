/**
 * Copyright 2022 OpenStack Foundation
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

import React, { useEffect, useState } from 'react';
import { connect } from "react-redux";

import { Dropdown } from 'openstack-uicore-foundation/lib/components'

import Swal from 'sweetalert2';

import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";

import styles from "./index.module.scss";

const LawPayForm = ({ reservation, payTicket, userProfile, marketingData, providerKey, provider, timestamp }) => {

    const [hostedFields, setHostedFields] = useState(null);

    const [lawPayFields, setLawPayFields] = useState({
        exp_month: '',
        exp_year: '',
        postal_code: userProfile.postal_code || '',
        address1: userProfile.address1 || ''
    });

    const [lawPayErrors, setLawPayErrors] = useState({
        exp_month: '',
        exp_year: '',
        postal_code: '',
        credit_card_number: '',
        cvv: '',
        address1: '',
    });

    const style = {
        color: marketingData.color_text_dark,
        "font-size": '16px',
        "font-weight": 'inherit',
        '::placeholder': {
            color: marketingData.color_text_input_hints
        }
    }

    const hostedFieldsConfiguration = {
        publicKey: `${providerKey}`,
        fields: [
            {
                selector: "#my_credit_card_field_id",
                input: {
                    type: "credit_card_number",
                    placeholder: "Credit Card Number",
                    css: style
                }
            },
            {
                selector: "#my_cvv_field_id",
                input: {
                    type: "cvv",
                    placeholder: "CCV",
                    css: style
                }
            }
        ]
    };

    const hostedFieldsCallBack = (state) => {
        let fieldErrors = {};
        state.fields.map(f => {
            if (f.focus && f.error !== 'Input field is empty')
                fieldErrors = { ...fieldErrors, [f.type]: f.error };
        });
        setLawPayErrors({ ...lawPayErrors, ...fieldErrors });
    };

    useEffect(() => {
        if (window.AffiniPay && !hostedFields) {
            setHostedFields(window.AffiniPay.HostedFields.initializeFields(
                hostedFieldsConfiguration,
                hostedFieldsCallBack
            ));
        }
    }, [reservation])

    const onExpireChange = (ev) => {
        setLawPayFields({ ...lawPayFields, [ev.target.id]: ev.target.value });
    }

    const formHasErrors = () => {
        let errors = {};

        Object.keys(lawPayFields).map((key) => {
            if (!lawPayFields[key] || lawPayFields[key] === '') {
                errors = { ...errors, [key]: 'This field is required.' };
            }
        });

        setLawPayErrors({ ...lawPayErrors, ...errors });
        return Object.keys(errors).length > 0;
    }

    const onSubmit = async (event) => {
        event.preventDefault();

        if (!hostedFields) {
            // Affinity Pay has not loaded yet. Make sure to disable
            // form submission until Affinity Pay has loaded.
            return;
        }

        if (!formHasErrors()) {
            try {
                const token = await hostedFields.getPaymentToken({
                    "postal_code": lawPayFields.postal_code,
                    "address1": lawPayFields.address1,
                    "exp_year": lawPayFields.exp_year,
                    "exp_month": lawPayFields.exp_month,
                    "email": userProfile.email,
                    "name": `${reservation.owner_first_name} ${reservation.owner_last_name}`,
                    "reference": `summit_${reservation.summit_id}_order_${reservation.id}`,
                });
                payTicket(provider, { token });
            } catch (error) {
                Swal.fire("Payment error", error.message, "warning");
            }
        }
    };

    const ddl_month = [
        { label: '1 - January', value: '01' },
        { label: '2 - February', value: '02' },
        { label: '3 - March', value: '03' },
        { label: '4 - April', value: '04' },
        { label: '5 - May', value: '05' },
        { label: '6 - June', value: '06' },
        { label: '7 - July', value: '07' },
        { label: '8 - August', value: '08' },
        { label: '9 - September', value: '09' },
        { label: '10 - October', value: '10' },
        { label: '11 - November', value: '11' },
        { label: '12 - December', value: '12' }
    ]

    const current_year = epochToMomentTimeZone(timestamp, 'utc').year();

    const year_ddl = Array.from({ length: 15 }, (_, i) => {
        return { label: `${current_year + i}`, value: `${current_year + i}` }
    });

    const customStyles = {
        option: (provided, { isFocused, isSelected }) => {
            return {
                ...provided,
                backgroundColor: isFocused ?
                    'var(--color-primary)'
                    : isSelected ?
                        'var(--color-primary)'
                        : undefined,
                color: 'var(--color_text_dark)',
                ':active': {
                    ...provided[':active'],
                    backgroundColor: isSelected
                        ? 'var(--color-primary)'
                        : undefined,
                },
            }
        },
        menu: (provided, state) => ({
            ...provided,
            color: 'var(--color_text_dark)',
            zIndex: '100',
        }),
        singleValue: (provided, state) => {
            const opacity = state.isDisabled ? 0.5 : 1;
            const transition = 'opacity 300ms';
            const color = 'var(--color_text_dark)';

            return { ...provided, opacity, transition, color };
        }
    }

    return (
        <form className={styles.form} id="payment-form" onSubmit={onSubmit}>
            <div className={styles.fieldWrapper}>
                <div className={styles.inputWrapper}>
                    <div id="my_credit_card_field_id" className={styles.lawpayWrapper}></div>
                    <i className="fa fa-credit-card" />
                </div>
                {lawPayErrors.credit_card_number && <div className={styles.fieldError}>{lawPayErrors.credit_card_number}</div>}
            </div>
            <div className={styles.fieldWrapper}>
                <div className={styles.dateWrapper}>
                    <div>
                        <Dropdown styles={customStyles} className={styles.dropdown} placeholder="Month" onChange={onExpireChange} id="exp_month" options={ddl_month} />
                        {lawPayErrors.exp_month && <div className={styles.fieldError}>{lawPayErrors.exp_month}</div>}
                    </div>
                    <div>
                        <Dropdown styles={customStyles} className={styles.dropdown} placeholder="Year" onChange={onExpireChange} id="exp_year" options={year_ddl} />
                        {lawPayErrors.exp_year && <div className={styles.fieldError}>{lawPayErrors.exp_year}</div>}
                    </div>
                </div>
            </div>
            <div className={styles.fieldWrapper}>
                <div className={styles.fieldRow}>
                    <div className={styles.inputWrapper}>
                        <div id="my_cvv_field_id" className={styles.lawpayWrapper}></div>
                    </div>
                    <div className={styles.inputWrapper}>
                        <input type="text"
                            name="postal_code"
                            placeholder="ZIP Code *"
                            value={lawPayFields.postal_code}
                            onChange={(e) => setLawPayFields({ ...lawPayFields, postal_code: e.target.value })} />
                    </div>
                </div>
                <div className={styles.fieldRow}>
                    {lawPayErrors.cvv && <div className={styles.fieldError}>{lawPayErrors.cvv}</div>}
                    {lawPayErrors.postal_code && <div className={styles.fieldError}>{lawPayErrors.postal_code}</div>}
                </div>
            </div>
            <div className={styles.fieldWrapper}>
                <div className={`${styles.inputWrapper} ${styles.addressField}`}>
                    <input type="text"
                        name="address1"
                        placeholder="Address *"
                        value={lawPayFields.address1}
                        onChange={(e) => setLawPayFields({ ...lawPayFields, address1: e.target.value })} />
                </div>
                {lawPayErrors.address1 && <div className={styles.fieldError}>{lawPayErrors.address1}</div>}
            </div>
        </form>
    )
};

const mapStateToProps = ({ registrationLiteState }) => ({
    marketingData: registrationLiteState.settings.marketingData
});

export default connect(mapStateToProps, null)(LawPayForm);
