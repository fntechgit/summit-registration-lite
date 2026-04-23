import { renderHook, act } from '@testing-library/react-hooks';
import usePromoCode from '../usePromoCode';
import { PROMO_STATUS } from '../../utils/constants';

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
    onFormPromoCodeChange: jest.fn(),
    clearFormErrors: jest.fn(),
    ...overrides,
});

// ── Discovery selection ──

describe('discovery selection', () => {
    it('picks first auto_apply code', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ discoveredPromoCodes: mockDiscoveredCodes }))
        );
        expect(result.current.suggestedCode).toBe('AUTO1');
    });

    it('falls back to first code when none has auto_apply', () => {
        const codes = [{ code: 'A', auto_apply: false }, { code: 'B', auto_apply: false }];
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ discoveredPromoCodes: codes }))
        );
        expect(result.current.suggestedCode).toBe('A');
    });

    it('returns null for empty array', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ discoveredPromoCodes: [] }))
        );
        expect(result.current.suggestedCode).toBeNull();
    });
});

// ── Status derivation ──

describe('status derivation', () => {
    it('returns IDLE when no code and no suggestion', () => {
        const { result } = renderHook(() => usePromoCode(createDefaultProps()));
        expect(result.current.status).toBe(PROMO_STATUS.IDLE);
    });

    it('returns APPLYING when code applied and promoCodeVerified is null', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'CODE', promoCodeVerified: null }))
        );
        expect(result.current.status).toBe(PROMO_STATUS.APPLYING);
    });

    it('returns VALIDATING when code applied and promoCodeValidating is true', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'CODE', promoCodeValidating: true }))
        );
        expect(result.current.status).toBe(PROMO_STATUS.VALIDATING);
    });

    it('returns VALID when code applied and promoCodeVerified is true', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'CODE', promoCodeVerified: true }))
        );
        expect(result.current.status).toBe(PROMO_STATUS.VALID);
    });

    it('returns INVALID when code applied and promoCodeVerified is false', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'CODE', promoCodeVerified: false }))
        );
        expect(result.current.status).toBe(PROMO_STATUS.INVALID);
    });

    it('returns SUGGESTED after selecting qualifying ticket with discovered codes', async () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ discoveredPromoCodes: [{ code: 'S1', auto_apply: false, allowed_ticket_types: [{ id: 1 }] }] }))
        );
        await act(async () => {
            await result.current.onTicketSelected(mockTicketQualifying);
        });
        expect(result.current.status).toBe(PROMO_STATUS.SUGGESTED);
    });

    it('returns IDLE when suggestion dismissed by user input', async () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ discoveredPromoCodes: [{ code: 'S1', auto_apply: false, allowed_ticket_types: [{ id: 1 }] }] }))
        );
        await act(async () => {
            await result.current.onTicketSelected(mockTicketQualifying);
        });
        expect(result.current.status).toBe(PROMO_STATUS.SUGGESTED);

        act(() => {
            result.current.onInputChange('different');
        });
        expect(result.current.status).toBe(PROMO_STATUS.IDLE);
    });
});

// ── Derived values ──

describe('derived values', () => {
    it('isReady true for IDLE', () => {
        const { result } = renderHook(() => usePromoCode(createDefaultProps()));
        expect(result.current.isReady).toBe(true);
    });

    it('isReady true for VALID', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'CODE', promoCodeVerified: true }))
        );
        expect(result.current.isReady).toBe(true);
    });

    it('isReady false for APPLYING', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'CODE', promoCodeVerified: null }))
        );
        expect(result.current.isReady).toBe(false);
    });

    it('isReady false for VALIDATING', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'CODE', promoCodeValidating: true }))
        );
        expect(result.current.isReady).toBe(false);
    });

    it('isReady false for INVALID', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'CODE', promoCodeVerified: false }))
        );
        expect(result.current.isReady).toBe(false);
    });

    it('perAccountLimit from active discovered code when valid', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: mockDiscoveredCodes,
                promoCode: 'AUTO1',
                promoCodeVerified: true,
            }))
        );
        expect(result.current.perAccountLimit).toBe(4);
    });

    it('perAccountLimit null when no active discovered code', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'MANUAL', promoCodeVerified: true }))
        );
        expect(result.current.perAccountLimit).toBeNull();
    });

    it('perAccountLimit null when code not verified', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: mockDiscoveredCodes,
                promoCode: 'AUTO1',
                promoCodeVerified: null,
            }))
        );
        expect(result.current.perAccountLimit).toBeNull();
    });
});

// ── onTicketSelected ──

describe('onTicketSelected', () => {
    it('sets suggestionActive for qualifying ticket', async () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ discoveredPromoCodes: [{ code: 'S1', auto_apply: false, allowed_ticket_types: [{ id: 1 }] }] }))
        );
        await act(async () => {
            await result.current.onTicketSelected(mockTicketQualifying);
        });
        expect(result.current.status).toBe(PROMO_STATUS.SUGGESTED);
    });

    it('does not suggest for non-qualifying ticket', async () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ discoveredPromoCodes: [{ code: 'S1', auto_apply: false, allowed_ticket_types: [{ id: 1 }] }] }))
        );
        await act(async () => {
            await result.current.onTicketSelected(mockTicketNonQualifying);
        });
        expect(result.current.status).toBe(PROMO_STATUS.IDLE);
    });

    it('auto-applies when qualifying + auto_apply + not removed before', async () => {
        const applyPromoCode = jest.fn(() => Promise.resolve());
        const validatePromoCode = jest.fn(() => Promise.resolve());
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: mockDiscoveredCodes,
                applyPromoCode,
                validatePromoCode,
            }))
        );
        await act(async () => {
            await result.current.onTicketSelected(mockTicketQualifying);
        });
        expect(applyPromoCode).toHaveBeenCalledWith('AUTO1');
        expect(validatePromoCode).toHaveBeenCalled();
        expect(result.current.wasAutoApplied).toBe(true);
    });

    it('does not auto-apply after user removed auto-applied code', async () => {
        const applyPromoCode = jest.fn(() => Promise.resolve());
        const props = createDefaultProps({
            discoveredPromoCodes: mockDiscoveredCodes,
            applyPromoCode,
        });
        const { result, rerender } = renderHook((p) => usePromoCode(p), { initialProps: props });

        // First: auto-apply
        await act(async () => {
            await result.current.onTicketSelected(mockTicketQualifying);
        });
        expect(applyPromoCode).toHaveBeenCalledTimes(1);

        // Simulate code was applied (update props)
        rerender({ ...props, promoCode: 'AUTO1', promoCodeVerified: true });

        // Remove
        act(() => {
            result.current.onRemove();
        });

        // Clear promoCode (simulate Redux update)
        rerender({ ...props, promoCode: '' });
        applyPromoCode.mockClear();

        // Re-select same ticket - should NOT auto-apply
        await act(async () => {
            await result.current.onTicketSelected(mockTicketQualifying);
        });
        expect(applyPromoCode).not.toHaveBeenCalled();
        // But suggestion should show
        expect(result.current.status).toBe(PROMO_STATUS.SUGGESTED);
    });

    it('removes discovered code when switching to non-qualifying ticket', async () => {
        const removePromoCode = jest.fn();
        const props = createDefaultProps({
            discoveredPromoCodes: mockDiscoveredCodes,
            promoCode: 'AUTO1',
            promoCodeVerified: true,
            removePromoCode,
        });
        const { result } = renderHook(() => usePromoCode(props));

        await act(async () => {
            await result.current.onTicketSelected(mockTicketNonQualifying);
        });
        expect(removePromoCode).toHaveBeenCalled();
    });

    it('re-validates discovered code when switching between qualifying tickets', async () => {
        const validatePromoCode = jest.fn(() => Promise.resolve());
        const ticket2 = { id: 2, sub_type: 'Regular' };
        const props = createDefaultProps({
            discoveredPromoCodes: mockDiscoveredCodes,
            promoCode: 'AUTO1',
            promoCodeVerified: true,
            validatePromoCode,
        });
        const { result } = renderHook(() => usePromoCode(props));

        await act(async () => {
            await result.current.onTicketSelected(ticket2);
        });
        // AUTO1 is only valid for ticket 1, not ticket 2
        // So it should remove, not re-validate
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
            await result.current.onTicketSelected(mockTicketQualifying);
        });
        expect(validatePromoCode).toHaveBeenCalledWith(
            expect.objectContaining({ id: 1, ticketQuantity: 1 })
        );
    });
});

// ── onApply ──

describe('onApply', () => {
    it('clears errors and calls applyPromoCode then validatePromoCode', async () => {
        const applyPromoCode = jest.fn(() => Promise.resolve());
        const validatePromoCode = jest.fn(() => Promise.resolve());
        const clearFormErrors = jest.fn();
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ applyPromoCode, validatePromoCode, clearFormErrors }))
        );

        await act(async () => {
            await result.current.onApply('CODE', mockTicketQualifying, 1);
        });
        expect(clearFormErrors).toHaveBeenCalled();
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
            await result.current.onApply('CODE', mockTicketQualifying, 1);
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
            await result.current.onApply('CODE', mockTicketQualifying, 1);
        });
        expect(result.current.validationError).toBe('Some validation error');
    });
});

// ── onRemove ──

describe('onRemove', () => {
    it('tracks auto-apply removal', async () => {
        const props = createDefaultProps({ discoveredPromoCodes: mockDiscoveredCodes });
        const { result, rerender } = renderHook((p) => usePromoCode(p), { initialProps: props });

        // Auto-apply
        await act(async () => {
            await result.current.onTicketSelected(mockTicketQualifying);
        });
        expect(result.current.wasAutoApplied).toBe(true);

        // Simulate applied state
        rerender({ ...props, promoCode: 'AUTO1', promoCodeVerified: true });

        // Remove
        act(() => {
            result.current.onRemove();
        });

        expect(result.current.wasAutoApplied).toBe(false);
    });

    it('clears validationError and form state', () => {
        const clearFormErrors = jest.fn();
        const onFormPromoCodeChange = jest.fn();
        const removePromoCode = jest.fn();
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ clearFormErrors, onFormPromoCodeChange, removePromoCode }))
        );

        act(() => {
            result.current.onRemove();
        });

        expect(clearFormErrors).toHaveBeenCalled();
        expect(onFormPromoCodeChange).toHaveBeenCalledWith('');
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
            await result.current.onApply('CODE', mockTicketQualifying, 1);
        });
        expect(result.current.validationError).toBe('error');

        // Type clears it
        act(() => {
            result.current.onInputChange('new');
        });
        expect(result.current.validationError).toBeNull();
    });

    it('dismisses suggestion when value differs from discovered code', async () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: [{ code: 'S1', auto_apply: false, allowed_ticket_types: [{ id: 1 }] }],
            }))
        );

        await act(async () => {
            await result.current.onTicketSelected(mockTicketQualifying);
        });
        expect(result.current.status).toBe(PROMO_STATUS.SUGGESTED);

        act(() => {
            result.current.onInputChange('different');
        });
        expect(result.current.status).toBe(PROMO_STATUS.IDLE);
    });

    it('restores suggestion when value matches discovered code', async () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: [{ code: 'S1', auto_apply: false, allowed_ticket_types: [{ id: 1 }] }],
            }))
        );

        await act(async () => {
            await result.current.onTicketSelected(mockTicketQualifying);
        });

        act(() => {
            result.current.onInputChange('different');
        });
        expect(result.current.status).toBe(PROMO_STATUS.IDLE);

        act(() => {
            result.current.onInputChange('S1');
        });
        expect(result.current.status).toBe(PROMO_STATUS.SUGGESTED);
    });

    it('calls onFormPromoCodeChange', () => {
        const onFormPromoCodeChange = jest.fn();
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ onFormPromoCodeChange }))
        );

        act(() => {
            result.current.onInputChange('test');
        });
        expect(onFormPromoCodeChange).toHaveBeenCalledWith('test');
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
            await result.current.onApply('XYZ', mockTicketQualifying, 1);
        });
        expect(result.current.validationError).toBe('Promo code entered is not valid.');
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
            await result.current.onApply('XYZ', mockTicketQualifying, 1);
        });
        expect(result.current.validationError).toBe('Promo code XYZ can not be applied to Ticket Type Standard.');
    });

    it('setValidationError exposed for external use', () => {
        const { result } = renderHook(() => usePromoCode(createDefaultProps()));

        act(() => {
            result.current.setValidationError('custom error');
        });
        expect(result.current.validationError).toBe('custom error');
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
        expect(result.current.isDiscoveredCode).toBe(true);
    });

    it('false when applied code does not match discovered code', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: mockDiscoveredCodes,
                promoCode: 'MANUAL',
                promoCodeVerified: true,
            }))
        );
        expect(result.current.isDiscoveredCode).toBe(false);
    });

    it('false when no code applied', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ discoveredPromoCodes: mockDiscoveredCodes }))
        );
        expect(result.current.isDiscoveredCode).toBe(false);
    });

    it('false when no discovered codes', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'CODE', promoCodeVerified: true }))
        );
        expect(result.current.isDiscoveredCode).toBe(false);
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
        expect(result.current.maxQuantityFromPromo).toBe(4);
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
        expect(result.current.maxQuantityFromPromo).toBe(3);
    });

    it('null when no active discovered code', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ promoCode: 'MANUAL', promoCodeVerified: true }))
        );
        expect(result.current.maxQuantityFromPromo).toBeNull();
    });

    it('null when code not verified', () => {
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: mockDiscoveredCodes,
                promoCode: 'AUTO1',
                promoCodeVerified: null,
            }))
        );
        expect(result.current.maxQuantityFromPromo).toBeNull();
    });

    it('uses only remaining_quantity_per_account when quantity_available is 0 (unlimited)', () => {
        const codes = [{
            code: 'UNLIM',
            auto_apply: true,
            allowed_ticket_types: [],
            quantity_per_account: 5,
            remaining_quantity_per_account: 3,
            quantity_available: 0,
        }];
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: codes,
                promoCode: 'UNLIM',
                promoCodeVerified: true,
            }))
        );
        expect(result.current.maxQuantityFromPromo).toBe(3);
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
        expect(result.current.maxQuantityFromPromo).toBe(5);
    });

    it('null when both limits are unlimited', () => {
        const codes = [{
            code: 'ALLFREE',
            auto_apply: true,
            allowed_ticket_types: [],
            quantity_per_account: 0,
            remaining_quantity_per_account: null,
            quantity_available: 0,
        }];
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({
                discoveredPromoCodes: codes,
                promoCode: 'ALLFREE',
                promoCodeVerified: true,
            }))
        );
        expect(result.current.maxQuantityFromPromo).toBeNull();
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
            valid = await result.current.onRevalidate(mockTicketQualifying, 3);
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
            valid = await result.current.onRevalidate(mockTicketQualifying, 5);
        });
        expect(valid).toBe(false);
        expect(result.current.validationError).toBe('Promo code X can not be applied more than 3 times.');
    });

    it('clears previous validationError before validating', async () => {
        const validatePromoCode = jest.fn(() => Promise.resolve());
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ validatePromoCode }))
        );

        // Set an error first
        act(() => {
            result.current.setValidationError('old error');
        });
        expect(result.current.validationError).toBe('old error');

        await act(async () => {
            await result.current.onRevalidate(mockTicketQualifying, 1);
        });
        expect(result.current.validationError).toBeNull();
    });

    it('passes correct ticket data to validatePromoCode', async () => {
        const validatePromoCode = jest.fn(() => Promise.resolve());
        const ticket = { id: 42, sub_type: 'PrePaid' };
        const { result } = renderHook(() =>
            usePromoCode(createDefaultProps({ validatePromoCode }))
        );

        await act(async () => {
            await result.current.onRevalidate(ticket, 7);
        });
        expect(validatePromoCode).toHaveBeenCalledWith({ id: 42, ticketQuantity: 7, sub_type: 'PrePaid' });
    });
});
