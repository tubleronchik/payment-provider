import { Router } from "express";
import { ProcessingController } from "../controllers/processing.js";

const router = Router();
const controller = new ProcessingController()

router.post("/api/newOrder", controller.createOrder as any);
router.post("/webhooks/paymentFailed", controller.paymentFailed as any);
router.post("/webhooks/paymentSuccessful", controller.paymentSuccessful as any);
router.get("/api/unsubscribe/:cid/order/:orderId", controller.unsubscibing as any);

export default router;