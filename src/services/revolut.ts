import { OrderModel } from "../models/order.js";
import { PaymentModel } from "../models/payment.js";
import { CustomerModel } from "../models/customer.js";
import dotenv from "dotenv";
import process from "process";

dotenv.config();

const HEADERS = {
    Authorization: `Bearer ${process.env.REVOLUT_API_SECRET_KEY}`,
    "Content-Type": "application/json",
    'Revolut-Api-Version': '2024-09-01',
    'Accept': 'application/json'
}
const URL = process.env.REVOLUT_API_URL

export class RevolutService {
    async createOrder(order: OrderModel): Promise<OrderModel> {
        const response = await fetch(
            `${URL}/api/orders`,
            {
              method: "POST",
              headers: HEADERS,
              body: JSON.stringify(order.toRevolutPayload()),
            },
        );
        const revolutOrder = await response.json();
        order.setResponseData(revolutOrder);
        if (!response.ok) {
            console.log("Failed to create order in Revolut, response:", response)
            throw new Error("Failed to create order in Revolut, response:");
        }
        return order;
    }

    async getSavedPaymentMethod(customer: CustomerModel) {
        const response = await fetch(
            `${URL}/api/1.0/customers/${customer.customerId}/payment-methods?only_merchant=true`,
              {
              method: "GET",
              headers: HEADERS
              },
        );
        const responseText = await response.json()
        customer.setPaymentId(responseText)
        if (!response.ok) {
            console.log("Failed to get saved payment method in Revolut, response:", responseText)
            throw new Error("Failed to get saved payment method in Revolut");
        }
        return customer
    }

    async deleteCustomer(customer: CustomerModel) {
        const response = await fetch(
            `${URL}/api/1.0/customers/${customer.customerId}`,
              {
              method: "DELETE",
              headers: HEADERS
              },
        )
        if (!response.ok) {
            console.log("Failed to delete customer in Revolut, response:", response)
            throw new Error("Failed to delete customerin Revolut");
        }
        return customer 
    }

    async payOrder(payment: PaymentModel) {
        const response = await fetch(
            `${URL}/api/orders/${payment.orderId}/payments`,
            {
              method: "POST",
              headers: HEADERS,
              body: JSON.stringify(payment.toRevolutPaymentPayload()),
            },
        );
        const payRespText = await response.json();
        if (!response.ok) {
            console.log("Failed to pay order in Revolut, response:", payRespText)
            throw new Error("Failed to pay order in Revolut, response:");
        }
        return payRespText
    }
}