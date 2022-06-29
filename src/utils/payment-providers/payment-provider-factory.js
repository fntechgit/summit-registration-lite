import {LawPayProvider} from "./lawpay-provider";
import {StripeProvider} from "./stripe-provider";

export class PaymentProviderFactory {

    static build = (provider, params = {}) => {

        let currentProvider = null;
        switch (provider) {
            case 'LawPay': {
                currentProvider = new LawPayProvider({...params});
                break;
            }
            case 'Stripe': {
                currentProvider = new StripeProvider({...params});
                break;
            }
        }

        return currentProvider;
    }
}

