import URI from 'urijs';

const mockRequestedUrls = [];

jest.mock('openstack-uicore-foundation/lib/utils/actions', () => ({
    createAction: (type) => (payload) => ({ type, payload }),
    getRequest: (pre, success, url) => () => () => {
        mockRequestedUrls.push(url);
        return Promise.resolve();
    },
    postRequest: jest.fn(),
    deleteRequest: jest.fn(),
    authErrorHandler: jest.fn(),
}));

jest.mock('sweetalert2', () => ({ __esModule: true, default: { fire: jest.fn() } }));

// eslint-disable-next-line import/first
import { validatePromoCode } from '../actions';

// The browser sends only the path and query of a URL, never the fragment.
const requestedPath = async (promoCode) => {
    mockRequestedUrls.length = 0;
    const getState = () => ({ registrationLiteState: { settings: { summitId: 69 }, promoCode } });

    await validatePromoCode({ id: 1, sub_type: 'Regular' })(jest.fn(), getState, {
        apiBaseUrl: 'https://api.example.com',
        getAccessToken: () => Promise.resolve('access-token'),
    });

    return URI(mockRequestedUrls[0]).path();
};

describe('validatePromoCode', () => {
    it.each([
        ['FNT3CHCREW', 'FNT3CHCREW'],
        ['#FNT3CHCREW', '%23FNT3CHCREW'],
        ['FNT3CH#CREW', 'FNT3CH%23CREW'],
        ['FNT3CH?CREW', 'FNT3CH%3FCREW'],
        ['50%OFF', '50%25OFF'],
    ])('sends the whole code %s to the apply endpoint', async (code, segment) => {
        expect(await requestedPath(code)).toBe(`/api/v1/summits/69/promo-codes/${segment}/apply`);
    });
});
