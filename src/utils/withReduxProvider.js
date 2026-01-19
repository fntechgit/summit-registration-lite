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
 *
 * HOC to wrap a component with Redux Provider and PersistGate.
 **/

import React from 'react';
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { getStore, getPersistor } from "../store";

export const withReduxProvider = (WrappedComponent) => {
    class WithReduxProvider extends React.PureComponent {
        constructor(props) {
            super(props);
            this.store = getStore(props.clientId, props.apiBaseUrl, props.getAccessToken);
        }

        render() {
            return (
                <Provider store={this.store}>
                    <PersistGate persistor={getPersistor()}>
                        <WrappedComponent {...this.props} />
                    </PersistGate>
                </Provider>
            );
        }
    }

    // Copy propTypes and defaultProps from wrapped component
    WithReduxProvider.propTypes = WrappedComponent.propTypes;
    WithReduxProvider.defaultProps = WrappedComponent.defaultProps;
    WithReduxProvider.displayName = `WithReduxProvider(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

    return WithReduxProvider;
};

export default withReduxProvider;
