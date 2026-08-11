import { renderHook, act } from '@testing-library/react-hooks';
import T from 'i18n-react';
import usePromoCode from '../usePromoCode';
import { PROMO_STATUS } from '../../utils/constants';

T.setTexts(require('../../i18n/en.json'));

const mockDiscoveredCodes = [
    {
        code: 'SUGGEST1',
        auto_apply: false,
        allowed_ticket_types: [{ id: 1 }, { id: 2 }],
        quantity_per_account: 3,
        remaining_quantity_per_account: 2,
        quantity_available: 10,
        allows_to_reassign: true,
    },
    {
        code: 'AUTO1',
        auto_apply: true,
        allowed_ticket_types: [{ id: 1 }],
        quantity_per_account: 5,
        remaining_quantity_per_account: 4,
        quantity_available: 100,
        allows_to_reassign: false,
    },
];

const mockTicketQualifying = { id: 1, sub_type: 'Regular' };
const mockTicketNonQualifying = { id: 99, sub_type: 'Regular' };

const createDefaultProps = (overrides = {}) => ({
    discoveredPromoCodes: [],
    promoCode: '',
    promoCodeVerified: null,
    applyPromoCode: jest.fn(() => Promise.resolve()),
    removePromoCode: jest.fn(),
    validatePromoCode: jest.fn(() => Promise.resolve()),
    setFormPromoCode: jest.fn(),
    ...overrides,
});

// Lets a test hold a validation open and decide when (and how) it ends, so
// in-flight state is produced by an actual pending request rather than asserted
// from a value handed to the hook.
const deferred = () => {
    let settle = {};
    const promise = new Promise((resolve, reject) => { settle = { resolve, reject }; });
    // Nothing here awaits a rejection before it is attached below.
    promise.catch(() => {});
    return { promise, ...settle };
};

// ── Discovery selection ──

describe('discovery selection', () => {
    it('picks first auto_apply code', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ discoveredPromoCodes: mockDiscoveredCodes }))
        );
        expect(result.current.state.suggestedCode).toBe('AUTO1');
    });

    it('falls back to first code when none has auto_apply', () => {
        const codes = [{ code: 'A', auto_apply: false }, { code: 'B', auto_apply: false }];
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ discoveredPromoCodes: codes }))
        );
        expect(result.current.state.suggestedCode).toBe('A');
    });

    it('returns null for empty array', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ discoveredPromoCodes: [] }))
        );
        expect(result.current.state.suggestedCode).toBeNull();
    });
});

// ── Status derivation ──

describe('status derivation', () => {
    it('returns IDLE when no code and no suggestion', () => {
        const { result } = renderHook(() => usePromoCode(createDefaultProps()));
        expect(result.current.state.status).toBe(PROMO_STATUS.IDLE);
    });

    it('returns PROCESSING when code applied and ticket data has not loaded yet', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'CODE', promoCodeVerified: null }))
        );
        expect(result.current.state.status).toBe(PROMO_STATUS.PROCESSING);
    });

    it('returns PROCESSING while a validation is in flight, and stops when it ends', async () => {
        // ticketDataLoaded/promoCodeVerified are set so the other two inputs to
        // isBusy are already false: the only thing that can produce PROCESSING
        // here is the pending validation itself.
        const pending = deferred();
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                promoCode: 'CODE',
                promoCodeVerified: true,
                ticketDataLoaded: true,
                hasTickets: true,
                validatePromoCode: jest.fn(() => pending.promise),
            }))
        );
        expect(result.current.state.status).toBe(PROMO_STATUS.APPLIED);

        act(() => { result.current.actions.onRevalidate(mockTicketQualifying, 1); });
        expect(result.current.state.status).toBe(PROMO_STATUS.PROCESSING);

        await act(async () => { pending.resolve(); });
        expect(result.current.state.status).toBe(PROMO_STATUS.APPLIED);
    });

    it('returns PROCESSING during re-validation after a failed verdict', () => {
        // A rejected verdict stays in the store while a re-validation runs, so
        // both signals coexist. In-flight must win over the stale verdict:
        // spinner, not error icon.
        const pending = deferred();
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                promoCode: 'CODE',
                promoCodeVerified: false,
                ticketDataLoaded: true,
                hasTickets: true,
                validatePromoCode: jest.fn(() => pending.promise),
            }))
        );
        expect(result.current.state.status).toBe(PROMO_STATUS.INVALID);

        act(() => { result.current.actions.onRevalidate(mockTicketQualifying, 1); });
        expect(result.current.state.status).toBe(PROMO_STATUS.PROCESSING);
        expect(result.current.state.validationError).toBeNull();
    });

    it('stops PROCESSING when the validation fails without a verdict', async () => {
        // A server error, a timeout or a dropped connection never reaches the
        // reducer. If the hook does not clear its own flag the field spins for
        // the rest of the session.
        const pending = deferred();
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                promoCode: 'CODE',
                promoCodeVerified: true,
                ticketDataLoaded: true,
                hasTickets: true,
                validatePromoCode: jest.fn(() => pending.promise),
            }))
        );

        act(() => { result.current.actions.onRevalidate(mockTicketQualifying, 1); });
        expect(result.current.state.status).toBe(PROMO_STATUS.PROCESSING);

        await act(async () => { pending.reject({ res: { body: { message: 'Server error' } } }); });
        expect(result.current.state.status).not.toBe(PROMO_STATUS.PROCESSING);
        expect(result.current.state.validationError).toBe('Server error');
    });

    it('returns APPLIED when code verified for the selected ticket', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'CODE', promoCodeVerified: true }))
        );
        expect(result.current.state.status).toBe(PROMO_STATUS.APPLIED);
    });

    it('returns UNVERIFIED when code applied with tickets available but none picked yet', () => {
        // Code was applied without a ticket selected: the ticket list came back
        // non-empty, nothing is in flight, and no per-ticket validation has run.
        // A resting state, but not a verified one: the catalog comes back
        // populated even for a code that does not exist, so this must not
        // render as success.
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                promoCode: 'CODE',
                promoCodeVerified: null,
                ticketDataLoaded: true,
                hasTickets: true,
            }))
        );
        expect(result.current.state.status).toBe(PROMO_STATUS.UNVERIFIED);
    });

    it('returns UNVERIFIED when a verified code has an outstanding request error', async () => {
        // A rate-limited or timed-out re-validation leaves promoCodeVerified at
        // its previous value while setting an error. The last verdict no longer
        // covers the current selection, so it must not render as success.
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                promoCode: 'CODE',
                promoCodeVerified: true,
                ticketDataLoaded: true,
                hasTickets: true,
                validatePromoCode: jest.fn(() => Promise.reject({ res: { body: { errors: ['Too many requests'] } } })),
            }))
        );
        expect(result.current.state.status).toBe(PROMO_STATUS.APPLIED);

        await act(async () => {
            await result.current.actions.onTicketSelected({ id: 1, sub_type: 'Regular' });
        });
        expect(result.current.state.status).toBe(PROMO_STATUS.UNVERIFIED);
        expect(result.current.state.validationError).toBe('Too many requests');
    });

    it('ignores a validation response that a later ticket switch superseded', async () => {
        // Ticket A's request stays pending while ticket B's succeeds. When A
        // then rejects, its error is about a ticket the user already left, so
        // it must not surface or block the advance gate.
        let rejectFirst;
        const validatePromoCode = jest.fn()
            .mockImplementationOnce(() => new Promise((_, reject) => { rejectFirst = reject; }))
            .mockImplementationOnce(() => Promise.resolve());

        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                promoCode: 'CODE',
                promoCodeVerified: true,
                ticketDataLoaded: true,
                hasTickets: true,
                validatePromoCode,
            }))
        );

        let firstAttempt;
        await act(async () => {
            firstAttempt = result.current.actions.onTicketSelected({ id: 1, sub_type: 'Regular' });
            await result.current.actions.onTicketSelected({ id: 2, sub_type: 'Regular' });
        });

        await act(async () => {
            rejectFirst({ res: { body: { errors: ['stale failure'] } } });
            await firstAttempt;
        });

        expect(result.current.state.validationError).toBeNull();
        expect(result.current.state.isReady).toBe(true);
        expect(result.current.state.status).toBe(PROMO_STATUS.APPLIED);
    });

    it('does not let a superseded attempt advance the caller', async () => {
        let resolveFirst;
        const validatePromoCode = jest.fn()
            .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
            .mockImplementationOnce(() => Promise.resolve());
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ validatePromoCode }))
        );

        let firstAttempt;
        await act(async () => {
            firstAttempt = result.current.actions.onRevalidate({ id: 1, sub_type: 'Regular' }, 1);
            await result.current.actions.onRevalidate({ id: 2, sub_type: 'Regular' }, 1);
        });

        let canAdvance;
        await act(async () => {
            resolveFirst();
            canAdvance = await firstAttempt;
        });
        expect(canAdvance).toBe(false);
    });

    it('returns INVALID when code applied and promoCodeVerified is false', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'CODE', promoCodeVerified: false }))
        );
        expect(result.current.state.status).toBe(PROMO_STATUS.INVALID);
    });

    it('returns SUGGESTED after selecting qualifying ticket with discovered codes', async () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ discoveredPromoCodes: [{ code: 'S1', auto_apply: false, allowed_ticket_types: [{ id: 1 }] }] }))
        );
        await act(async () => {
            await result.current.actions.onTicketSelected(mockTicketQualifying);
        });
        expect(result.current.state.status).toBe(PROMO_STATUS.SUGGESTED);
    });

    it('returns IDLE when suggestion dismissed by user input', async () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ discoveredPromoCodes: [{ code: 'S1', auto_apply: false, allowed_ticket_types: [{ id: 1 }] }] }))
        );
        await act(async () => {
            await result.current.actions.onTicketSelected(mockTicketQualifying);
        });
        expect(result.current.state.status).toBe(PROMO_STATUS.SUGGESTED);

        act(() => {
            result.current.actions.onInputChange('different');
        });
        expect(result.current.state.status).toBe(PROMO_STATUS.IDLE);
    });
});

// ── Derived values ──

describe('derived values', () => {
    it('isReady true for IDLE', () => {
        const { result } = renderHook(() => usePromoCode(createDefaultProps()));
        expect(result.current.state.isReady).toBe(true);
    });

    it('isReady true for verified code', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'CODE', promoCodeVerified: true }))
        );
        expect(result.current.state.isReady).toBe(true);
    });

    it('isReady true for applied code awaiting ticket selection', () => {
        // Promo layer is settled; ticket selection is enforced by its own gate.
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                promoCode: 'CODE',
                promoCodeVerified: null,
                ticketDataLoaded: true,
                hasTickets: true,
            }))
        );
        expect(result.current.state.isReady).toBe(true);
    });

    it('isReady false while ticket data is loading', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'CODE', promoCodeVerified: null }))
        );
        expect(result.current.state.isReady).toBe(false);
    });

    it('isReady false while validation is in flight', () => {
        const pending = deferred();
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                promoCode: 'CODE',
                promoCodeVerified: true,
                ticketDataLoaded: true,
                hasTickets: true,
                validatePromoCode: jest.fn(() => pending.promise),
            }))
        );
        expect(result.current.state.isReady).toBe(true);

        act(() => { result.current.actions.onRevalidate(mockTicketQualifying, 1); });
        expect(result.current.state.isReady).toBe(false);
    });

    it('isReady false for INVALID', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'CODE', promoCodeVerified: false }))
        );
        expect(result.current.state.isReady).toBe(false);
    });

    it('isReady stays true after a request error so the user can retry', async () => {
        // A failed request leaves no verdict, so it must not latch the gate
        // shut: the user has to be able to try again. Not proceeding on an
        // unverified code is enforced by re-validating on advance and refusing
        // to move on unless it succeeds, which is covered end to end.
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                promoCode: 'CODE',
                promoCodeVerified: null,
                ticketDataLoaded: true,
                hasTickets: true,
                validatePromoCode: jest.fn(() => Promise.reject({ res: { body: { errors: ['Too many requests'] } } })),
            }))
        );
        expect(result.current.state.isReady).toBe(true);

        await act(async () => {
            await result.current.actions.onTicketSelected({ id: 1, sub_type: 'Regular' });
        });
        expect(result.current.state.isReady).toBe(true);
        // The failure is still reported, it just doesn't disable the gate.
        expect(result.current.state.validationError).toBe('Too many requests');
    });

    it('onRevalidate refuses to advance when the request fails', async () => {
        // The gate that replaced isReady's error check.
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                promoCode: 'CODE',
                promoCodeVerified: null,
                ticketDataLoaded: true,
                hasTickets: true,
                validatePromoCode: jest.fn(() => Promise.reject({ res: { body: { message: 'Server error' } } })),
            }))
        );

        let canAdvance;
        await act(async () => {
            canAdvance = await result.current.actions.onRevalidate({ id: 1, sub_type: 'Regular' }, 1);
        });
        expect(canAdvance).toBe(false);
    });

    it('perAccountLimit from active discovered code when valid', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: mockDiscoveredCodes,
                promoCode: 'AUTO1',
                promoCodeVerified: true,
            }))
        );
        expect(result.current.state.perAccountLimit).toBe(4);
    });

    it('perAccountLimit null when no active discovered code', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'MANUAL', promoCodeVerified: true }))
        );
        expect(result.current.state.perAccountLimit).toBeNull();
    });

    it('perAccountLimit null when code not verified', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: mockDiscoveredCodes,
                promoCode: 'AUTO1',
                promoCodeVerified: null,
            }))
        );
        expect(result.current.state.perAccountLimit).toBeNull();
    });
});

// ── onTicketSelected ──

describe('onTicketSelected', () => {
    it('sets suggestionActive for qualifying ticket', async () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ discoveredPromoCodes: [{ code: 'S1', auto_apply: false, allowed_ticket_types: [{ id: 1 }] }] }))
        );
        await act(async () => {
            await result.current.actions.onTicketSelected(mockTicketQualifying);
        });
        expect(result.current.state.status).toBe(PROMO_STATUS.SUGGESTED);
    });

    it('does not suggest for non-qualifying ticket', async () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ discoveredPromoCodes: [{ code: 'S1', auto_apply: false, allowed_ticket_types: [{ id: 1 }] }] }))
        );
        await act(async () => {
            await result.current.actions.onTicketSelected(mockTicketNonQualifying);
        });
        expect(result.current.state.status).toBe(PROMO_STATUS.IDLE);
    });

    it('auto-applies when single code + qualifying + auto_apply', async () => {
        const singleCode = [mockDiscoveredCodes[1]]; // AUTO1 only
        const applyPromoCode = jest.fn(() => Promise.resolve());
        const validatePromoCode = jest.fn(() => Promise.resolve());
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: singleCode,
                applyPromoCode,
                validatePromoCode,
            }))
        );
        await act(async () => {
            await result.current.actions.onTicketSelected(mockTicketQualifying);
        });
        expect(applyPromoCode).toHaveBeenCalledWith('AUTO1');
        expect(validatePromoCode).toHaveBeenCalled();
        expect(result.current.state.isAutoApplied).toBe(true);
    });

    it('does not auto-apply when multiple codes are returned', async () => {
        const applyPromoCode = jest.fn(() => Promise.resolve());
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: mockDiscoveredCodes,
                applyPromoCode,
            }))
        );
        await act(async () => {
            await result.current.actions.onTicketSelected(mockTicketQualifying);
        });
        expect(applyPromoCode).not.toHaveBeenCalled();
        expect(result.current.state.isAutoApplied).toBe(false);
    });

    it('does not auto-apply after user removed auto-applied code', async () => {
        const singleCode = [mockDiscoveredCodes[1]]; // AUTO1 only
        const applyPromoCode = jest.fn(() => Promise.resolve());
        const props = createDefaultProps({
            discoveredPromoCodes: singleCode,
            applyPromoCode,
        });
        const { result, rerender } = renderHook((p) => usePromoCode(p), { initialProps: props });

        // First: auto-apply
        await act(async () => {
            await result.current.actions.onTicketSelected(mockTicketQualifying);
        });
        expect(applyPromoCode).toHaveBeenCalledTimes(1);

        // Simulate code was applied (update props)
        rerender({ ...props, promoCode: 'AUTO1', promoCodeVerified: true });

        // Remove
        act(() => {
            result.current.actions.onRemove();
        });

        // Clear promoCode (simulate Redux update)
        rerender({ ...props, promoCode: '' });
        applyPromoCode.mockClear();

        // Re-select same ticket - should NOT auto-apply
        await act(async () => {
            await result.current.actions.onTicketSelected(mockTicketQualifying);
        });
        expect(applyPromoCode).not.toHaveBeenCalled();
        // But suggestion should show
        expect(result.current.state.status).toBe(PROMO_STATUS.SUGGESTED);
    });

    it('re-validates discovered code when switching to non-qualifying ticket', async () => {
        const validatePromoCode = jest.fn(() => Promise.resolve());
        const removePromoCode = jest.fn();
        const props = createDefaultProps({
            discoveredPromoCodes: mockDiscoveredCodes,
            promoCode: 'AUTO1',
            promoCodeVerified: true,
            validatePromoCode,
            removePromoCode,
        });
        const { result } = renderHook(() => usePromoCode(props));

        await act(async () => {
            await result.current.actions.onTicketSelected(mockTicketNonQualifying);
        });
        // Per c60b30e: surface backend rejection instead of silently removing.
        expect(validatePromoCode).toHaveBeenCalled();
        expect(removePromoCode).not.toHaveBeenCalled();
    });

    it('re-validates discovered code when ticket is not in allowed list', async () => {
        const validatePromoCode = jest.fn(() => Promise.resolve());
        const removePromoCode = jest.fn();
        const ticket2 = { id: 2, sub_type: 'Regular' };
        const props = createDefaultProps({
            discoveredPromoCodes: mockDiscoveredCodes,
            promoCode: 'AUTO1',
            promoCodeVerified: true,
            validatePromoCode,
            removePromoCode,
        });
        const { result } = renderHook(() => usePromoCode(props));

        await act(async () => {
            await result.current.actions.onTicketSelected(ticket2);
        });
        // AUTO1 allowed_ticket_types is [{ id: 1 }], ticket2 has id: 2.
        // Backend decides — hook re-validates rather than removing client-side.
        expect(validatePromoCode).toHaveBeenCalled();
        expect(removePromoCode).not.toHaveBeenCalled();
    });

    it('re-validates manual code when switching tickets', async () => {
        const validatePromoCode = jest.fn(() => Promise.resolve());
        const props = createDefaultProps({
            promoCode: 'MANUAL',
            promoCodeVerified: true,
            validatePromoCode,
        });
        const { result } = renderHook(() => usePromoCode(props));

        await act(async () => {
            await result.current.actions.onTicketSelected(mockTicketQualifying);
        });
        expect(validatePromoCode).toHaveBeenCalledWith(
            expect.objectContaining({ id: 1, ticketQuantity: 1 })
        );
    });

    it('shows error and resets isAutoApplied when discovered code re-validation fails', async () => {
        const validatePromoCode = jest.fn(() => Promise.reject({
            res: { body: { errors: ['Code expired'] } }
        }));
        const props = createDefaultProps({
            discoveredPromoCodes: mockDiscoveredCodes,
            promoCode: 'AUTO1',
            promoCodeVerified: true,
            validatePromoCode,
        });
        const { result, rerender } = renderHook((p) => usePromoCode(p), { initialProps: props });

        // Simulate auto-applied state
        await act(async () => {
            await result.current.actions.onTicketSelected(mockTicketQualifying);
        });

        // Re-render with applied state
        rerender({ ...props, promoCode: 'AUTO1', promoCodeVerified: true });

        // Switch to another qualifying ticket, validation fails
        await act(async () => {
            await result.current.actions.onTicketSelected(mockTicketQualifying);
        });
        expect(result.current.state.validationError).toBe('Code expired');
        expect(result.current.state.isAutoApplied).toBe(false);
    });

    it('shows error when auto-apply validation fails', async () => {
        const singleCode = [mockDiscoveredCodes[1]]; // AUTO1 only
        const applyPromoCode = jest.fn(() => Promise.resolve());
        const validatePromoCode = jest.fn(() => Promise.reject({
            res: { body: { errors: ['Quantity exceeded'] } }
        }));
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: singleCode,
                applyPromoCode,
                validatePromoCode,
            }))
        );

        await act(async () => {
            await result.current.actions.onTicketSelected(mockTicketQualifying);
        });
        expect(result.current.state.validationError).toBe('Quantity exceeded');
        expect(result.current.state.isAutoApplied).toBe(false);
    });

    it('shows error when manual code re-validation fails on ticket switch', async () => {
        const validatePromoCode = jest.fn(() => Promise.reject({
            res: { body: { errors: ['Not valid for this ticket type'] } }
        }));
        const props = createDefaultProps({
            promoCode: 'MANUAL',
            promoCodeVerified: true,
            validatePromoCode,
        });
        const { result } = renderHook(() => usePromoCode(props));

        await act(async () => {
            await result.current.actions.onTicketSelected(mockTicketQualifying);
        });
        expect(result.current.state.validationError).toBe('Not valid for this ticket type');
    });
});

// ── onApply ──

describe('onApply', () => {
    it('calls applyPromoCode then validatePromoCode', async () => {
        const applyPromoCode = jest.fn(() => Promise.resolve());
        const validatePromoCode = jest.fn(() => Promise.resolve());
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ applyPromoCode, validatePromoCode }))
        );

        await act(async () => {
            await result.current.actions.onApply('CODE', mockTicketQualifying, 1);
        });
        expect(applyPromoCode).toHaveBeenCalledWith('CODE');
        expect(validatePromoCode).toHaveBeenCalledWith(
            expect.objectContaining({ id: 1, ticketQuantity: 1 })
        );
    });

    it('returns early if applyPromoCode fails', async () => {
        const applyPromoCode = jest.fn(() => Promise.reject(new Error('fail')));
        const validatePromoCode = jest.fn();
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ applyPromoCode, validatePromoCode }))
        );

        await act(async () => {
            await result.current.actions.onApply('CODE', mockTicketQualifying, 1);
        });
        expect(validatePromoCode).not.toHaveBeenCalled();
    });

    it('sets validationError on validation failure', async () => {
        const applyPromoCode = jest.fn(() => Promise.resolve());
        const validatePromoCode = jest.fn(() => Promise.reject({
            res: { body: { errors: ['Some validation error'] } }
        }));
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ applyPromoCode, validatePromoCode }))
        );

        await act(async () => {
            await result.current.actions.onApply('CODE', mockTicketQualifying, 1);
        });
        expect(result.current.state.validationError).toBe('Some validation error');
    });
});

// ── onRemove ──

describe('onRemove', () => {
    it('tracks auto-apply removal', async () => {
        const singleCode = [mockDiscoveredCodes[1]]; // AUTO1 only
        const props = createDefaultProps({ discoveredPromoCodes: singleCode });
        const { result, rerender } = renderHook((p) => usePromoCode(p), { initialProps: props });

        // Auto-apply
        await act(async () => {
            await result.current.actions.onTicketSelected(mockTicketQualifying);
        });
        expect(result.current.state.isAutoApplied).toBe(true);

        // Simulate applied state
        rerender({ ...props, promoCode: 'AUTO1', promoCodeVerified: true });

        // Remove
        act(() => {
            result.current.actions.onRemove();
        });

        expect(result.current.state.isAutoApplied).toBe(false);
    });

    it('clears the form promo code and removes the applied code', () => {
        const setFormPromoCode = jest.fn();
        const removePromoCode = jest.fn();
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ setFormPromoCode, removePromoCode }))
        );

        act(() => {
            result.current.actions.onRemove();
        });

        expect(setFormPromoCode).toHaveBeenCalledWith('');
        expect(removePromoCode).toHaveBeenCalled();
    });
});

// ── onInputChange ──

describe('onInputChange', () => {
    it('clears validationError', async () => {
        const applyPromoCode = jest.fn(() => Promise.resolve());
        const validatePromoCode = jest.fn(() => Promise.reject({
            res: { body: { errors: ['error'] } }
        }));
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ applyPromoCode, validatePromoCode }))
        );

        // Set an error first
        await act(async () => {
            await result.current.actions.onApply('CODE', mockTicketQualifying, 1);
        });
        expect(result.current.state.validationError).toBe('error');

        // Type clears it
        act(() => {
            result.current.actions.onInputChange('new');
        });
        expect(result.current.state.validationError).toBeNull();
    });

    it('dismisses suggestion when value differs from discovered code', async () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: [{ code: 'S1', auto_apply: false, allowed_ticket_types: [{ id: 1 }] }],
            }))
        );

        await act(async () => {
            await result.current.actions.onTicketSelected(mockTicketQualifying);
        });
        expect(result.current.state.status).toBe(PROMO_STATUS.SUGGESTED);

        act(() => {
            result.current.actions.onInputChange('different');
        });
        expect(result.current.state.status).toBe(PROMO_STATUS.IDLE);
    });

    it('restores suggestion when value matches discovered code', async () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: [{ code: 'S1', auto_apply: false, allowed_ticket_types: [{ id: 1 }] }],
            }))
        );

        await act(async () => {
            await result.current.actions.onTicketSelected(mockTicketQualifying);
        });

        act(() => {
            result.current.actions.onInputChange('different');
        });
        expect(result.current.state.status).toBe(PROMO_STATUS.IDLE);

        act(() => {
            result.current.actions.onInputChange('S1');
        });
        expect(result.current.state.status).toBe(PROMO_STATUS.SUGGESTED);
    });

    it('calls setFormPromoCode', () => {
        const setFormPromoCode = jest.fn();
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ setFormPromoCode }))
        );

        act(() => {
            result.current.actions.onInputChange('test');
        });
        expect(setFormPromoCode).toHaveBeenCalledWith('test');
    });

    it('dismisses suggestion when input is cleared', async () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: [{ code: 'S1', auto_apply: false, allowed_ticket_types: [{ id: 1 }] }],
            }))
        );

        await act(async () => {
            await result.current.actions.onTicketSelected(mockTicketQualifying);
        });
        expect(result.current.state.status).toBe(PROMO_STATUS.SUGGESTED);

        // Type exact discovered code then clear
        act(() => {
            result.current.actions.onInputChange('S1');
        });
        expect(result.current.state.status).toBe(PROMO_STATUS.SUGGESTED);

        act(() => {
            result.current.actions.onInputChange('');
        });
        expect(result.current.state.status).toBe(PROMO_STATUS.IDLE);
    });
});

// ── validationError ──

describe('validationError', () => {
    it('transforms "is not a valid code" messages', async () => {
        const applyPromoCode = jest.fn(() => Promise.resolve());
        const validatePromoCode = jest.fn(() => Promise.reject({
            res: { body: { errors: ['The Promo Code "XYZ" is not a valid code.'] } }
        }));
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ applyPromoCode, validatePromoCode }))
        );

        await act(async () => {
            await result.current.actions.onApply('XYZ', mockTicketQualifying, 1);
        });
        expect(result.current.state.validationError).toBe(T.translate('promo_code.invalid_code'));
    });

    it('passes through other error messages', async () => {
        const applyPromoCode = jest.fn(() => Promise.resolve());
        const validatePromoCode = jest.fn(() => Promise.reject({
            res: { body: { errors: ['Promo code XYZ can not be applied to Ticket Type Standard.'] } }
        }));
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ applyPromoCode, validatePromoCode }))
        );

        await act(async () => {
            await result.current.actions.onApply('XYZ', mockTicketQualifying, 1);
        });
        expect(result.current.state.validationError).toBe('Promo code XYZ can not be applied to Ticket Type Standard.');
    });

});

// ── maxQuantityFromPromo ──

describe('maxQuantityFromPromo', () => {
    it('returns tightest cap from remaining_quantity_per_account and quantity_available', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: mockDiscoveredCodes,
                promoCode: 'AUTO1',
                promoCodeVerified: true,
            }))
        );
        // remaining_quantity_per_account=4, quantity_available=100 → min is 4
        expect(result.current.state.maxQuantityFromPromo).toBe(4);
    });

    it('uses quantity_available when it is tighter', () => {
        const codes = [{
            code: 'LIMITED',
            auto_apply: true,
            allowed_ticket_types: [],
            quantity_per_account: 10,
            remaining_quantity_per_account: 8,
            quantity_available: 3,
        }];
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: codes,
                promoCode: 'LIMITED',
                promoCodeVerified: true,
            }))
        );
        // remaining=8, quantity_available=3 → min is 3
        expect(result.current.state.maxQuantityFromPromo).toBe(3);
    });

    it('null when no active discovered code', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'MANUAL', promoCodeVerified: true }))
        );
        expect(result.current.state.maxQuantityFromPromo).toBeNull();
    });

    it('null when code not verified', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: mockDiscoveredCodes,
                promoCode: 'AUTO1',
                promoCodeVerified: null,
            }))
        );
        expect(result.current.state.maxQuantityFromPromo).toBeNull();
    });

    it('uses only remaining_quantity_per_account when quantity_available is null (unlimited)', () => {
        const codes = [{
            code: 'UNLIM',
            auto_apply: true,
            allowed_ticket_types: [],
            quantity_per_account: 5,
            remaining_quantity_per_account: 3,
            quantity_available: null,
        }];
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: codes,
                promoCode: 'UNLIM',
                promoCodeVerified: true,
            }))
        );
        expect(result.current.state.maxQuantityFromPromo).toBe(3);
    });

    it('caps at 0 when quantity_available is 0 (sold out)', () => {
        const codes = [{
            code: 'SOLDOUT',
            auto_apply: true,
            allowed_ticket_types: [],
            quantity_per_account: 5,
            remaining_quantity_per_account: 3,
            quantity_available: 0,
        }];
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: codes,
                promoCode: 'SOLDOUT',
                promoCodeVerified: true,
            }))
        );
        expect(result.current.state.maxQuantityFromPromo).toBe(0);
    });

    it('uses only quantity_available when remaining_quantity_per_account is null', () => {
        const codes = [{
            code: 'NOACCOUNTLIMIT',
            auto_apply: true,
            allowed_ticket_types: [],
            quantity_per_account: 0,
            remaining_quantity_per_account: null,
            quantity_available: 5,
        }];
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: codes,
                promoCode: 'NOACCOUNTLIMIT',
                promoCodeVerified: true,
            }))
        );
        expect(result.current.state.maxQuantityFromPromo).toBe(5);
    });

    it('null when both limits are unlimited', () => {
        const codes = [{
            code: 'ALLFREE',
            auto_apply: true,
            allowed_ticket_types: [],
            quantity_per_account: 0,
            remaining_quantity_per_account: null,
            quantity_available: null,
        }];
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: codes,
                promoCode: 'ALLFREE',
                promoCodeVerified: true,
            }))
        );
        expect(result.current.state.maxQuantityFromPromo).toBeNull();
    });
});

// ── onRevalidate ──

describe('onRevalidate', () => {
    it('reports the caller may advance on success', async () => {
        // registration-form gates changeStep on this value, so a missing or
        // wrong return dead-ends the ticket step.
        const validatePromoCode = jest.fn(() => Promise.resolve());
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ validatePromoCode }))
        );

        let canAdvance;
        await act(async () => {
            canAdvance = await result.current.actions.onRevalidate(mockTicketQualifying, 3);
        });
        expect(canAdvance).toBe(true);
        expect(validatePromoCode).toHaveBeenCalledWith(
            expect.objectContaining({ id: 1, ticketQuantity: 3, sub_type: 'Regular' })
        );
        expect(result.current.state.validationError).toBeNull();
    });

    it('reports the caller may not advance on failure, and sets validationError', async () => {
        const validatePromoCode = jest.fn(() => Promise.reject({
            res: { body: { errors: ['Promo code X can not be applied more than 3 times.'] } }
        }));
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ validatePromoCode }))
        );

        let canAdvance;
        await act(async () => {
            canAdvance = await result.current.actions.onRevalidate(mockTicketQualifying, 5);
        });
        expect(canAdvance).toBe(false);
        expect(result.current.state.validationError).toBe('Promo code X can not be applied more than 3 times.');
    });

    it('clears previous validationError before validating', async () => {
        const validatePromoCode = jest.fn()
            .mockRejectedValueOnce({ res: { body: { errors: ['old error'] } } })
            .mockResolvedValueOnce();
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ validatePromoCode }))
        );

        // First call fails, leaving an error in state
        await act(async () => {
            await result.current.actions.onRevalidate(mockTicketQualifying, 1);
        });
        expect(result.current.state.validationError).toBe('old error');

        // Second call succeeds — should clear the previous error
        await act(async () => {
            await result.current.actions.onRevalidate(mockTicketQualifying, 1);
        });
        expect(result.current.state.validationError).toBeNull();
    });

    it('passes correct ticket data to validatePromoCode', async () => {
        const validatePromoCode = jest.fn(() => Promise.resolve());
        const ticket = { id: 42, sub_type: 'PrePaid' };
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ validatePromoCode }))
        );

        await act(async () => {
            await result.current.actions.onRevalidate(ticket, 7);
        });
        expect(validatePromoCode).toHaveBeenCalledWith({ id: 42, ticketQuantity: 7, sub_type: 'PrePaid' });
    });
});

// ── Early auto-apply (no-tickets-available scenario) ──

describe('early auto-apply', () => {
    const singleAutoApplyCode = [{
        code: 'AUTO1',
        auto_apply: true,
        allowed_ticket_types: [{ id: 1 }],
        quantity_per_account: 5,
        remaining_quantity_per_account: 4,
        quantity_available: 100,
    }];

    const flushPromises = () => new Promise(resolve => setImmediate(resolve));

    it('fires applyPromoCode when ticket data loaded with no tickets and a single auto_apply code', async () => {
        // After applyPromoCode resolves, simulate the Redux state update by
        // re-rendering with promoCode set (the real flow does this via dispatch).
        // Without it, the effect would re-fire on every render in this isolated test.
        const applyPromoCode = jest.fn(() => Promise.resolve());
        const baseProps = createDefaultProps({
            discoveredPromoCodes: singleAutoApplyCode,
            applyPromoCode,
            ticketDataLoaded: true,
            hasTickets: false,
        });
        const { rerender } = renderHook((props) => usePromoCode(props), { initialProps: baseProps });
        await act(async () => { await flushPromises(); });
        rerender({ ...baseProps, promoCode: 'AUTO1' });
        expect(applyPromoCode).toHaveBeenCalledWith('AUTO1');
    });

    it('fires even when tickets are already available (per SDS)', async () => {
        // Per a8590e2: the hasTickets gate was removed; single auto_apply codes
        // fire as soon as ticket data has loaded regardless of public availability.
        const applyPromoCode = jest.fn(() => Promise.resolve());
        const baseProps = createDefaultProps({
            discoveredPromoCodes: singleAutoApplyCode,
            applyPromoCode,
            ticketDataLoaded: true,
            hasTickets: true,
        });
        const { rerender } = renderHook((props) => usePromoCode(props), { initialProps: baseProps });
        await act(async () => { await flushPromises(); });
        rerender({ ...baseProps, promoCode: 'AUTO1' });
        expect(applyPromoCode).toHaveBeenCalledWith('AUTO1');
    });

    it('does not fire when ticket data is still loading', async () => {
        const applyPromoCode = jest.fn(() => Promise.resolve());
        renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: singleAutoApplyCode,
                applyPromoCode,
                ticketDataLoaded: false,
                hasTickets: false,
            }))
        );
        await act(async () => { await flushPromises(); });
        expect(applyPromoCode).not.toHaveBeenCalled();
    });

    it('does not fire when more than one code is discovered', async () => {
        const applyPromoCode = jest.fn(() => Promise.resolve());
        const codes = [
            ...singleAutoApplyCode,
            { code: 'AUTO2', auto_apply: true, allowed_ticket_types: [] },
        ];
        renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: codes,
                applyPromoCode,
                ticketDataLoaded: true,
                hasTickets: false,
            }))
        );
        await act(async () => { await flushPromises(); });
        expect(applyPromoCode).not.toHaveBeenCalled();
    });

    it('surfaces an error via handleValidationError when applyPromoCode rejects', async () => {
        const apiError = { res: { body: { errors: ['discovery code failed'] } } };
        const applyPromoCode = jest.fn(() => Promise.reject(apiError));
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: singleAutoApplyCode,
                applyPromoCode,
                ticketDataLoaded: true,
                hasTickets: false,
            }))
        );
        await act(async () => { await flushPromises(); });
        expect(applyPromoCode).toHaveBeenCalledWith('AUTO1');
        expect(result.current.state.validationError).toBe('discovery code failed');
    });
});

// ── INVALID status when applied code yields no tickets ──

describe('status: INVALID without ticket', () => {
    it('flips applied code with no tickets and ticketDataLoaded to INVALID', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                promoCode: 'BAD',
                promoCodeVerified: null,
                ticketDataLoaded: true,
                hasTickets: false,
            }))
        );
        expect(result.current.state.status).toBe(PROMO_STATUS.INVALID);
        expect(result.current.state.validationError).toBe(T.translate('promo_code.invalid_code'));
    });

    it('stays PROCESSING while ticket data is still loading', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                promoCode: 'PENDING',
                promoCodeVerified: null,
                ticketDataLoaded: false,
                hasTickets: false,
            }))
        );
        expect(result.current.state.status).toBe(PROMO_STATUS.PROCESSING);
    });
});

// ── Applied without ticket: transition out on ticket pick ──

describe('applied code awaiting ticket selection', () => {
    it('fires validatePromoCode when the user then picks a ticket', async () => {
        const validatePromoCode = jest.fn(() => Promise.resolve());
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                promoCode: 'MANUAL',
                promoCodeVerified: null,
                ticketDataLoaded: true,
                hasTickets: true,
                validatePromoCode,
            }))
        );
        expect(result.current.state.status).toBe(PROMO_STATUS.UNVERIFIED);
        await act(async () => {
            await result.current.actions.onTicketSelected({ id: 1, sub_type: 'Regular' });
        });
        expect(validatePromoCode).toHaveBeenCalledWith({ id: 1, ticketQuantity: 1, sub_type: 'Regular' });
    });
});

// ── isSuggested signal (consumed by registration-form) ──

describe('isSuggested', () => {
    it('true while the suggestion banner is showing', async () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: [{ code: 'S1', auto_apply: false, allowed_ticket_types: [{ id: 1 }] }],
            }))
        );
        await act(async () => {
            await result.current.actions.onTicketSelected(mockTicketQualifying);
        });
        expect(result.current.state.isSuggested).toBe(true);
    });

    it('false once a code is applied, even if the suggestion was active', async () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: [{ code: 'S1', auto_apply: false, allowed_ticket_types: [{ id: 1 }] }],
                promoCode: 'S1',
                promoCodeVerified: true,
            }))
        );
        expect(result.current.state.isSuggested).toBe(false);
    });
});
