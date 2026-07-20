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
    promoCodeValidating: false,
    applyPromoCode: jest.fn(() => Promise.resolve()),
    removePromoCode: jest.fn(),
    validatePromoCode: jest.fn(() => Promise.resolve()),
    setFormPromoCode: jest.fn(),
    ...overrides,
});

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

    it('returns APPLYING when code applied and promoCodeVerified is null', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'CODE', promoCodeVerified: null }))
        );
        expect(result.current.state.status).toBe(PROMO_STATUS.APPLYING);
    });

    it('returns VALIDATING when code applied and promoCodeValidating is true', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'CODE', promoCodeValidating: true }))
        );
        expect(result.current.state.status).toBe(PROMO_STATUS.VALIDATING);
    });

    it('returns VALID when code applied and promoCodeVerified is true', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'CODE', promoCodeVerified: true }))
        );
        expect(result.current.state.status).toBe(PROMO_STATUS.VALID);
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

    it('isReady true for VALID', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'CODE', promoCodeVerified: true }))
        );
        expect(result.current.state.isReady).toBe(true);
    });

    it('isReady false for APPLYING', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'CODE', promoCodeVerified: null }))
        );
        expect(result.current.state.isReady).toBe(false);
    });

    it('isReady false for VALIDATING', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'CODE', promoCodeValidating: true }))
        );
        expect(result.current.state.isReady).toBe(false);
    });

    it('isReady false for INVALID', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'CODE', promoCodeVerified: false }))
        );
        expect(result.current.state.isReady).toBe(false);
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

// ── isDiscoveredCode ──

describe('isDiscoveredCode', () => {
    it('true when applied code matches discovered code', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: mockDiscoveredCodes,
                promoCode: 'AUTO1',
                promoCodeVerified: true,
            }))
        );
        expect(result.current.state.isDiscoveredCode).toBe(true);
    });

    it('false when applied code does not match discovered code', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: mockDiscoveredCodes,
                promoCode: 'MANUAL',
                promoCodeVerified: true,
            }))
        );
        expect(result.current.state.isDiscoveredCode).toBe(false);
    });

    it('false when no code applied', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ discoveredPromoCodes: mockDiscoveredCodes }))
        );
        expect(result.current.state.isDiscoveredCode).toBe(false);
    });

    it('false when no discovered codes', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'CODE', promoCodeVerified: true }))
        );
        expect(result.current.state.isDiscoveredCode).toBe(false);
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
    it('returns true on successful validation', async () => {
        const validatePromoCode = jest.fn(() => Promise.resolve());
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ validatePromoCode }))
        );

        let valid;
        await act(async () => {
            valid = await result.current.actions.onRevalidate(mockTicketQualifying, 3);
        });
        expect(valid).toBe(true);
        expect(validatePromoCode).toHaveBeenCalledWith(
            expect.objectContaining({ id: 1, ticketQuantity: 3, sub_type: 'Regular' })
        );
    });

    it('returns false and sets validationError on failure', async () => {
        const validatePromoCode = jest.fn(() => Promise.reject({
            res: { body: { errors: ['Promo code X can not be applied more than 3 times.'] } }
        }));
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ validatePromoCode }))
        );

        let valid;
        await act(async () => {
            valid = await result.current.actions.onRevalidate(mockTicketQualifying, 5);
        });
        expect(valid).toBe(false);
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

    it('stays APPLYING while ticket data is still loading', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                promoCode: 'PENDING',
                promoCodeVerified: null,
                ticketDataLoaded: false,
                hasTickets: false,
            }))
        );
        expect(result.current.state.status).toBe(PROMO_STATUS.APPLYING);
    });
});

// The exact set of fields the widget requests from the server in
// actions.js#discoverPromoCodes (via the `fields` and `relations` params).
// Any field this hook reads on a discovered promo code MUST be in this
// list — otherwise it will arrive as undefined in production, even though
// tests that hand-build fixture objects will keep passing.
const REQUESTED_SCALAR_FIELDS = [
    'code',
    'auto_apply',
    'quantity_per_account',
    'remaining_quantity_per_account',
    'quantity_available',
];
const REQUESTED_RELATIONS = ['allowed_ticket_types'];

// Why this block exists:
//   discoverPromoCodes asks the server for a narrow subset of fields. If a
//   future change to usePromoCode starts reading a field that isn't on the
//   requested list, the field is undefined at runtime — but a normal unit
//   test would still pass because its fixture object was built by hand and
//   happens to include the field. Static grep can miss aliases, computed
//   access, spread and destructuring. This block catches all of that by
//   wrapping the fixture in a Proxy and observing what JavaScript actually
//   reads while the hook runs through its full lifecycle.
//
// How it works:
//   - `observe(target)` returns a Proxy that records every read, `in` check,
//     and enumeration (`{...code}`, `Object.keys`, `JSON.stringify`).
//   - Enumeration ops record a sentinel (`__enumeration__`) rather than a
//     field name, because they leak the whole shape and there's no single
//     field to blame.
//   - `exerciseFlows` drives the hook through auto-apply, ticket
//     qualification, quantity caps, manual entry, and removal.
//   - The assertion demands every recorded key is in the requested list.
describe('every field the hook reads on a discovered promo code is one the API request asks for', () => {
    const observe = (target, accessed) => new Proxy(target, {
        get(t, prop) {
            if (typeof prop === 'string') accessed.add(prop);
            return t[prop];
        },
        has(t, prop) {
            if (typeof prop === 'string') accessed.add(prop);
            return Reflect.has(t, prop);
        },
        ownKeys(t) {
            accessed.add('__enumeration__');
            return Reflect.ownKeys(t);
        },
        getOwnPropertyDescriptor(t, prop) {
            accessed.add('__enumeration__');
            return Reflect.getOwnPropertyDescriptor(t, prop);
        },
    });

    const REQUESTED = new Set([...REQUESTED_SCALAR_FIELDS, ...REQUESTED_RELATIONS]);
    // Keys that fire on any object regardless of consumer code, and so
    // shouldn't count as a "field access." `then` is checked by `await` /
    // `Promise.resolve`; `toJSON` is probed by `JSON.stringify` (and the
    // real leak from stringify is already caught via __enumeration__).
    const IGNORED_KEYS = new Set(['then', 'toJSON']);
    const isFieldAccess = (k) => !IGNORED_KEYS.has(k);

    const exerciseFlows = async (proxiedCode, extraProps = {}) => {
        const applyPromoCode = jest.fn(() => Promise.resolve());
        const validatePromoCode = jest.fn(() => Promise.resolve());
        const removePromoCode = jest.fn();
        const setFormPromoCode = jest.fn();
        const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

        const baseProps = createDefaultProps({
            discoveredPromoCodes: [proxiedCode],
            applyPromoCode,
            validatePromoCode,
            removePromoCode,
            setFormPromoCode,
            ticketDataLoaded: true,
            ...extraProps,
        });

        const { result, rerender } = renderHook((p) => usePromoCode(p), {
            initialProps: baseProps,
        });

        // Early auto-apply effect fires
        await act(async () => { await flushPromises(); });

        // Simulate Redux state update after auto-apply
        const appliedProps = { ...baseProps, promoCode: proxiedCode.code, promoCodeVerified: true };
        rerender(appliedProps);

        // Read every state field the hook exposes (some are memoised — force
        // them to compute by touching them)
        void result.current.state.status;
        void result.current.state.suggestedCode;
        void result.current.state.isDiscoveredCode;
        void result.current.state.isAutoApplied;
        void result.current.state.maxQuantityFromPromo;
        void result.current.state.perAccountLimit;
        void result.current.state.validationError;
        void result.current.state.isReady;

        // Ticket qualification against a matching + non-matching id
        result.current.state.isCodeValidForTicket({ id: 1 });
        result.current.state.isCodeValidForTicket({ id: 999 });

        // Ticket selection (auto-apply path + revalidation path)
        await act(async () => {
            await result.current.actions.onTicketSelected({ id: 1, sub_type: 'Regular' });
        });

        // Input change + suggestion dismiss/restore
        act(() => { result.current.actions.onInputChange(proxiedCode.code); });
        act(() => { result.current.actions.onInputChange('different'); });

        // Removal
        act(() => { result.current.actions.onRemove(); });
    };

    it('reads no field outside the requested list across the full hook lifecycle', async () => {
        const accessed = new Set();
        const proxied = observe({
            code: 'AUDIT_CODE',
            auto_apply: true,
            allowed_ticket_types: [{ id: 1 }],
            quantity_per_account: 5,
            remaining_quantity_per_account: 3,
            quantity_available: 20,
        }, accessed);

        await exerciseFlows(proxied);

        const fieldAccesses = [...accessed].filter(isFieldAccess);
        const outsideWhitelist = fieldAccesses.filter((f) => !REQUESTED.has(f));

        // If this fails, either add the new field to the `fields` /
        // `relations` params in actions.js#discoverPromoCodes OR remove the
        // stray access from the hook.
        expect(outsideWhitelist).toEqual([]);
        // Belt-and-suspenders: the recorded set equals the subset of the
        // requested list that this run actually touched. Skipped when the
        // first assertion fires.
        expect([...accessed].filter(isFieldAccess).sort()).toEqual(
            [...REQUESTED].filter((f) => fieldAccesses.includes(f)).sort()
        );
    });

    it('actually exercises the hook — at least code, auto_apply, and allowed_ticket_types are read', async () => {
        const accessed = new Set();
        const proxied = observe({
            code: 'AUDIT_CODE',
            auto_apply: false, // suggestion path, not auto-apply
            allowed_ticket_types: [{ id: 1 }],
            quantity_per_account: 5,
            remaining_quantity_per_account: 3,
            quantity_available: 20,
        }, accessed);

        await exerciseFlows(proxied);

        const fieldAccesses = new Set([...accessed].filter(isFieldAccess));
        // Guards the audit from silently degrading into a no-op. If
        // exerciseFlows ever stopped driving the hook (or the Proxy stopped
        // observing), the previous test could pass trivially with an empty
        // access set. These three reads happen in every meaningful run of
        // usePromoCode; requiring them means the audit is doing real work.
        expect(fieldAccesses.has('code')).toBe(true);
        expect(fieldAccesses.has('auto_apply')).toBe(true);
        expect(fieldAccesses.has('allowed_ticket_types')).toBe(true);
    });
});
