export class PaymentStrategy {

    constructor() {
        this._strategy = null;       
    }

    getStrategy() {
        return this._strategy;
    }

    setStrategy(strategy) {        
        this._strategy = strategy;
        console.log('setting strategy...', strategy);
    }

    payTicket = (token, stripe = null, zipCode = null) => {
        console.log('calling from provider?')
        return this._strategy.payTicket(token, stripe, zipCode);
    }
}