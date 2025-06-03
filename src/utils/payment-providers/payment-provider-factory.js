import {LawPayProvider} from "./lawpay-provider";
import {StripeProvider} from "./stripe-provider";
import { PAYMENT_PROVIDER_LAWPAY, PAYMENT_PROVIDER_STRIPE } from '../constants';

export class PaymentProviderFactory {

    static build = (provider, params = {}) => {

        let currentProvider = null;
        switch (provider) {
            case PAYMENT_PROVIDER_LAWPAY: {
                currentProvider = new LawPayProvider({...params});
                break;
            }
            case PAYMENT_PROVIDER_STRIPE: {
                currentProvider = new StripeProvider({...params});
                break;
            }
        }

        return currentProvider;
    }
}

