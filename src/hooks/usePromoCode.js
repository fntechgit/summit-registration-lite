import { useState, useCallback, useMemo, useEffect } from 'react';
import T from 'i18n-react';
import { PROMO_STATUS } from '../utils/constants';

const usePromoCode = ({
    // Redux state
    discoveredPromoCodes,
    promoCode,
    promoCodeVerified,
    promoCodeValidating,

    // Redux dispatchers
    applyPromoCode,
    removePromoCode,
    validatePromoCode,

    // Form integration
    ticketDataLoaded = false,
    hasTickets = false,
    setFormPromoCode,
}) => {
    // Per-session lock: once the user removes (or auto-apply fails for) a
    // discovered code, don't re-apply it on this widget mount. Never reset.
    const [userRemovedAutoApply, setUserRemovedAutoApply] = useState(false);
    const [isAutoApplied, setIsAutoApplied] = useState(false);
    const [suggestionActive, setSuggestionActive] = useState(false);
    const [suggestionDismissed, setSuggestionDismissed] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [applyingCode, setApplyingCode] = useState(false);

    // Pick first auto_apply code, or first code if none has auto_apply
    const discoveredPromoCode = useMemo(() => {
        if (!discoveredPromoCodes?.length) return null;
        return discoveredPromoCodes.find(c => c.auto_apply) || discoveredPromoCodes[0];
    }, [discoveredPromoCodes]);

    const isApplied = !!promoCode;
    const isDiscoveredCode = isApplied && discoveredPromoCode?.code === promoCode;

    // --- Canonical signals ---
    // The raw Redux signals can overlap (e.g. a stale promoCodeVerified=false
    // persists while a re-validation is in flight), so precedence is encoded
    // here, once, rather than in each consumer.

    // Something genuinely in flight: applying the code, validating it against
    // a ticket, or waiting on the code-filtered ticket list with no settled
    // verdict to show in the meantime.
    const isBusy = applyingCode || promoCodeValidating
        || (isApplied && promoCodeVerified == null && !ticketDataLoaded);

    // Settled rejection: the backend rejected the code for the selected
    // ticket, or the code-filtered ticket list came back empty.
    const isInvalid = !isBusy && isApplied
        && (promoCodeVerified === false || (promoCodeVerified == null && !hasTickets));

    const isSuggested = !isApplied && suggestionActive && !suggestionDismissed;

    // --- Display status: a pure projection of the signals, total order.
    // Gate rendering on this; gate behavior on the signals above.
    const status = useMemo(() => {
        if (isBusy) return PROMO_STATUS.PROCESSING;
        if (isInvalid) return PROMO_STATUS.INVALID;
        // APPLIED requires a backend verdict for the selected ticket. Applying
        // a code without a ticket runs no validation, and the catalog comes
        // back populated even for a code that does not exist, so anything
        // short of a confirmed verdict rests as UNVERIFIED.
        if (isApplied) return (promoCodeVerified === true && apiError == null)
            ? PROMO_STATUS.APPLIED
            : PROMO_STATUS.UNVERIFIED;
        if (isSuggested) return PROMO_STATUS.SUGGESTED;
        return PROMO_STATUS.IDLE;
    }, [isBusy, isInvalid, isApplied, isSuggested, promoCodeVerified, apiError]);

    // Prefers the message the request returned, falling back to a generic
    // invalid-code message when the code was rejected without one.
    const validationError = apiError
        ?? (isInvalid ? T.translate('promo_code.invalid_code') : null);

    // --- Derived values ---

    const suggestedCode = discoveredPromoCode?.code || null;

    const activeDiscoveredCode = (promoCodeVerified === true && !promoCodeValidating && isDiscoveredCode)
        ? discoveredPromoCode : null;

    const perAccountLimit = activeDiscoveredCode?.quantity_per_account > 0
        ? activeDiscoveredCode.remaining_quantity_per_account : null;

    // Tightest promo-code-level quantity cap for the stepper (discovered codes only).
    // Both cap sources use `!= null` so a value of 0 (sold-out / no remaining) caps the
    // stepper at 0 instead of being silently ignored.
    const maxQuantityFromPromo = useMemo(() => {
        if (!activeDiscoveredCode) return null;
        const caps = [];
        if (activeDiscoveredCode.remaining_quantity_per_account != null)
            caps.push(activeDiscoveredCode.remaining_quantity_per_account);
        if (activeDiscoveredCode.quantity_available != null)
            caps.push(activeDiscoveredCode.quantity_available);
        return caps.length > 0 ? Math.min(...caps) : null;
    }, [activeDiscoveredCode]);

    // True when the user can safely advance from the ticket step: nothing in
    // flight, no rejection, and no unresolved request error. Ticket selection
    // is enforced by its own gate.
    const isReady = !isBusy && !isInvalid && apiError == null;

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
            const first = errors[0];
            const firstStr = typeof first === 'string' ? first : first?.message ?? String(first);
            const msg = /is not a valid code/i.test(firstStr)
                ? T.translate('promo_code.invalid_code')
                : firstStr;
            setApiError(msg);
        } else {
            setApiError(T.translate('promo_code.validation_error'));
        }
    }, []);

    // --- Actions ---

    const onRevalidate = useCallback(async (ticket, quantity) => {
        setApiError(null);
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
    //
    // Note on concurrency: the two call sites (early-auto-apply effect and
    // onTicketSelected's auto-apply branch) operate on disjoint states by design
    // (the effect requires `!isApplied`, the branch fires only on a user-driven
    // ticket selection — by which point isApplied is already true if early
    // auto-apply ran), so a true concurrent invocation is unreachable in
    // practice. If a future change makes that overlap possible, gate this body
    // with a ref-tracked in-flight flag rather than `applyingCode` (which is
    // captured stale here).
    const tryAutoApply = useCallback(async (ticket) => {
        setIsAutoApplied(true);
        setApplyingCode(true);
        try {
            await applyPromoCode(discoveredPromoCode.code);
            if (ticket) {
                const valid = await onRevalidate(ticket, 1);
                if (!valid) {
                    setIsAutoApplied(false);
                    return false;
                }
            }
            return true;
        } catch (e) {
            setIsAutoApplied(false);
            handleValidationError(e);
            return false;
        } finally {
            setApplyingCode(false);
        }
    }, [discoveredPromoCode, applyPromoCode, onRevalidate, handleValidationError]);

    const onTicketSelected = useCallback(async (ticket) => {
        const qualifies = discoveredPromoCode && isCodeValidForTicket(ticket);
        // Only turn the suggestion on when the current ticket qualifies; don't
        // turn it off otherwise. With auto-switch-on-Apply, the suggestion is
        // still useful when the user has a non-qualifying ticket selected
        // (Apply will switch them to the qualifying one). The status logic
        // hides the banner whenever a code is applied, so leaving this true
        // doesn't surface a stale suggestion.
        if (qualifies) setSuggestionActive(true);
        setSuggestionDismissed(false);
        setApiError(null);

        // Manual (non-discovered) code is applied: re-validate for new ticket
        if (isApplied && !isDiscoveredCode) {
            await onRevalidate(ticket, 1);
            return;
        }

        if (!discoveredPromoCode) return;

        // Discovered code is currently applied — re-validate against the new
        // ticket. The backend rejects if the code doesn't apply, surfacing
        // INVALID to the user (they can then choose to Remove or pick another
        // ticket). Previously we silently removed the code on a non-qualifying
        // pick, which hid the rejection.
        if (isDiscoveredCode) {
            const valid = await onRevalidate(ticket, 1);
            if (!valid) setIsAutoApplied(false);
            return;
        }

        // No code applied, ticket qualifies, auto-apply configured, single code only
        if (!isApplied && qualifies && discoveredPromoCode.auto_apply && !userRemovedAutoApply && discoveredPromoCodes.length === 1) {
            await tryAutoApply(ticket);
        }
    }, [discoveredPromoCode, isApplied, isDiscoveredCode, userRemovedAutoApply, discoveredPromoCodes,
        isCodeValidForTicket, onRevalidate, tryAutoApply]);

    // Early auto-apply on load (per SDS: silently apply a discovered single
    // auto_apply code when no code is currently applied). Wait on
    // ticketDataLoaded only to avoid racing the initial fetch. On failure,
    // mark as removed to prevent re-fire loops.
    useEffect(() => {
        if (userRemovedAutoApply || isApplied) return;
        if (!ticketDataLoaded) return;
        if (!discoveredPromoCode?.auto_apply) return;
        if (discoveredPromoCodes.length !== 1) return;

        tryAutoApply(null).then(success => {
            if (!success) setUserRemovedAutoApply(true);
        });
    }, [userRemovedAutoApply, ticketDataLoaded, discoveredPromoCode, discoveredPromoCodes, isApplied, tryAutoApply]);

    const onApply = useCallback(async (code, ticket, quantity) => {
        setApiError(null);
        setApplyingCode(true);
        try {
            await applyPromoCode(code);
        } catch (e) {
            handleValidationError(e);
            setApplyingCode(false);
            return;
        }
        if (ticket) {
            await onRevalidate(ticket, quantity);
        }
        setApplyingCode(false);
    }, [applyPromoCode, onRevalidate, handleValidationError]);

    const onRemove = useCallback(() => {
        if (isAutoApplied || isDiscoveredCode) setUserRemovedAutoApply(true);

        setIsAutoApplied(false);
        setApiError(null);
        setSuggestionDismissed(false);
        if (discoveredPromoCode) setSuggestionActive(true);

        setFormPromoCode('');

        removePromoCode();
    }, [isAutoApplied, isDiscoveredCode, discoveredPromoCode, removePromoCode, setFormPromoCode]);

    const onInputChange = useCallback((value) => {
        setApiError(null);
        setSuggestionDismissed(value !== discoveredPromoCode?.code);
        setFormPromoCode(value);
    }, [discoveredPromoCode, setFormPromoCode]);

    return {
        state: {
            // Display status (pure projection of the signals below)
            status,
            // Canonical signals
            isReady,
            isSuggested,
            validationError,
            // True while applyPromoCode is in flight (covers the window where
            // promoCode is set but the refreshed ticketTypes haven't landed
            // yet). Callers should defer ticket-list-driven side effects
            // until this clears to avoid acting on a stale list.
            applyingCode,

            // Applied code origin
            isDiscoveredCode,
            isAutoApplied,

            // Discovery / suggestion
            suggestedCode,
            // Predicate the caller can use to find a ticket the discovered
            // promo applies to (auto-selection after auto-apply, ticket
            // switching on Apply).
            isCodeValidForTicket,

            // Quantity caps from the active discovered code
            maxQuantityFromPromo,
            perAccountLimit,
        },
        actions: {
            // Ordered by lifecycle: input → apply → ticket change → revalidate → remove
            onInputChange,
            onApply,
            onTicketSelected,
            onRevalidate,
            onRemove,
        },
    };
};

export default usePromoCode;
