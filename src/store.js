/**
 * Copyright 2019
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

 import { createStore, applyMiddleware, compose } from "redux";
 import thunk from "redux-thunk";
 import { persistStore, persistCombineReducers } from "redux-persist";
 import storage from "redux-persist/es/storage"; // default: localStorage if web, AsyncStorage if react-native
 import RegistrationLiteReducer from "./reducer";
 
 let store, persistor;
 
 const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
 
 export const getStore = (clientId, apiBaseUrl, getAccessToken) => {
   if (store) return store;
 
   const config = {
     key: `root_registration_lite_${clientId}`,
     storage,
     blacklist:[
         'ticketTypes',
         'taxTypes',
 ] // do not persist these keys
   };
   
   const reducers = persistCombineReducers(config, {
     registrationLiteState: RegistrationLiteReducer,
   });
   
   store = createStore(
     reducers,
     composeEnhancers(
       applyMiddleware(
         thunk.withExtraArgument({
           apiBaseUrl: apiBaseUrl,
           getAccessToken: getAccessToken,
         })
       )
     )
   );
   return store;
 }
 
 export const getPersistor = () => {
   if (persistor) return persistor;
 
   const onRehydrateComplete = () => {};
   persistor = persistStore(store, null, onRehydrateComplete);
   return persistor;
 }