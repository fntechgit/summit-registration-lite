# summit-registration-lite
React component for the summit registration lite widget


## Registration Lite config

   **apiBaseUrl**             = base url for API

   **summitData**             = object with the data from the summit

   **profileData**            = object with the profile data from the user

   **supportEmail**           = string with the email address for support

   **allowsNativeAuth**       = boolean to show/hide native auth

   **allowsOtpAuth**          = boolean to show/hide OTP auth

   **loginOptions**           = array with the options to show on the login screen

   **loading**                = boolean to show/hide a loader on the widget

   **showMultipleTicketTexts**= boolean to show/hide the text for multiple tickets

   **noAllowedTicketsMessage**= string with the message for the 'No Allowed Tickets' error

   **ticketTaxesErrorMessage**= string with the message for the 'TicketAndTaxesError' component

   **initialOrderComplete1stParagraph** = string with the text for the first paragraph when the user bought his first order

   **initialOrderComplete2ndParagraph** = string with the text for the second paragraph when the user bought his first order

   **initialOrderCompleteButton** = string with the text for the button when the user bought his first order

   **orderCompleteTitle** = string with the text for title when the user bought an order

   **orderComplete1stParagraph** = string with the text for the first paragraph when the user bought an order

   **orderComplete2ndParagraph** = string with the text for the second paragraph when the user bought an order

   **orderCompleteButton** = string with the text for the button when the user bought an order

   Example

   ```
   [
      { button_color: '#082238', provider_label: 'FNid', provider_param: 'fnid' },
      { button_color: '#0370C5', provider_label: 'Facebook', provider_param: 'facebook' }
   ]
   ```

   **authUser**               = method passed that will be called on user login. param -> (provider) => console.log('login with', provider)

   **completedExtraQuestions**= method passed that will be called to evaluate if the user extra questions are completed

   **getAccessToken**         = method passed that will be called to request the access token

   **closeWidget**            = method passed that will be called if the user tries to close the widget

   **goToExtraQuestions**     = method passed that will be called by component to redirect to extra questions page. Pass attendeeId

   **goToEvent**              = method passed that will be called to redirect the user to the current event

   **goToMyOrders**           = method passed that will be called to redirect the user to the my orders page

   **getPasswordlessCode**    = method passed that will be called when the user generates a code to login without password

   **loginWithCode**          = method passed that will be called when the user tries to login with a code

   **onPurchaseComplete**     = method passed that will be called after the purchase of a ticket it's completed

   **trackEvent**             = method that tracks a given event.

   **handleCompanyError**     = method passed that will be called if the company dropdown can't be fetched

   **authErrorCallback**      = method passed that will handle on client any auth error

   **allowPromoCodes**        = boolean to show/hide promo code field. Defaults to true

   **showCompanyInput**       = booleaen to show/hide the "Company" field. Defaults to true.

   **companyDDLPlaceholder**  = string for the set the placeholder of the DDL company input

   **companyDDLOptions2Show** = Maximum number of companies to show on a match of the DDL company input

   **idpLogoDark**            = string for custom src for dark theme logo on otp login

   **idpLogoLight**           = string for custom src for light theme logo on otp login

   **idpLogoAlt**             = string for custom alt logo on otp login

   **hidePostalCode**         = boolean to show/hide postal code on payment step. Default to false

   **onError**                = method passed that will handle on client any error

   **successfulPaymentReturnUrl** = string with the url to return after a payment

   **providerOptions** = custom configuration options for provider

## PUBLISH TO NPM:

1 - yarn build && yarn publish

2 - yarn publish-package

## Required external stylesheets

The following stylesheets must be loaded before mounting the widget:

- **Bootstrap 3** — `https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/css/bootstrap.min.css`
- **Font Awesome 4** — `https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css`

## IMPORT:

import RegistrationLiteWidget from 'summit-registration-lite/dist';

import 'summit-registration-lite/dist/index.css';

## DEBUG:
You can pass this hash on url to override current time, time must be in this format and on summit timezone

\#now=2020-06-03,10:59:50
