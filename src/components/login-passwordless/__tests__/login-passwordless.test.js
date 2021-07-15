import React from 'react';
import { cleanup, fireEvent, render as rtlRender, render, waitFor, getByTestId } from '@testing-library/react';
import { screen } from '@testing-library/dom'
import '@testing-library/jest-dom';

import PasswordlessLoginComponent from "..";

const mockEmail = "test@email.com";

const mockCallBack = jest.fn();

// Note: running cleanup fterEach is done automatically for you in @testing-library/react@9.0.0 or higher
// unmount and cleanup DOM after the test is finished.
afterEach(cleanup);

it('PasswordlessLoginComponent renders the right email and quantity of input fields', () => {
    const { getAllByTestId, getByText } = render(<PasswordlessLoginComponent email={mockEmail} codeLength={5} />);

    const email = getByText(mockEmail);
    expect(email).toBeTruthy();
    const inputs = getAllByTestId(/^otp-input/)
    expect(inputs.length).toBe(5);
});

it('PasswordlessLoginComponent changes the style when there is missing characters in the code', async () => {
    const { getByTestId, getAllByTestId, getByText } = render(<PasswordlessLoginComponent codeLength={5} passwordlessLogin={mockCallBack} />);

    const inputs = getAllByTestId(/^otp-input/)
    expect(inputs.length).toBe(5);
    const verify = getByTestId('verify');
    fireEvent.click(verify);
    expect(mockCallBack.mock.calls.length).toEqual(0);
    await waitFor(() => {
        const newInputs = screen.queryAllByTestId(/^otp-input/);
        newInputs.every(input => expect(input).toHaveStyle({ border: "1px solid #e5424d" }));        
    });
});

it('PasswordlessLoginComponent shows an error when the code is incorrect', async () => {
    const { getByTestId, getAllByTestId, getByText } = render(<PasswordlessLoginComponent codeLength={5} codeError={true} passwordlessLogin={mockCallBack} />);

    const inputs = getAllByTestId(/^otp-input/)
    expect(inputs.length).toBe(5);
    const verify = getByTestId('verify');
    fireEvent.click(verify);
    expect(mockCallBack.mock.calls.length).toEqual(0);
    const error = getByTestId('error');
    expect(error).toBeTruthy();
});

it('PasswordlessLoginComponent goes to login when the user clicks the button', async () => {
    const { getByTestId } = render(<PasswordlessLoginComponent goToLogin={mockCallBack} />);
    
    const goToLogin = getByTestId('go-back');
    fireEvent.click(goToLogin);
    expect(mockCallBack.mock.calls.length).toEqual(1);
});