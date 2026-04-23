import { useState, useCallback, useMemo } from 'react';
import { PROMO_STATUS } from '../utils/constants';

const usePromoCode = ({
    discoveredPromoCodes,
    promoCode,
    promoCodeVerified,
    promoCodeValidating,
    applyPromoCode,
    removePromoCode,
    validatePromoCode,
    onFormPromoCodeChange,
    clearFormErrors,
}) => {
    const [userRemovedAutoApply, setUserRemovedAutoApply] = useState(false);
    const [wasAutoApplied, setWasAutoApplied] = useState(false);
    const [suggestionActive, setSuggestionActive] = useState(false);
    const [suggestionDismissed, setSuggestionDismissed] = useState(false);
    const [validationError, setValidationError] = useState(null);

    // Pick first auto_apply code, or first code if none has auto_apply
    const discoveredPromoCode = useMemo(() => {
        if (!discoveredPromoCodes?.length) return null;
        return discoveredPromoCodes.find(c => c.auto_apply) || discoveredPromoCodes[0];
    }, [discoveredPromoCodes]);

    const isApplied = !!promoCode;
    const isDiscoveredCode = isApplied && discoveredPromoCode?.code === promoCode;

    // --- Status ---

    const status = useMemo(() => {
        if (isApplied && promoCodeValidating) return PROMO_STATUS.VALIDATING;
        if (isApplied && promoCodeVerified === true) return PROMO_STATUS.VALID;
        if (isApplied && promoCodeVerified === false) return PROMO_STATUS.INVALID;
        if (isApplied && promoCodeVerified === null) return PROMO_STATUS.APPLYING;
        if (!isApplied && suggestionActive && !suggestionDismissed) return PROMO_STATUS.SUGGESTED;
        return PROMO_STATUS.IDLE;
    }, [isApplied, promoCodeVerified, promoCodeValidating, suggestionActive, suggestionDismissed]);

    // --- Derived values ---

    const suggestedCode = discoveredPromoCode?.code || null;

    const activeDiscoveredCode = (status === PROMO_STATUS.VALID && isDiscoveredCode)
        ? discoveredPromoCode : null;

    const perAccountLimit = activeDiscoveredCode?.quantity_per_account > 0
        ? activeDiscoveredCode.remaining_quantity_per_account : null;

    // Tightest promo-code-level quantity cap for the stepper (discovered codes only)
    const maxQuantityFromPromo = useMemo(() => {
        if (!activeDiscoveredCode) return null;
        const caps = [];
        if (activeDiscoveredCode.remaining_quantity_per_account != null)
            caps.push(activeDiscoveredCode.remaining_quantity_per_account);
        if (activeDiscoveredCode.quantity_available > 0)
            caps.push(activeDiscoveredCode.quantity_available);
        return caps.length > 0 ? Math.min(...caps) : null;
    }, [activeDiscoveredCode]);

    const isReady = status === PROMO_STATUS.IDLE
        || status === PROMO_STATUS.SUGGESTED
        || status === PROMO_STATUS.VALID;

    // --- Discovery: ticket qualification ---

    const isCodeValidForTicket = useCallback((ticket) => {
        if (!discoveredPromoCode || !ticket) return false;
        const allowed = discoveredPromoCode.allowed_ticket_types || [];
        if (allowed.length === 0) return true;
        return allowed.some(tt => (typeof tt === 'object' ? tt.id : tt) === ticket.id);
    }, [discoveredPromoCode]);

    // --- Helpers ---

    const handleValidationError = useCallback((e) => {
        if (e?.res?.body) {
            const errors = e.res.body.errors || [e.res.body.message || 'An error occurred'];
            const msg = typeof errors[0] === 'string' && /is not a valid code/i.test(errors[0])
                ? 'Promo code entered is not valid.'
                : errors[0];
            setValidationError(msg);
        }
    }, []);

    // --- Actions ---

    const onTicketSelected = useCallback(async (ticket) => {
        const qualifies = discoveredPromoCode && isCodeValidForTicket(ticket);
        setSuggestionActive(qualifies);
        setSuggestionDismissed(false);
        setValidationError(null);

        // Manual (non-discovered) code is applied: re-validate for new ticket
        if (isApplied && !isDiscoveredCode) {
            try {
                await validatePromoCode({ id: ticket.id, ticketQuantity: 1, sub_type: ticket.sub_type });
            } catch (e) {
                handleValidationError(e);
            }
            return;
        }

        if (!discoveredPromoCode) return;

        // Discovered code is currently applied
        if (isDiscoveredCode) {
            if (!qualifies) {
                setWasAutoApplied(false);
                removePromoCode();
            } else {
                await validatePromoCode({ id: ticket.id, ticketQuantity: 1, sub_type: ticket.sub_type });
            }
            return;
        }

        // No code applied, ticket qualifies, auto-apply configured
        if (!isApplied && qualifies && discoveredPromoCode.auto_apply && !userRemovedAutoApply) {
            try {
                setWasAutoApplied(true);
                await applyPromoCode(discoveredPromoCode.code);
                await validatePromoCode({ id: ticket.id, ticketQuantity: 1, sub_type: ticket.sub_type });
            } catch (e) {
                setWasAutoApplied(false);
            }
        }
    }, [discoveredPromoCode, isApplied, isDiscoveredCode, userRemovedAutoApply,
        isCodeValidForTicket, applyPromoCode,
        removePromoCode, validatePromoCode, handleValidationError]);

    const onApply = useCallback(async (code, ticket, quantity) => {
        setValidationError(null);
        clearFormErrors();
        try {
            await applyPromoCode(code);
        } catch (e) {
            return;
        }
        if (ticket) {
            try {
                await validatePromoCode({ id: ticket.id, ticketQuantity: quantity, sub_type: ticket.sub_type });
            } catch (e) {
                handleValidationError(e);
            }
        }
    }, [applyPromoCode, validatePromoCode, clearFormErrors, handleValidationError]);

    const onRemove = useCallback(() => {
        if (wasAutoApplied) setUserRemovedAutoApply(true);

        setWasAutoApplied(false);
        setValidationError(null);
        setSuggestionDismissed(false);

        clearFormErrors();
        onFormPromoCodeChange('');

        removePromoCode();
    }, [wasAutoApplied, removePromoCode, clearFormErrors, onFormPromoCodeChange]);

    const onRevalidate = useCallback(async (ticket, quantity) => {
        setValidationError(null);
        try {
            await validatePromoCode({ id: ticket.id, ticketQuantity: quantity, sub_type: ticket.sub_type });
            return true;
        } catch (e) {
            handleValidationError(e);
            return false;
        }
    }, [validatePromoCode, handleValidationError]);

    const onInputChange = useCallback((value) => {
        setValidationError(null);
        if (value) setSuggestionDismissed(value !== discoveredPromoCode?.code);
        onFormPromoCodeChange(value);
    }, [discoveredPromoCode, onFormPromoCodeChange]);

    return {
        status,
        isReady,
        isDiscoveredCode,
        validationError,
        suggestedCode,
        wasAutoApplied,
        activeDiscoveredCode,
        maxQuantityFromPromo,
        perAccountLimit,
        onTicketSelected,
        onApply,
        onRemove,
        onRevalidate,
        onInputChange,
        setValidationError,
    };
};

export default usePromoCode;
