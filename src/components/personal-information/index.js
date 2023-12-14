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
import { RegistrationCompanyInput, RadioList } from 'openstack-uicore-foundation/lib/components'
import { useForm } from 'react-hook-form';
import { useSpring, config, animated } from "react-spring";
import { useMeasure } from "react-use";
import ReactTooltip from 'react-tooltip';
import { formatErrorMessage } from '../../helpers';

import styles from "./index.module.scss";
import { EMAIL_REGEXP, TICKET_OWNER_MYSELF, TICKET_OWNER_SOMEONE, TICKET_OWNER_UNASSIGNED } from '../../utils/constants';

const PersonalInfoComponent = ({
    isActive,
    changeForm,
    reservation,
    userProfile,
    summitId,
    handleCompanyError,
    formValues,
    formErrors = {},
    invitation,
    showMultipleTicketTexts,
    allowPromoCodes,
    showCompanyInput = true,
    companyDDLPlaceholder,
    showCompanyInputDefaultOptions,
    companyDDLOptions2Show
}) => {

    const initialFirstName = userProfile.given_name || (invitation ? invitation.first_name : '');
    const initialLastName = userProfile.family_name || (invitation ? invitation.last_name : '');

    const [ticketOwnerOption, setTicketOwnerOption] = useState('');
    const [ticketOwnerError, setTicketOwnerError] = useState(false);

    // if there's only one ticket on the order and there is no invitation available, display the radio button to assign the ticket
    const shouldDisplayTicketAssignment = () => formValues.ticketQuantity === 1 && !invitation;

    const radioListOptions = [
        {label: "Myself", value: TICKET_OWNER_MYSELF},
        {label: "Someone Else", value: TICKET_OWNER_SOMEONE},
        {label: "Leave Unassigned", value: TICKET_OWNER_UNASSIGNED},
    ]

    const [personalInfo, setPersonalInfo] = useState(
        {
            firstName: initialFirstName,
            lastName: initialLastName,
            email: userProfile.email || '',
            company: { id: null, name: '' },
            promoCode: '',
            attendee: {
                firstName: '',
                lastName: '',
                email: ''
            }
        }
    );

    const [companyError, setCompanyError] = useState(false);

    const { register, reset, handleSubmit, getValues, formState: { errors } } = useForm();

    console.log('errors', errors);

    useEffect(() => {
        if (reservation) {
            setPersonalInfo({
                firstName: reservation.owner_first_name ? reservation.owner_first_name : personalInfo.firstName,
                lastName: reservation.owner_last_name ? reservation.owner_last_name : personalInfo.lastName,
                email: reservation.owner_email ? reservation.owner_email : personalInfo.email,
                company: { id: null, name: reservation.owner_company ? reservation.owner_company : personalInfo.company },
            });
        }
    }, []);

    const onCompanyChange = (ev) => {
        const newCompany = ev.target.value;
        console.log("RegistrationLite::onCompanyChange", newCompany);
        setCompanyError(false);
        setPersonalInfo({ ...personalInfo, company: newCompany });
    };

    const onSubmit = (data) => {
        console.log('DATA', data);
        if (!personalInfo.company.name && showCompanyInput) {
            setCompanyError(true);
            return;
        }

        if(shouldDisplayTicketAssignment()) {
            if (!ticketOwnerOption) {
                setTicketOwnerError(true);
                return;
            }
            // if the ticket is for someone else, set the attende with the data from form
            const attendeeData = ticketOwnerOption === TICKET_OWNER_SOMEONE ? data.attendee : personalInfo.attendee;
            data = {...data , attendee: attendeeData };
        }

        setPersonalInfo({ ...personalInfo, ...data});
        changeForm({ ...personalInfo, ...data });
    };

    const handleRadioButtonChange = (ev) => {
        const {value} = ev.target;
        setTicketOwnerOption(value);
        setTicketOwnerError(false);
        setPersonalInfo({
            ...personalInfo,
            attendee: value === TICKET_OWNER_UNASSIGNED ? null :
                      value === TICKET_OWNER_MYSELF ?
                        { firstName: personalInfo.firstName, lastName: personalInfo.lastName, email: personalInfo.email }
                        :
                        { firstName: '', lastName: '', email: '' }
        });
        reset({
            attendee: {
                email: '',
                firstName: '',
                lastName: '',
            },
        });
    }

    const [ref, { height }] = useMeasure();

    const toggleAnimation = useSpring({
        config: { bounce: 0, ...config.stiff },
        from: { opacity: 0, height: 0 },
        to: {
            opacity: 1,
            height: isActive ? height + 10 : 0,
        }
    });

    const customStyles = {
        control: (provided) => ({
            ...provided,
            minHeight: '36px',
            height: '36px',
        }),
        menuList: (provided) => ({
            ...provided,
            maxHeight: '120px',
        }),
        placeholder: (provided) => ({
            ...provided,
            fontSize: '12px',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            width: '95%',
            paddingRight: '10px',
        }),
    }

    return (
        <div className={`${styles.outerWrapper} step-wrapper`}>
            <>
                <div className={`${styles.innerWrapper}`}>
                    <div className={styles.title} >
                        <span>Purchaser Information</span>
                        {!isActive &&
                            <div data-testid="personal-info">
                                <span>
                                    {`${personalInfo.firstName} ${personalInfo.lastName}${personalInfo.company.name ? ` - ${personalInfo.company.name}` : ''}`}
                                </span>
                                <br />
                                <span>
                                    {personalInfo.email}
                                </span>
                            </div>
                        }
                    </div>
                    <animated.div style={{ overflow: `${isActive ? '' : 'hidden'}`, ...toggleAnimation }}>
                        <div ref={ref}>
                            {formValues.ticketQuantity > 1 && (
                                <div className={`${styles.ticketQuantityNotice} alert alert-info`}>
                                    If this is your first order please note that 1 ticket from this order will be automatically assigned to you; the rest will remain unassigned, with the option to re-assign all tickets after purchase.
                                </div>
                            )}

                            <form id="personal-info-form" onSubmit={handleSubmit(onSubmit)} className={styles.form} data-testid="personal-form">
                                <div className={styles.fieldWrapper}>
                                    <div className={styles.inputWrapper}>
                                        <input type="text" placeholder="First name *" defaultValue={personalInfo.firstName || ''}
                                               readOnly={initialFirstName !== ''}
                                               className={initialFirstName !== '' ? styles.readOnly : ''}
                                               {...register("firstName", { required: true, maxLength: 80 })} data-testid="first-name" />
                                    </div>
                                    {errors.firstName && <div className={styles.fieldError} data-testid="first-name-error">This field is required.</div>}
                                </div>

                                <div className={styles.fieldWrapper}>
                                    <div className={styles.inputWrapper}>
                                        <input type="text" placeholder="Last name *" defaultValue={personalInfo.lastName || ''}
                                               readOnly={initialLastName !== ''}
                                               className={initialLastName !== '' ? styles.readOnly : ''}
                                               {...register("lastName", { required: true, maxLength: 100 })}  data-testid="last-name" />
                                    </div>
                                    {errors.lastName && <div className={styles.fieldError} data-testid="last-name-error">This field is required.</div>}
                                </div>

                                <div className={styles.fieldWrapper}>
                                    <div className={styles.inputWrapper}>
                                        <input type="text" placeholder="Email *" className={styles.readOnly} readOnly={true} defaultValue={personalInfo.email || ''} {...register("email", { required: true, pattern: /^\S+@\S+$/i })} data-testid="email" />
                                    </div>
                                    {errors.email?.type === 'required' && <div className={styles.fieldError} data-testid="email-error-required">This field is required.</div>}
                                    {errors.email?.type === 'pattern' && <div className={styles.fieldError} data-testid="email-error-invalid">The email is invalid.</div>}
                                </div>

                                {showCompanyInput &&
                                    <div className={styles.fieldWrapper}>
                                        <div>
                                            <RegistrationCompanyInput
                                                id="reg-comp-input"
                                                name="reg-comp-input"
                                                data-testid="company"
                                                styles={customStyles}
                                                summitId={summitId}
                                                onChange={onCompanyChange}
                                                onError={handleCompanyError}
                                                value={personalInfo.company}
                                                placeholder={companyDDLPlaceholder}
                                                isClearable={true}
                                                defaultOptions={showCompanyInputDefaultOptions}
                                                openMenuOnFocus={showCompanyInputDefaultOptions}
                                                openMenuOnClick={showCompanyInputDefaultOptions}
                                                options2Show={companyDDLOptions2Show}
                                            />
                                            {companyError && <div className={styles.fieldError} data-testid="company-error">This field is required.</div>}
                                        </div>
                                    </div>
                                }

                                {allowPromoCodes &&
                                    <div className={styles.fieldWrapper}>
                                        <div className={styles.inputWrapper}>
                                            <input type="text" placeholder="Promo code" {...register("promoCode")} />
                                        </div>
                                    </div>
                                }

                                {shouldDisplayTicketAssignment() &&
                                    <>
                                        <br/>
                                        <div className={styles.fieldWrapperRadio}>
                                            <label>Ticket is for:</label>
                                            <RadioList
                                                id={`ticket-self-radio`}
                                                value={ticketOwnerOption}
                                                options={radioListOptions}
                                                onChange={handleRadioButtonChange}
                                                inline
                                                html
                                            />
                                            {ticketOwnerError &&
                                                <>
                                                    <br/>
                                                    <div className={styles.fieldError} data-testid="company-error">This field is required.</div>
                                                </>
                                            }
                                        </div>
                                        {ticketOwnerOption === TICKET_OWNER_SOMEONE &&
                                            <>
                                                <div className={styles.fieldWrapper}>
                                                    <div className={styles.inputWrapper}>
                                                        <input type="text" placeholder="First name" defaultValue={personalInfo?.attendee?.firstName ?? ''}
                                                            {...register("attendee.firstName", { required: false, maxLength: 80 })} data-testid="attendee-first-name" />
                                                    </div>
                                                </div>

                                                <div className={styles.fieldWrapper}>
                                                    <div className={styles.inputWrapper}>
                                                        <input type="text" placeholder="Last name" defaultValue={personalInfo?.attendee?.lastName ?? ''}
                                                            {...register("attendee.lastName", { required: false, maxLength: 100 })} data-testid="attendee-last-name" />
                                                    </div>
                                                </div>

                                                <div className={styles.fieldWrapper}>
                                                    <div className={styles.inputWrapper}>
                                                        <input type="text" placeholder="Email *" defaultValue={personalInfo?.attendee?.email ?? ''}
                                                        {...register("attendee.email", {
                                                            required: true,
                                                            pattern: EMAIL_REGEXP
                                                        })} data-testid="attendee-email" />
                                                    </div>
                                                    {errors.attendee?.email?.type === 'required' && <div className={styles.fieldError} data-testid="attendee-email-error-required">This field is required.</div>}
                                                    {errors.attendee?.email?.type === 'pattern' && <div className={styles.fieldError} data-testid="attendee-email-error-invalid">The email is invalid.</div>}
                                                </div>
                                            </>
                                        }
                                    </>
                                }

                            </form>

                            {allowPromoCodes && showMultipleTicketTexts &&
                                <a className={styles.moreInfo} data-tip data-for="promo-code-info">
                                    <i className="glyphicon glyphicon-info-sign" aria-hidden="true" />{` `}
                                    Have multiple promo codes?
                                </a>
                            }
                            <ReactTooltip id="promo-code-info">
                                <div className={styles.moreInfoTooltip}>
                                    Promo code will be applied to all tickets in this order.  If you wish to utilize more than one promo code, simply place another order after you complete this registration order. Only one promo code can be applied per order.
                                </div>
                            </ReactTooltip>

                            {formErrors.length > 0 && (
                                <div className={`${styles.formErrors} alert alert-danger`}>
                                    {formErrors.map((error, index) => (
                                        <div key={index}>{formatErrorMessage(error)}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </animated.div>
                </div>
            </>
        </div>
    );
};



export default PersonalInfoComponent;
