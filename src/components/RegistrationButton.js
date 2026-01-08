/**
 * Copyright 2024 OpenStack Foundation
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
 * RegistrationButton - Complete drop-in solution with button + modal + form
 *
 * This component provides a complete registration solution in one component:
 * - Button to trigger registration
 * - Modal that opens when clicked
 * - Full registration form inside modal
 *
 * Usage:
 * ```jsx
 * <RegistrationButton
 *   apiBaseUrl="https://api.summit.com"
 *   clientId="your-client-id"
 *   getAccessToken={() => 'your-token'}
 *   summitData={summitData}
 *   buttonText="Buy Tickets"
 *   onComplete={(order) => console.log('Purchased!', order)}
 * />
 * ```
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import RegistrationModal from './RegistrationModal';
import RegistrationForm from './RegistrationForm';

const RegistrationButton = ({
  // Button configuration
  buttonText,
  buttonClassName,
  buttonStyle,
  iconClassName,
  disabled,

  // Auto-open modal on mount (for deep linking)
  autoOpen,
  autoOpenDelay,

  // Modal configuration
  modalTitle,
  modalClassName,

  // Callbacks
  onComplete,
  onCancel,

  // All form props get passed through to RegistrationForm
  ...formProps
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Auto-open modal if requested (e.g., from URL parameter)
  useEffect(() => {
    if (autoOpen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, autoOpenDelay);
      return () => clearTimeout(timer);
    }
  }, [autoOpen, autoOpenDelay]);

  const handleButtonClick = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onCancel) onCancel();
  };

  const handleComplete = (order) => {
    // Keep modal open, RegistrationForm will show success message
    // Consumer can close it via onComplete callback if desired
    if (onComplete) onComplete(order);
  };

  return (
    <>
      <button
        className={buttonClassName || 'registration-button'}
        style={buttonStyle}
        onClick={handleButtonClick}
        disabled={disabled}
        type="button"
      >
        {iconClassName && <i className={iconClassName} />}
        {buttonText}
      </button>

      <RegistrationModal
        isOpen={isOpen}
        onClose={handleClose}
        title={modalTitle}
        className={modalClassName}
      >
        <RegistrationForm
          {...formProps}
          onPurchaseComplete={handleComplete}
          closeWidget={handleClose}
          showCloseButton={true}
        />
      </RegistrationModal>
    </>
  );
};

RegistrationButton.propTypes = {
  // Button props
  buttonText: PropTypes.string,
  buttonClassName: PropTypes.string,
  buttonStyle: PropTypes.object,
  iconClassName: PropTypes.string,
  disabled: PropTypes.bool,

  // Auto-open
  autoOpen: PropTypes.bool,
  autoOpenDelay: PropTypes.number,

  // Modal props
  modalTitle: PropTypes.string,
  modalClassName: PropTypes.string,

  // Callbacks
  onComplete: PropTypes.func,
  onCancel: PropTypes.func,

  // All RegistrationForm props are also accepted via ...formProps
};

RegistrationButton.defaultProps = {
  buttonText: 'Register',
  disabled: false,
  autoOpen: false,
  autoOpenDelay: 0,
  modalTitle: 'Event Registration',
};

export default RegistrationButton;
