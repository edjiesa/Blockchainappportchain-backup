'use strict';

const { Contract } = require('fabric-contract-api');

class PaymentContract extends Contract {
    async ExecutePayment(ctx, paymentId, amount, senderId, receiverId) {
        console.info('============= START : ExecutePayment ===========');
        
        const payment = {
            paymentId,
            amount: parseFloat(amount),
            senderId,
            receiverId,
            status: 'EXECUTED',
            docType: 'payment',
        };

        await ctx.stub.putState(paymentId, Buffer.from(JSON.stringify(payment)));
        console.info('============= END : ExecutePayment ===========');
        return JSON.stringify(payment);
    }
}

module.exports.PaymentContract = PaymentContract;
module.exports.contracts = [PaymentContract];
