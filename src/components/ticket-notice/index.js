import React from 'react';
import styles from './index.module.scss';

// `message` is either a single string or an array of strings. Arrays render
// stacked consecutively inside the same notice box. Returns null when the
// message is empty/unset so callers can pass conditional arrays without an
// outer guard.
const TicketNotice = ({ message, variant = 'info' }) => {
    const items = Array.isArray(message) ? message : (message ? [message] : []);
    if (items.length === 0) return null;

    return (
        <div className={`${styles.notice} ${styles[variant]}`}>
            {variant === 'error' && <span className={styles.icon}>⚠</span>}
            <div className={styles.content}>
                {items.map((m, i) => <div key={i}>{m}</div>)}
            </div>
        </div>
    );
};

export default TicketNotice;
