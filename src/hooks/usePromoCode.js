import { useState, useCallback, useMemo } from 'react';
import T from 'i18n-react';
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
            const errors = e.res.body.errors || [e.res.body.message || T.translate('promo_code.validation_error')];
            const msg = typeof errors[0] === 'string' && /is not a valid code/i.test(errors[0])
                ? T.translate('promo_code.invalid_code')
                : errors[0];
            setValidationError(msg);
        } else {
            setValidationError(T.translate('promo_code.validation_error'));
        }
    }, []);

    // --- Actions ---

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

    const onTicketSelected = useCallback(async (ticket) => {
        const qualifies = discoveredPromoCode && isCodeValidForTicket(ticket);
        setSuggestionActive(qualifies);
        setSuggestionDismissed(false);
        setValidationError(null);

        // Manual (non-discovered) code is applied: re-validate for new ticket
        if (isApplied && !isDiscoveredCode) {
            await onRevalidate(ticket, 1);
            return;
        }

        if (!discoveredPromoCode) return;

        // Discovered code is currently applied
        if (isDiscoveredCode) {
            if (!qualifies) {
                setWasAutoApplied(false);
                removePromoCode();
            } else {
                const valid = await onRevalidate(ticket, 1);
                if (!valid) setWasAutoApplied(false);
            }
            return;
        }

        // No code applied, ticket qualifies, auto-apply configured, single code only
        if (!isApplied && qualifies && discoveredPromoCode.auto_apply && !userRemovedAutoApply && discoveredPromoCodes.length === 1) {
            try {
                setWasAutoApplied(true);
                await applyPromoCode(discoveredPromoCode.code);
                const valid = await onRevalidate(ticket, 1);
                if (!valid) setWasAutoApplied(false);
            } catch (e) {
                setWasAutoApplied(false);
            }
        }
    }, [discoveredPromoCode, isApplied, isDiscoveredCode, userRemovedAutoApply,
        isCodeValidForTicket, applyPromoCode,
        removePromoCode, onRevalidate]);

    const onApply = useCallback(async (code, ticket, quantity) => {
        setValidationError(null);
        clearFormErrors();
        try {
            await applyPromoCode(code);
        } catch (e) {
            return;
        }
        if (ticket) {
            await onRevalidate(ticket, quantity);
        }
    }, [applyPromoCode, onRevalidate, clearFormErrors]);

    const onRemove = useCallback(() => {
        if (wasAutoApplied) setUserRemovedAutoApply(true);

        setWasAutoApplied(false);
        setValidationError(null);
        setSuggestionDismissed(false);

        clearFormErrors();
        onFormPromoCodeChange('');

        removePromoCode();
    }, [wasAutoApplied, removePromoCode, clearFormErrors, onFormPromoCodeChange]);

    const onInputChange = useCallback((value) => {
        setValidationError(null);
        setSuggestionDismissed(value !== discoveredPromoCode?.code);
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
