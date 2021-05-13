/**
 * Copyright 2020 OpenStack Foundation
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

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { AjaxLoader } from 'openstack-uicore-foundation/lib/components';
import { loadSession, setMarketingSettings } from "../actions";

import styles from "../styles/general.module.scss";
import 'openstack-uicore-foundation/lib/css/components.css';

class RegistrationLite extends React.Component {

    componentDidMount() {
        const { loadSession, setMarketingSettings, filters, ...rest } = this.props;

        loadSession(rest).then(() => {
            setMarketingSettings();
        });

        this.props.onRef(this)
    }

    componentWillUnmount() {
        this.props.onRef(undefined)
    }

    render() {
        const { settings, widgetLoading } = this.props;

        return (
            <div className={`${styles.outerWrapper} schedule-widget`} ref={el => this.wrapperElem = el} data-testid="registration-lite-wrapper">
                <AjaxLoader show={widgetLoading} size={60} relative />
                <>
                    <div className={`${styles.innerWrapper}`} data-testid="registration-lite-list">
                        registration lite
                    </div>
                </>
            </div>
        );
    }
}

function mapStateToProps(scheduleReducer) {
    return {
        ...scheduleReducer
    }
}

export default connect(mapStateToProps, {
    loadSession,
    setMarketingSettings
})(RegistrationLite)

