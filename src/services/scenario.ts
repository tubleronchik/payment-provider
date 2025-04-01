import { OrderModel } from "../models/order.js";
import { CustomerModel } from "../models/customer.js";
import { SignatureModel } from "../models/signature.js"
import { RevolutService } from "../services/revolut.js";
import { PaymentModel } from "../models/payment.js";
import { PRSService } from "../services/prs.js";
import { AMOUNT, NAME, CURRENCY } from "../constants.js"

export class ScenarioService {
    revolutService: RevolutService; 
    prsService: PRSService
    constructor() {
        this.revolutService = new RevolutService();
        this.prsService = new PRSService();
    }

    async createOrder({ amount, currency, name, email }) {
        const order = new OrderModel({ amount, currency, description: name, email });

        await this.revolutService.createOrder(order);
        const { description, publicOrderId, state, customerId, orderId } = order;
        
        if (customerId) {
            try { 
                await this.prsService.saveCustomerData({email, cid: customerId,orderId });
                console.log("Customer data saved successfully.");
                return { success: true, data: { description, publicOrderId, state } };
            } catch (err) {
                console.error("Failed to save customer data:", err);
                return { success: false, error: err.message };
            }
        }
    }

    async paymentSuccessful(order_id: string, rawPayload: any, receivedSignature: string | string[], timestamp: string | string[]) {
        const secret = process.env.REVOLUT_SUCCESS_WEBHOOK_SECRET;
        const signatureModel = new SignatureModel({ secret, receivedSignature, timestamp, rawPayload})
        if (!signatureModel.isTimestampValid() || !signatureModel.isSignatureValid()) {
            console.log("Payment successful webhook: Signature or timestamp are not valid")
            return { success: false}
        }
        console.log("Payment successful webhook: Signature and timestamp are valid")
        try {
            await this.prsService.updateLastPaid(order_id)
            console.log("updateLastPaid successfully.");
            return { success: true}
        } catch (err) {
            console.error("Failed to updateLastPaid:", err);
            return { success: false}
        }
    }

    async paymentFailed(order_id: string, rawPayload: any, receivedSignature: string | string[], timestamp: string | string[]) {
        const secret = process.env.REVOLUT_FAILED_WEBHOOK_SECRET;
        const signatureModel = new SignatureModel({ secret, receivedSignature, timestamp, rawPayload})
        if (!signatureModel.isTimestampValid() || !signatureModel.isSignatureValid()) {
            console.log("Payment failed webhook: Signature or timestamp are not valid")
            return { success: false}
        }
        console.log("Payment failed webhook: Signature and timestamp are valid")
        try {
            await this.prsService.setUnpaid(order_id);
            console.log("setUnpaid successfully.");
            return { success: true}
        } catch (err) {
            console.error("Failed to setUnpaid:", err);
            return { success: false}
        }
    }

    async prolongation(cid: string) {

        const order: OrderModel = new OrderModel({ amount: AMOUNT, currency: CURRENCY, description: NAME, customerId: cid })

        try {
            await this.revolutService.createOrder(order)

            const { orderId } = order
            if (!orderId) {
                console.error("Missing orderId in Revolut response");
                return { success: false}
            }

            await this.prsService.updateOrderId({orderId, cid})
            const customer = new CustomerModel({customerId: cid})
            await this.revolutService.getSavedPaymentMethod(customer);

            const { paymentId } = customer;
            if (!paymentId) {
                console.error("Missing paymentId");
                return { success: false}
            }

            const payment = new PaymentModel({orderId, paymentMethodId: paymentId})
            await this.revolutService.payOrder(payment)

            return { success: true}

        } catch (err) {
            console.error("Prolongation failed:", err);
            return { success: false}
        }
    }

    async unsubscribing(cid: string, order_id: string) {
        const customer: CustomerModel = new CustomerModel({customerId: cid})
        try {
            await this.revolutService.deleteCustomer(customer)
            await this.prsService.setUnpaid(order_id);
            return { success: true}
        } catch (err) {
            console.error("Deletion failed:", err);
            return { success: false}
        }
    }
}