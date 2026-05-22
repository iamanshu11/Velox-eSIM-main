import { Router, Request, Response } from "express";
import { authenticate, authorize } from "@middleware/auth";
import statusCode from "http-status-codes";
import { sendError, sendSuccess } from "@utils/response";
import { asyncHandler } from "@utils/errors";
import logger from "@utils/logger";
import db from "@config/database";

const router = Router();
router.get(
  "/",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const isAdmin = req.user?.role === "ADMIN";

    if (!userId) {
      return sendError(res, "Unauthorized", "User ID not found", statusCode.UNAUTHORIZED);
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    try {
      const where = isAdmin ? {} : { userId };

      const [notifications, total] = await Promise.all([
        db.notification.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: limit,
          skip,
        }),
        db.notification.count({ where }),
      ]);

      return sendSuccess(res, "Notifications fetched successfully", {
        notifications,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to fetch notifications";
      logger.error("[Notifications] Error fetching", error instanceof Error ? error : new Error(String(error)));
      return sendError(res, "Failed to fetch notifications", errorMsg, statusCode.INTERNAL_SERVER_ERROR);
    }
  })
);
router.post(
  "/send",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const { title, message, type = "info", targetUsers = "all" } = req.body;

    if (!title || !message) {
      return sendError(res, "Missing required fields", "title and message are required", statusCode.BAD_REQUEST);
    }

    if (!["info", "warning", "success", "error"].includes(type)) {
      return sendError(res, "Invalid type", "type must be info, warning, success, or error", statusCode.BAD_REQUEST);
    }

    try {
      let userFilter: Record<string, unknown> = {};

      if (targetUsers === "active") {
        userFilter = { isActive: true };
      } else if (targetUsers === "new") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        userFilter = { createdAt: { gte: sevenDaysAgo } };
      }

      const users = await db.user.findMany({
        where: userFilter,
        select: { id: true },
      });

      if (users.length === 0) {
        return sendSuccess(res, "No users matched target criteria", { sentCount: 0 });
      }

      const notificationData = users.map((u) => ({
        userId: u.id,
        type,
        title,
        message,
        isRead: false,
        metadata: { targetUsers, sentByAdmin: true } as Record<string, string | boolean>,
      }));

      await db.notification.createMany({ data: notificationData });

      logger.info(`[Notifications] Sent to ${users.length} users (target: ${targetUsers})`);

      return sendSuccess(res, "Notifications sent successfully", {
        sentCount: users.length,
        targetUsers,
      }, statusCode.CREATED);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to send notifications";
      logger.error("[Notifications] Error sending", error instanceof Error ? error : new Error(String(error)));
      return sendError(res, "Failed to send notifications", errorMsg, statusCode.INTERNAL_SERVER_ERROR);
    }
  })
);
router.patch(
  "/:id/read",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(res, "Unauthorized", "User ID not found", statusCode.UNAUTHORIZED);
    }

    try {
      const notification = await db.notification.findFirst({ where: { id, userId } });

      if (!notification) {
        return sendError(res, "Notification not found", undefined, statusCode.NOT_FOUND);
      }

      const updated = await db.notification.update({
        where: { id },
        data: { isRead: true },
      });

      return sendSuccess(res, "Notification marked as read", updated);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to update notification";
      return sendError(res, "Failed to update notification", errorMsg, statusCode.INTERNAL_SERVER_ERROR);
    }
  })
);
router.patch(
  "/read-all",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(res, "Unauthorized", "User ID not found", statusCode.UNAUTHORIZED);
    }

    try {
      const result = await db.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      return sendSuccess(res, "All notifications marked as read", { updatedCount: result.count });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to update notifications";
      return sendError(res, "Failed to update notifications", errorMsg, statusCode.INTERNAL_SERVER_ERROR);
    }
  })
);
router.delete(
  "/:id",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    const isAdmin = req.user?.role === "ADMIN";

    if (!userId) {
      return sendError(res, "Unauthorized", "User ID not found", statusCode.UNAUTHORIZED);
    }

    try {
      const where = isAdmin ? { id } : { id, userId };
      const notification = await db.notification.findFirst({ where });

      if (!notification) {
        return sendError(res, "Notification not found", undefined, statusCode.NOT_FOUND);
      }

      await db.notification.delete({ where: { id } });

      return sendSuccess(res, "Notification deleted successfully", { id });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to delete notification";
      return sendError(res, "Failed to delete notification", errorMsg, statusCode.INTERNAL_SERVER_ERROR);
    }
  })
);

export default router;
