import React from 'react';
import { cleanup, fireEvent, render as rtlRender, render, waitFor, act } from '@testing-library/react';
import { renderHook } from "@testing-library/react-hooks";
import { screen } from '@testing-library/dom'
import '@testing-library/jest-dom';

import PersonalInfoComponent from "..";

const mockReservation = {
    owner_first_name: 'Reservation Name',
    owner_last_name: 'Reservation Last Name',
    owner_email: 'reservation@email.com',
    owner_company: 'Reservation Company',
};

const mockProfile = {
    given_name: 'Test Name',
    family_name: 'Test Last Name',
    email: 'test@email.com',
    company: 'Test Company',
}

const mockSubmit = jest.fn();
const mockSetPersonalData = jest.fn();

jest.spyOn(React, "useEffect").mockImplementation((f) => f());

// Note: running cleanup fterEach is done automatically for you in @testing-library/react@9.0.0 or higher
// unmount and cleanup DOM after the test is finished.
afterEach(cleanup);

it('PersonalInfoComponent set the initial values from the user profile', () => {
    const { getByTestId } = render(<PersonalInfoComponent userProfile={mockProfile} />);

    const firstName = getByTestId('first-name');
    const lastName = getByTestId('last-name');
    const email = getByTestId('email');
    const company = getByTestId('company');
    expect(firstName.value).toBe(mockProfile.given_name);
    expect(lastName.value).toBe(mockProfile.family_name);
    expect(email.value).toBe(mockProfile.email);
    expect(company.value).toBe(mockProfile.company);

});

it('PersonalInfoComponent shows the personal data when is not active', async () => {
    const { getByTestId } = render(<PersonalInfoComponent isActive={false} userProfile={mockProfile} />);

    const personalInfo = getByTestId('personal-info');
    expect(personalInfo).toBeTruthy();
    expect(personalInfo.firstElementChild.innerHTML).toBe(`${mockProfile.given_name} ${mockProfile.family_name} ${mockProfile.company ? `- ${mockProfile.company}` : ''}`);
    expect(personalInfo.lastChild.innerHTML).toBe(mockProfile.email);

});

it('PersonalInfoComponent set the fields if there is a reservation', async () => {    

    const { getByTestId } = render(<PersonalInfoComponent isActive={true} userProfile={mockProfile} reservation={mockReservation} />);

    await waitFor(() => expect(mockSetPersonalData).toBeCalled(), { interval: 100 });

    await waitFor(async() => {
        expect(mockSetPersonalData).toBeCalled();
        const firstName = getByTestId('first-name');
        console.log('first name', firstName.value)
    })

    await waitFor(() => {
        const firstName = getByTestId('first-name');
        const lastName = getByTestId('last-name');
        const email = getByTestId('email');
        const company = getByTestId('company');
        expect(firstName.value).toBe(mockReservation.owner_first_name);
    }, {interval: 500})

});

// it('PersonalInfoComponent checks the validation of each field', () => {
//     const { getByTestId } = render(<PersonalInfoComponent ticketTypes={mockTicketTypes} onTicketSelect={mockCallBack} />);

//     const firstName = getByTestId('first-name');
//     const firstNameError = getByTestId('first-name-error');
//     const lastName = getByTestId('last-name');
//     const lastNameError = getByTestId('last-name-error');
//     const email = getByTestId('email');
//     const emailErrorRequired = getByTestId('email-error-required');
//     const emailErrorInvalid = getByTestId('email-error-invalid');
//     const company = getByTestId('company');
//     const companyError = getByTestId('company-error');

// });

// it('PersonalInfoComponent restore the values from the reservation', () => {
//     const { getByTestId } = render(<PersonalInfoComponent ticketTypes={mockTicketTypes} onTicketSelect={mockCallBack} />);

//     const firstName = getByTestId('first-name');
//     const firstNameError = getByTestId('first-name-error');
//     const lastName = getByTestId('last-name');
//     const lastNameError = getByTestId('last-name-error');
//     const email = getByTestId('email');
//     const emailErrorRequired = getByTestId('email-error-required');
//     const emailErrorInvalid = getByTestId('email-error-invalid');
//     const company = getByTestId('company');
//     const companyError = getByTestId('company-error');

// });

// isActive, changeForm, reservation, userProfile


// reservation