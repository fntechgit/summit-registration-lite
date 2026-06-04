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
 * HOC to wrap a widget root with Redux, PersistGate, and ClockProvider.
 **/

import React from 'react';
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ClockProvider } from "openstack-uicore-foundation/lib/components/clock-context";
import { getStore, getPersistor } from "../store";

export const withWidgetProviders = (WrappedComponent) => {
    class WithWidgetProviders extends React.PureComponent {
        constructor(props) {
            super(props);
            this.store = getStore(props.clientId, props.apiBaseUrl, props.getAccessToken);
        }

        render() {
            const { summitData } = this.props;
            return (
                <Provider store={this.store}>
                    <PersistGate persistor={getPersistor()}>
                        <ClockProvider
                            timezone={summitData?.time_zone_id || 'UTC'}
                            now={Math.floor(Date.now() / 1000)}
                        >
                            <WrappedComponent {...this.props} />
                        </ClockProvider>
                    </PersistGate>
                </Provider>
            );
        }
    }

    WithWidgetProviders.propTypes = WrappedComponent.propTypes;
    WithWidgetProviders.defaultProps = WrappedComponent.defaultProps;
    WithWidgetProviders.displayName = `WithWidgetProviders(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

    return WithWidgetProviders;
};

export default withWidgetProviders;
