import React from 'react';
import styles from './index.module.scss';

const PromoCodeNotice = ({ message, variant = 'info' }) => {
    if (!message) return null;

    return (
        <div className={`${styles.notice} ${styles[variant]}`}>
            {variant === 'error' && <span className={styles.icon}>⚠</span>}
            {message}
        </div>
    );
};

export default PromoCodeNotice;
