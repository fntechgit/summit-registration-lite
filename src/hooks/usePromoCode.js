import { useState, useCallback, useMemo, useEffect } from 'react';
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
    ticketDataLoaded = false,
    hasTickets = false,
}) => {
    const [userRemovedAutoApply, setUserRemovedAutoApply] = useState(false);
    const [wasAutoApplied, setWasAutoApplied] = useState(false);
    const [suggestionActive, setSuggestionActive] = useState(false);
    const [suggestionDismissed, setSuggestionDismissed] = useState(false);
    // Error written by handleValidationError (API) or the form (unapplied-code warning).
    // The user-facing `validationError` is computed below by merging this with the
    // status-derived INVALID message.
    const [manualError, setManualError] = useState(null);
    const [applyingCode, setApplyingCode] = useState(false);

    // Pick first auto_apply code, or first code if none has auto_apply
    const discoveredPromoCode = useMemo(() => {
        if (!discoveredPromoCodes?.length) return null;
        return discoveredPromoCodes.find(c => c.auto_apply) || discoveredPromoCodes[0];
    }, [discoveredPromoCodes]);

    const isApplied = !!promoCode;
    const isDiscoveredCode = isApplied && discoveredPromoCode?.code === promoCode;

    // --- Status ---

    const status = useMemo(() => {
        if (isApplied) {
            if (promoCodeValidating) return PROMO_STATUS.VALIDATING;
            if (promoCodeVerified === true) return PROMO_STATUS.VALID;
            if (promoCodeVerified === false) return PROMO_STATUS.INVALID;
            // Applied but no tickets returned and not currently applying: code is invalid
            if (!applyingCode && ticketDataLoaded && !hasTickets) return PROMO_STATUS.INVALID;
            return PROMO_STATUS.APPLYING;
        }
        if (suggestionActive && !suggestionDismissed) return PROMO_STATUS.SUGGESTED;
        return PROMO_STATUS.IDLE;
    }, [isApplied, promoCodeVerified, promoCodeValidating, suggestionActive, suggestionDismissed, applyingCode, ticketDataLoaded, hasTickets]);

    // Single source of truth for the error shown to the user.
    // Manual/API errors override the generic status-derived "invalid code" message.
    const validationError = manualError
        ?? (status === PROMO_STATUS.INVALID ? T.translate('promo_code.invalid_code') : null);

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
            setManualError(msg);
        } else {
            setManualError(T.translate('promo_code.validation_error'));
        }
    }, []);

    // --- Actions ---

    const onRevalidate = useCallback(async (ticket, quantity) => {
        setManualError(null);
        try {
            await validatePromoCode({ id: ticket.id, ticketQuantity: quantity, sub_type: ticket.sub_type });
            return true;
        } catch (e) {
            handleValidationError(e);
            return false;
        }
    }, [validatePromoCode, handleValidationError]);

    // Shared auto-apply flow. Caller is responsible for the gating conditions
    // (auto_apply / single code / not already applied / not user-removed) so each
    // call site keeps its own trigger logic. Returns true if the code was applied
    // and (if a ticket was passed) successfully revalidated.
    const tryAutoApply = useCallback(async (ticket) => {
        setWasAutoApplied(true);
        setApplyingCode(true);
        try {
            await applyPromoCode(discoveredPromoCode.code);
            if (ticket) {
                const valid = await onRevalidate(ticket, 1);
                if (!valid) {
                    setWasAutoApplied(false);
                    return false;
                }
            }
            return true;
        } catch {
            setWasAutoApplied(false);
            return false;
        } finally {
            setApplyingCode(false);
        }
    }, [discoveredPromoCode, applyPromoCode, onRevalidate]);

    const onTicketSelected = useCallback(async (ticket) => {
        const qualifies = discoveredPromoCode && isCodeValidForTicket(ticket);
        setSuggestionActive(qualifies);
        setSuggestionDismissed(false);
        setManualError(null);

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
            await tryAutoApply(ticket);
        }
    }, [discoveredPromoCode, isApplied, isDiscoveredCode, userRemovedAutoApply, discoveredPromoCodes,
        isCodeValidForTicket, removePromoCode, onRevalidate, tryAutoApply]);

    // Early auto-apply: when no tickets are available and a single auto_apply code
    // was discovered, apply it so the API returns WithPromoCode ticket types.
    // On failure, mark as removed to prevent re-fire loops.
    useEffect(() => {
        if (userRemovedAutoApply || isApplied) return;
        if (!ticketDataLoaded || hasTickets) return;
        if (!discoveredPromoCode?.auto_apply) return;
        if (discoveredPromoCodes.length !== 1) return;

        tryAutoApply(null).then(success => {
            if (!success) setUserRemovedAutoApply(true);
        });
    }, [userRemovedAutoApply, ticketDataLoaded, hasTickets, discoveredPromoCode, discoveredPromoCodes, isApplied, tryAutoApply]);

    const onApply = useCallback(async (code, ticket, quantity) => {
        setManualError(null);
        clearFormErrors();
        setApplyingCode(true);
        try {
            await applyPromoCode(code);
        } catch (e) {
            setApplyingCode(false);
            return;
        }
        if (ticket) {
            await onRevalidate(ticket, quantity);
        }
        setApplyingCode(false);
    }, [applyPromoCode, onRevalidate, clearFormErrors]);

    const onRemove = useCallback(() => {
        if (wasAutoApplied || isDiscoveredCode) setUserRemovedAutoApply(true);

        setWasAutoApplied(false);
        setManualError(null);
        setSuggestionDismissed(false);
        if (discoveredPromoCode) setSuggestionActive(true);

        clearFormErrors();
        onFormPromoCodeChange('');

        removePromoCode();
    }, [wasAutoApplied, isDiscoveredCode, discoveredPromoCode, removePromoCode, clearFormErrors, onFormPromoCodeChange]);

    const onInputChange = useCallback((value) => {
        setManualError(null);
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
        setValidationError: setManualError,
    };
};

export default usePromoCode;
