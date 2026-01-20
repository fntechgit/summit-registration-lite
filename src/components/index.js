/**
 * Copyright 2026 OpenStack Foundation
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

// Login components
export { default as LoginComponent } from './login';
export { default as PasswordlessLoginComponent } from './login-passwordless';

// Registration components
export { default as RegistrationModal } from './registration-modal';
export { default as RegistrationForm } from './registration-form';

// Backward compatibility alias
import _RegistrationModal from './registration-modal';
export const RegistrationLite = _RegistrationModal;
