# registration-lite-widget
React component for the registration lite widget


## Registration Lite config

   
   **summitData**             = object with the data from the summit
   
   **profileData**            = object with the profile data from the user
   
   **marketingData**          = object with the settings from the marketing API

   **loginOptions**           = array with the options to show on the login screen

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

   
## PUBLISH TO NPM:

1 - npm version patch / npm version minor / npm version major

2 - npm run publish-package

## IMPORT:

import RegistrationLiteWidget from 'registration-lite-widget';

import 'registration-lite-widget/index.css';

## DEBUG:
You can pass this hash on url to override current time, time must be in this format and on summit timezone

\#now=2020-06-03,10:59:50