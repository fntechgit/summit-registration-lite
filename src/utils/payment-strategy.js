export class PaymentStrategy {

    constructor() {
        this._strategy = null;       
    }

    getStrategy() {
        return this._strategy;
    }

    setStrategy(strategy) {        
        this._strategy = strategy;
    }

    payTicket = (token, stripe = null, zipCode = null) => {
        return this._strategy.payTicket(token, stripe, zipCode);
    }
}