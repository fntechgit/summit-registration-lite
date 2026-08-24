import { isEmptyString, interpolate } from '../utils';

describe('isEmptyString', () => {
    it('treats missing values (null/undefined) as empty', () => {
        expect(isEmptyString(undefined)).toBe(true);
        expect(isEmptyString(null)).toBe(true);
    });

    it('treats empty and whitespace-only strings as empty', () => {
        expect(isEmptyString('')).toBe(true);
        expect(isEmptyString('   ')).toBe(true);
    });

    it('treats a non-empty string as not empty', () => {
        expect(isEmptyString('Finish Now')).toBe(false);
        expect(isEmptyString(' x ')).toBe(false);
    });
});

describe('interpolate', () => {
    it('replaces every occurrence of a {token} with its value', () => {
        expect(interpolate('click the "{button}" button', { button: 'Finish Now' }))
            .toBe('click the "Finish Now" button');
        expect(interpolate('{a} and {a}', { a: 'x' })).toBe('x and x');
    });

    it('replaces multiple distinct tokens', () => {
        expect(interpolate('assigned to {attendee}, complete {adv} details', { attendee: 'you', adv: 'your' }))
            .toBe('assigned to you, complete your details');
    });

    it('leaves unknown tokens untouched', () => {
        expect(interpolate('hello {name}', { button: 'x' })).toBe('hello {name}');
    });

    it('returns a non-string template unchanged', () => {
        expect(interpolate(undefined, { a: '1' })).toBe(undefined);
    });
});
