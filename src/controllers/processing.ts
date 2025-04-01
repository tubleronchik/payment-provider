import { Request, Response } from "express";
import { ScenarioService } from "../services/scenario.js"

export class ProcessingController {
    scenarioService: ScenarioService
    constructor() {
        this.scenarioService = new ScenarioService();
        this.createOrder = this.createOrder.bind(this);
        this.paymentSuccessful = this.paymentSuccessful.bind(this);
        this.paymentFailed = this.paymentFailed.bind(this);
        this.prolongation = this.prolongation.bind(this)
        this.unsubscibing = this.unsubscibing.bind(this)
    }

    async createOrder(req: Request, res: Response) {
        const { body: { amount, currency, name, email } } = req;
        const result = await this.scenarioService.createOrder({ amount, currency, name, email });
        if (result.success) {
            const { data: { description, publicOrderId, state } } = result;
            return res.status(201).json({
                description,
                revolutPublicOrderId: publicOrderId,
                state
            })
        }
        return res.status(500).json({error: "Order creation failed",})
    }

    async paymentSuccessful(req: Request, res: Response) {
        // @ts-ignore
        const { body: { order_id }, rawBody } = req;
        const { 
            "revolut-signature": revolutSignature, 
            "revolut-request-timestamp": revolutRequestTimestamp 
          } = req.headers;

        const result = await this.scenarioService.paymentSuccessful(order_id, rawBody, revolutSignature, revolutRequestTimestamp)
        if (result.success) {
            return res.status(204).send()
        }
        return res.status(400).send("Internal Server Error")
    }

    async paymentFailed(req: Request, res: Response) {
        // @ts-ignore
        const { body: { order_id }, rawBody } = req;
        const { 
            "revolut-signature": revolutSignature, 
            "revolut-request-timestamp": revolutRequestTimestamp 
          } = req.headers;
        const result = await this.scenarioService.paymentFailed(order_id, rawBody, revolutSignature, revolutRequestTimestamp)
        if (result.success) {
            return res.status(204).send()
        }
        return res.status(400).send("Internal Server Error")
    }

    async prolongation(req: Request, res: Response) {
        if (req.body.auth.app !== "PRS") {
            return res.status(403).json({ message: "Unauthorized source" });
        }
        const { body: { cid } } = req;

        const result = await this.scenarioService.prolongation(cid)

        if (result.success) {
            return res.status(201).send()
        }
        return res.status(500).send("Internal Server Error: Prolongation process failed");
    }

    async unsubscibing(req: Request, res: Response) {
        const cid = req.params.cid.trim();
        const orderId = req.params.orderId.trim();
        const result = await this.scenarioService.unsubscribing(cid, orderId)
        if (result.success) {
            return res.status(204).json({ message: "Unsubscribed successfully" });
        }
        return res.status(500).send("Internal Server Error: Unsubscribing process failed");
    }
}