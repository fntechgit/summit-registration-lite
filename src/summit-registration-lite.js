/**
 * Copyright 2017 OpenStack Foundation
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

import React from "react";
import { RegistrationModal, RegistrationLite } from "./components/registration-lite";

// Access token is required to fetch registration company input. For standalone widget use
if (process.env.NODE_ENV === 'development') {
    window.API_BASE_URL = process.env['API_BASE_URL'];

    if (typeof window !== 'undefined') {
        window.localStorage.setItem('authInfo', JSON.stringify({ accessToken: process.env['ACCESS_TOKEN'] }));
    }
}

// Legacy exports (backward compatible)
export { default as LoginComponent } from './components/login';
export { default as PasswordlessLoginComponent } from './components/login-passwordless';

// Core form component (no modal)
export { default as RegistrationForm } from './components/registration-form';

// Modal component - wraps RegistrationForm in a modal overlay
export { RegistrationModal };

// Backward compatibility alias
export { RegistrationLite };

// Default export - RegistrationModal (backward compatible)
export default RegistrationModal;
