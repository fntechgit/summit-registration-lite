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
 * RegistrationModal - Modal wrapper for registration form
 *
 * Provides modal/overlay behavior around registration content.
 * Can be used independently for custom implementations.
 *
 * Usage:
 * ```jsx
 * <RegistrationModal isOpen={isOpen} onClose={() => setIsOpen(false)}>
 *   <RegistrationForm {...props} />
 * </RegistrationModal>
 * ```
 */

import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './RegistrationModal.module.scss';

const RegistrationModal = ({
  isOpen,
  onClose,
  title,
  className,
  children,
  closeOnEscape,
  closeOnOverlayClick,
  showCloseButton,
}) => {
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`${styles.modalOverlay} ${className || ''}`}
      onClick={handleOverlayClick}
    >
      <div className={styles.modalContent}>
        {(title || showCloseButton) && (
          <div className={styles.modalHeader}>
            {title && <h2 className={styles.modalTitle}>{title}</h2>}
            {showCloseButton && (
              <button
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close"
                type="button"
              >
                ×
              </button>
            )}
          </div>
        )}
        <div className={styles.modalBody}>
          {children}
        </div>
      </div>
    </div>
  );
};

RegistrationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
  closeOnEscape: PropTypes.bool,
  closeOnOverlayClick: PropTypes.bool,
  showCloseButton: PropTypes.bool,
};

RegistrationModal.defaultProps = {
  closeOnEscape: true,
  closeOnOverlayClick: true,
  showCloseButton: true,
};

export default RegistrationModal;
