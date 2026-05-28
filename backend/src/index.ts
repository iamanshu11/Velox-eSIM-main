import { register } from 'tsconfig-paths';
import { resolve } from 'path';

register({
  baseUrl: __dirname,
  paths: {
    '@/*': ['*'],
    '@config/*': ['config/*'],
    '@modules/*': ['modules/*'],
    '@middleware/*': ['middleware/*'],
    '@utils/*': ['utils/*'],
    '@validators/*': ['validators/*'],
    '@database/*': ['database/*'],
  }
});

import express, { Express, Request, Response } from "express";
import "express-async-errors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import http from "http";
dotenv.config({ path: resolve(__dirname, "../.env") });

import { config, secrets } from "@config/env";
import logger from "@utils/logger";
import { errorMiddleware } from "@middleware/errorHandler";
import { requestLogger, corsMiddleware } from "@middleware/common";
import db from "@config/database";
import { initializeCronJobs, stopCronJobs } from "@/services/cronJobs.service";
import authRoutes from "@modules/auth/auth.routes";
import orderRoutes from "@modules/order/order.routes";
import eSIMRoutes from "@modules/esim/esim.routes";
import uploadRoutes from "@modules/upload/upload.routes";
import analyticsRoutes from "@modules/analytics/analytics.routes";
import settingsRoutes from "@modules/settings/settings.routes";
import webhookRoutes from "@modules/webhook/webhook.routes";
import adminRoutes from "@modules/admin/admin.routes";
import paymentRoutes from "@modules/payments/payments.routes";
import supportRoutes from "@modules/support/support.routes";
import walletRoutes from "@modules/wallet/wallet.routes";
import notificationRoutes from "@modules/notifications/notifications.routes";
import deviceRoutes from "@modules/devices/devices.routes";
import chatRoutes from "@modules/chat/chat.routes";
import liveChatRoutes from "@modules/liveChat/liveChat.routes";
import autoEmailRoutes from "@modules/autoEmails/autoEmails.routes";
import blogRoutes from "@modules/blog/blog.routes";
import crmRoutes from "@modules/crm/crm.routes";
import { LiveChatWebSocketHandler } from "@modules/liveChat/liveChat.websocket";

const app: Express = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(corsMiddleware);
app.use((req: Request, _res, next) => {
  const isInboundWebhook =
    req.path.includes('/webhooks') &&
    !req.path.includes('/integration/webhooks');
  if (isInboundWebhook) {
    let rawBody = '';
    req.on('data', (chunk) => {
      rawBody += chunk.toString('utf-8');
    });
    req.on('end', () => {
      (req as unknown as Record<string, unknown>).rawBody = rawBody;
      next();
    });
  } else {
    next();
  }
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(requestLogger);
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/esims", eSIMRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/live-chat", liveChatRoutes);
app.use("/api", autoEmailRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/crm", crmRoutes);
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error:
    {
      code: 'NOT_FOUND',
      message: 'Route not found',
      statusCode: 404,
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  });
});
app.use(errorMiddleware);

const PORT = config.port || 5000;

const httpServer = http.createServer(app);

LiveChatWebSocketHandler.initialize(httpServer);

const server = httpServer.listen(PORT, "0.0.0.0", async () => {
  logger.success(`Server is running on http://0.0.0.0:${PORT}`);
  logger.info(`Environment: ${config.node_env}`);
  logger.info(
    `Database: Configured`,
  );
  logger.info(`[WebSocket] Live Chat enabled`);
  try {
    logger.info('[STARTUP] Testing database connection...');
    await db.$queryRaw`SELECT 1`;
    logger.success('[STARTUP] ✓ Database connection successful');

    // Seed eSIM credentials from env vars into Settings if not already set via admin UI
    try {
      if (secrets.esim_access_code || secrets.esim_secret_key) {
        const existing = await db.settings.findFirst();
        const alreadySet = existing?.esimAccessCode?.trim() || existing?.esimSecretKey?.trim();

        if (!alreadySet) {
          const credData = {
            esimAccessCode: secrets.esim_access_code,
            esimSecretKey: secrets.esim_secret_key,
          };
          if (existing) {
            await db.settings.update({ where: { id: existing.id }, data: credData });
          } else {
            await db.settings.create({ data: credData });
          }
          logger.success('[STARTUP] ✓ eSIM credentials seeded from environment variables');
        }
      }
    } catch (seedError) {
      logger.warn('[STARTUP] ⚠️ Could not seed eSIM credentials:',
        seedError instanceof Error ? seedError.message : String(seedError)
      );
    }

    try {
      initializeCronJobs();
      logger.success('[STARTUP] ✓ Email automation cron jobs initialized');
    } catch (cronError) {
      logger.error('[STARTUP] ⚠️ Failed to initialize cron jobs:',
        cronError instanceof Error ? cronError.message : String(cronError)
      );
    }
  } catch (dbError) {
    logger.error('[STARTUP] ⚠️ Database connection test failed:', 
      dbError instanceof Error ? dbError.message : String(dbError)
    );
    logger.warn('[STARTUP] API will start but database features may be unavailable');
    logger.info('[STARTUP] Check that DATABASE_URL is correct and the database is accessible');
  }
});

process.on("unhandledRejection", (reason: any) => {
  logger.error("Unhandled Rejection:", {
    message: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    reason: JSON.stringify(reason, null, 2),
  });
  console.error("Full error object:", reason);
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  stopCronJobs();
  server.close(() => {
    logger.info("HTTP server closed");
  });
});

export default app;
