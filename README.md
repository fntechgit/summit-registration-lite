# summit-registration-lite
React component for the summit registration lite widget


## Registration Lite config

   **apiBaseUrl**             = base url for API
   
   **summitData**             = object with the data from the summit
   
   **profileData**            = object with the profile data from the user
   
   **marketingData**          = object with the settings from the marketing API

   **supportEmail**           = string with the email address for support

   **loginOptions**           = array with the options to show on the login screen

   **loading**                = boolean to show/hide a loader on the widget

   Example
   
   ```
   [
      { button_color: '#082238', provider_label: 'FNid', provider_param: 'fnid' },
      { button_color: '#0370C5', provider_label: 'Facebook', provider_param: 'facebook' }
   ]
   ```

   **authUser**               = method passed that will be called on user login. param -> (provider) => console.log('login with', provider)
   
   **getAccessToken**         = method passed that will be called to request the access token
   
   **closeWidget**            = method passed that will be called if the user tries to close the widget
   
   **goToExtraQuestions**     = method passed that will be called by component to redirect to extra questions page

   **goToEvent**              = method passed that will be called to redirect the user to the current event
   
   **getPasswordlessCode**    = method passed that will be called when the user generates a code to login without password

   **loginWithCode**          = method passed that will be called when the user tries to login with a code

   **onPurchaseComplete**     = method passed that will be called after the purchase of a ticket it's completed
   

## PUBLISH TO NPM:

1 - yarn build && yarn publish

2 - yarn publish-package

## IMPORT:

import RegistrationLiteWidget from 'summit-registration-lite/dist';

import 'summit-registration-lite/dist/index.css';

## DEBUG:
You can pass this hash on url to override current time, time must be in this format and on summit timezone

\#now=2020-06-03,10:59:50
