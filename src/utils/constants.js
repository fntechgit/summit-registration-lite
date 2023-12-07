/**
 * Copyright 2022 OpenStack Foundation
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

export const AUTH_ERROR_MESSAGE = 'Missing Auth info';
export const AUTH_ERROR_MISSING_REFRESH_TOKEN = "missing Refresh Token";
export const AUTH_ERROR_REQUEST_FAILED = 'Request failed';
export const VirtualAccessLevel = 'VIRTUAL';
export const DefaultBGColor = '#000000';
export const DefaultTextColor = '#FFFFFF';
export const DefaultHintColor = 'rgb(58, 63, 65)';

export const EMAIL_REGEXP = /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

export const TICKET_OWNER_MYSELF = 'myself';
export const TICKET_OWNER_SOMEONE = 'someoneElse';
export const TICKET_OWNER_UNASSIGNED = 'unassigned';