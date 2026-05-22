import db from "@config/database";
import bcrypt from "bcryptjs";
import logger from "@utils/logger";

async function main() {
  try {
    logger.warn('⚠️ WARNING: Database seeding is for DEVELOPMENT ONLY');
    logger.warn('⚠️ Never run this script in production - it creates hardcoded test data');
    logger.warn('⚠️ All passwords must come from environment variables, never hardcoded!');
    
    logger.info("Starting database seeding");
    const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@veloxesim.com";
    const adminPasswordRaw = process.env.SEED_ADMIN_PASSWORD;
    
    if (!adminPasswordRaw) {
      logger.error('❌ Missing SEED_ADMIN_PASSWORD environment variable');
      logger.error('Set SEED_ADMIN_PASSWORD in your .env file for local development');
      process.exit(1);
    }
    
    const adminPassword = await bcrypt.hash(adminPasswordRaw, 10);

    const existingAdmin = await db.user.findUnique({
      where: { email: adminEmail },
    });
    if (!existingAdmin) {
      await db.user.create({
        data: {
          email: adminEmail,
          password: adminPassword,
          name: "Admin User",
          role: "ADMIN",
          isActive: true,
        },
      });
      logger.success("Admin user created", { email: adminEmail });
    } else {
      logger.info("Admin user already exists");
    }

    const existingSettings = await db.settings.findFirst();
    if (!existingSettings) {
      const esimAccessCode = process.env.ESIM_ACCESS_CODE;
      const esimSecretKey = process.env.ESIM_SECRET_KEY;
      
      if (!esimAccessCode || !esimSecretKey) {
        logger.warn('⚠️ ESIM credentials not set in environment - settings will be empty');
        logger.warn('Set ESIM_ACCESS_CODE and ESIM_SECRET_KEY to populate eSIM credentials');
      }
      
      await db.settings.create({
        data: {
          profitMargin: 1.25,
          currency: "USD",
          maintenanceMode: false,
          supportEmail: "support@veloxesim.com",
          esimAccessCode: esimAccessCode || "",
          esimSecretKey: esimSecretKey || "",
        },
      });
      logger.success("Default settings created", { profitMargin: '25%' });
    } else {
      logger.info("Settings already exist");
    }

    logger.success("✅ Database seeding completed successfully!");
    logger.info(
      "📝 Note: All data comes from eSIMaccess API - database is minimal",
    );
  } catch (error) {
    logger.error("Seeding failed", error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
