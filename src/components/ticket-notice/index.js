import React from 'react';
import styles from './index.module.scss';

// `message` is either a single string or an array of strings. Arrays render
// stacked consecutively inside the same notice box. Returns null when the
// message is empty/unset so callers can pass conditional arrays without an
// outer guard. Pass `html` when the message is admin-authored HTML (e.g.
// marketing settings) that needs link rendering.
const TicketNotice = ({ message, variant = 'info', html = false }) => {
    const items = Array.isArray(message) ? message : (message ? [message] : []);
    if (items.length === 0) return null;

    return (
        <div className={`${styles.notice} ${styles[variant]}`}>
            {variant === 'error' && <span className={styles.icon}>⚠</span>}
            <div className={styles.content}>
                {items.map((m, i) => html
                    ? <div key={i} dangerouslySetInnerHTML={{ __html: m }} />
                    : <div key={i}>{m}</div>
                )}
            </div>
        </div>
    );
};

export default TicketNotice;
