import { Router, Request, Response } from "express";
import { authenticate } from "@middleware/auth";
import statusCode from "http-status-codes";
import { sendError, sendSuccess } from "@utils/response";
import { asyncHandler } from "@utils/errors";
import logger from "@utils/logger";
import db from "@config/database";

const router = Router();

const VALID_TYPES = ["phone", "tablet", "hotspot", "other"];
router.get(
  "/",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, "Unauthorized", "User ID not found", statusCode.UNAUTHORIZED);
    }

    try {
      const devices = await db.device.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      return sendSuccess(res, "Devices fetched successfully", { devices });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to fetch devices";
      logger.error("[Devices] Error fetching", error instanceof Error ? error : new Error(String(error)));
      return sendError(res, "Failed to fetch devices", errorMsg, statusCode.INTERNAL_SERVER_ERROR);
    }
  })
);
router.post(
  "/",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, "Unauthorized", "User ID not found", statusCode.UNAUTHORIZED);
    }

    const { name, brand, model, deviceType = "phone", carrier } = req.body;

    if (!name || !brand || !model) {
      return sendError(res, "Missing required fields", "name, brand, and model are required", statusCode.BAD_REQUEST);
    }

    if (!VALID_TYPES.includes(deviceType)) {
      return sendError(res, "Invalid deviceType", `Must be one of: ${VALID_TYPES.join(", ")}`, statusCode.BAD_REQUEST);
    }

    try {
      const device = await db.device.create({
        data: { userId, name, brand, model, deviceType, carrier: carrier || null, isActive: true },
      });

      logger.info(`[Devices] Device created for user ${userId}: ${device.id}`);
      return sendSuccess(res, "Device added successfully", device, statusCode.CREATED);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to add device";
      logger.error("[Devices] Error creating", error instanceof Error ? error : new Error(String(error)));
      return sendError(res, "Failed to add device", errorMsg, statusCode.INTERNAL_SERVER_ERROR);
    }
  })
);
router.put(
  "/:id",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, "Unauthorized", "User ID not found", statusCode.UNAUTHORIZED);
    }

    const existing = await db.device.findFirst({ where: { id, userId } });
    if (!existing) {
      return sendError(res, "Device not found", undefined, statusCode.NOT_FOUND);
    }

    const { name, brand, model, deviceType, carrier, isActive } = req.body;
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (brand !== undefined) updateData.brand = brand;
    if (model !== undefined) updateData.model = model;
    if (deviceType !== undefined && VALID_TYPES.includes(deviceType)) updateData.deviceType = deviceType;
    if (carrier !== undefined) updateData.carrier = carrier;
    if (isActive !== undefined) updateData.isActive = isActive;

    try {
      const updated = await db.device.update({ where: { id }, data: updateData });
      return sendSuccess(res, "Device updated successfully", updated);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to update device";
      return sendError(res, "Failed to update device", errorMsg, statusCode.INTERNAL_SERVER_ERROR);
    }
  })
);
router.delete(
  "/:id",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, "Unauthorized", "User ID not found", statusCode.UNAUTHORIZED);
    }

    const existing = await db.device.findFirst({ where: { id, userId } });
    if (!existing) {
      return sendError(res, "Device not found", undefined, statusCode.NOT_FOUND);
    }

    try {
      await db.device.delete({ where: { id } });
      logger.info(`[Devices] Device deleted: ${id} by user ${userId}`);
      return sendSuccess(res, "Device removed successfully", { id });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to delete device";
      return sendError(res, "Failed to delete device", errorMsg, statusCode.INTERNAL_SERVER_ERROR);
    }
  })
);

export default router;
