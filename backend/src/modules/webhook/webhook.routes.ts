import { Router } from "express";
import { authenticate, authorize } from "@middleware/auth";
import { verifyWebhookSignatureMiddleware } from "@middleware/webhookVerification";
import handleStripeWebhook from "@middleware/stripeWebhook";
import {
  receiveESIMAccessWebhook,
  getWebhookHistory,
  getPendingWebhooks,
  retryFailedWebhooks,
  webhookHealthCheck,
} from "./webhook.controller";

const router = Router();
router.post("/esim-access", verifyWebhookSignatureMiddleware, receiveESIMAccessWebhook);
router.post("/stripe", handleStripeWebhook);
router.get("/health", webhookHealthCheck);
router.get("/history", authenticate, authorize("ADMIN"), getWebhookHistory);
router.get("/pending", authenticate, authorize("ADMIN"), getPendingWebhooks);
router.post("/retry", authenticate, authorize("ADMIN"), retryFailedWebhooks);

export default router;
