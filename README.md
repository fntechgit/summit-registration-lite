# registration-lite-widget
React component for the registration lite widget


## Registration Lite config

   
   **summitData**             = object with the data from the summit
   
   **profileData**            = object with the profile data from the user
   
   **marketingData**          = object with the settings from the marketing API
   
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