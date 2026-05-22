import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import statusCode from "http-status-codes";
import { z } from "zod";
import { verifyToken } from "@config/jwt";
import { authenticate, authorize } from "@middleware/auth";
import { sendError, sendSuccess } from "@utils/response";
import { LunaService } from "./chat.service";

const router = Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many chat requests. Please wait a moment and try again.",
  },
});

const sessionSchema = z.object({
  channel: z.enum(["public", "dashboard", "admin"]).optional(),
  title: z.string().max(120).optional(),
  pageContext: z
    .object({
      path: z.string().min(1),
      area: z.enum(["public", "dashboard", "admin"]),
    })
    .optional(),
});

const messageSchema = z.object({
  sessionId: z.string().optional(),
  message: z.string().min(1).max(4000),
  pageContext: z
    .object({
      path: z.string().min(1),
      area: z.enum(["public", "dashboard", "admin"]),
    })
    .optional(),
});

const feedbackSchema = z.object({
  messageId: z.string().optional(),
  rating: z.enum(["up", "down"]),
  comment: z.string().max(1000).optional(),
});

const escalationSchema = z.object({
  reason: z.string().min(5).max(4000),
});

const attachOptionalUser = (req: Request) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const cookieToken = req.cookies?.accessToken;
    const token = bearerToken || cookieToken;

    if (!token) {
      return;
    }

    req.user = verifyToken(token);
  } catch {
    req.user = undefined;
  }
};

router.post("/sessions", chatLimiter, async (req: Request, res: Response) => {
  try {
    attachOptionalUser(req);
    const payload = sessionSchema.parse(req.body);
    const session = await LunaService.createSession({
      ...payload,
      userId: req.user?.userId,
    });

    return sendSuccess(res, "Luna session created", session, statusCode.CREATED);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create Luna session";
    return sendError(res, "CHAT_SESSION_CREATE_FAILED", errorMessage, statusCode.BAD_REQUEST);
  }
});

router.post("/message", chatLimiter, async (req: Request, res: Response) => {
  try {
    attachOptionalUser(req);
    const payload = messageSchema.parse(req.body);
    const response = await LunaService.sendMessage({
      ...payload,
      userId: req.user?.userId,
      role: req.user?.role,
    });

    return sendSuccess(res, "Luna replied successfully", response, statusCode.OK);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to process chat message";
    return sendError(res, "CHAT_MESSAGE_FAILED", errorMessage, statusCode.BAD_REQUEST);
  }
});

router.get("/sessions", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, "UNAUTHORIZED", "User ID not found", statusCode.UNAUTHORIZED);
    }

    const sessions = await LunaService.listUserSessions(userId);
    return sendSuccess(res, "Luna sessions fetched", sessions, statusCode.OK);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch Luna sessions";
    return sendError(res, "CHAT_SESSIONS_FAILED", errorMessage, statusCode.INTERNAL_SERVER_ERROR);
  }
});

router.get("/sessions/:sessionId/messages", async (req: Request, res: Response) => {
  try {
    attachOptionalUser(req);
    const messages = await LunaService.getSessionMessages(
      req.params.sessionId,
      req.user?.userId,
      req.user?.role,
    );

    return sendSuccess(res, "Luna messages fetched", messages, statusCode.OK);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch chat messages";
    return sendError(res, "CHAT_MESSAGES_FAILED", errorMessage, statusCode.BAD_REQUEST);
  }
});

router.delete("/sessions/:sessionId", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, "UNAUTHORIZED", "User ID not found", statusCode.UNAUTHORIZED);
    }

    const result = await LunaService.deleteSession(req.params.sessionId, userId, req.user?.role);
    return sendSuccess(res, "Luna session deleted", result, statusCode.OK);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete Luna session";
    return sendError(res, "CHAT_SESSION_DELETE_FAILED", errorMessage, statusCode.BAD_REQUEST);
  }
});

router.post("/sessions/:sessionId/feedback", async (req: Request, res: Response) => {
  try {
    attachOptionalUser(req);
    const payload = feedbackSchema.parse(req.body);
    const feedback = await LunaService.saveFeedback({
      sessionId: req.params.sessionId,
      messageId: payload.messageId,
      rating: payload.rating,
      comment: payload.comment,
      userId: req.user?.userId,
    });

    return sendSuccess(res, "Luna feedback saved", feedback, statusCode.CREATED);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to save feedback";
    return sendError(res, "CHAT_FEEDBACK_FAILED", errorMessage, statusCode.BAD_REQUEST);
  }
});

router.post("/sessions/:sessionId/escalate", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, "UNAUTHORIZED", "User ID not found", statusCode.UNAUTHORIZED);
    }

    const payload = escalationSchema.parse(req.body);
    const result = await LunaService.escalate({
      sessionId: req.params.sessionId,
      userId,
      role: req.user?.role,
      reason: payload.reason,
    });

    return sendSuccess(res, "Luna escalation created", result, statusCode.CREATED);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to escalate to support";
    return sendError(res, "CHAT_ESCALATION_FAILED", errorMessage, statusCode.BAD_REQUEST);
  }
});

router.get(
  "/admin/analytics",
  authenticate,
  authorize("ADMIN"),
  async (_req: Request, res: Response) => {
    try {
      const analytics = await LunaService.getAnalytics();
      return sendSuccess(res, "Luna analytics fetched", analytics, statusCode.OK);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch Luna analytics";
      return sendError(res, "CHAT_ANALYTICS_FAILED", errorMessage, statusCode.INTERNAL_SERVER_ERROR);
    }
  },
);

export default router;