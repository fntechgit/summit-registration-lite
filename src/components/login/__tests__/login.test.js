import React from 'react';
import { cleanup, fireEvent, render as rtlRender, render, waitFor, getByTestId } from '@testing-library/react';
import { screen } from '@testing-library/dom'
import '@testing-library/jest-dom';

import LoginComponent from "..";

const mockOptions = [
    { button_color: '#082238', provider_label: 'FNid', provider_param: 'fnid' },
    { button_color: '#0370C5', provider_label: 'Facebook', provider_param: 'facebook' },
    { button_color: '#DD4437', provider_label: 'Google', provider_param: 'google' },
    { button_color: '#000000', provider_label: 'Apple ID', provider_param: 'apple_id' },
    { button_color: '#2272E7', provider_label: 'Microsoft', provider_param: 'microsoft' },
];

const mockCallBack = jest.fn();

// Note: running cleanup fterEach is done automatically for you in @testing-library/react@9.0.0 or higher
// unmount and cleanup DOM after the test is finished.
afterEach(cleanup);

it('LoginComponent renders the right quantity of providers', () => {
    const { getAllByTestId } = render(<LoginComponent loginOptions={mockOptions} getLoginCode={mockCallBack} login={mockCallBack} />);

    const buttons = getAllByTestId('login-button');
    expect(buttons.length).toBe(mockOptions.length);
});

it('LoginComponent triggers login function on button click', () => {
    const { getAllByTestId } = render(<LoginComponent loginOptions={mockOptions} getLoginCode={mockCallBack} login={mockCallBack} />);

    const buttons = getAllByTestId('login-button');
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.click(buttons[0]);
    expect(mockCallBack.mock.calls.length).toEqual(1);
});

it('LoginComponent should evaluate the email before sending the code', () => {
    const { getByTestId, getByText } = render(<LoginComponent loginOptions={mockOptions} getLoginCode={mockCallBack} login={mockCallBack} />);

    const emailInput = getByTestId('email-input');
    const button = getByTestId('email-button');
    fireEvent.click(button);
    const emailError = getByTestId('email-error');
    expect(emailError).toBeTruthy();
    fireEvent.change(emailInput, { target: { value: 'test@email.com' } })
    fireEvent.click(button);    
    const noEmailError = screen.queryByText('Please enter a valid email adress');
    expect(noEmailError).toBeFalsy();    
    expect(mockCallBack.mock.calls.length).toEqual(2);
});