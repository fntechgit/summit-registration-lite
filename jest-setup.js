import 'regenerator-runtime/runtime'
import { TextEncoder, TextDecoder } from 'util';
import T from 'i18n-react';

if (typeof globalThis.TextEncoder === 'undefined') {
    globalThis.TextEncoder = TextEncoder;
    globalThis.TextDecoder = TextDecoder;
}

T.setTexts(require('./src/i18n/en.json'));

jest.setTimeout(10000); // in milliseconds
