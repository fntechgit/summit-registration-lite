# registration-lite-widget
React component for the schedule filter widget


## Schedule Filter config      

   **title**            = widget title
   
   **onRef**            = method to retrieve schedule component ref. Usage -> {ref => (this.child = ref)}   

   **marketingData**    = object with the settings from the marketing API      

   
## PUBLISH TO NPM:

1 - npm version patch / npm version minor / npm version major

2 - npm run publish-package

## IMPORT:

import RegistrationLiteWidget from 'registration-lite-widget';

import 'registration-lite-widget/index.css';

## DEBUG:
You can pass this hash on url to override current time, time must be in this format and on summit timezone

\#now=2020-06-03,10:59:50