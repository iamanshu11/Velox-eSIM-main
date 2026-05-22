import db from "@config/database";
import logger from "@utils/logger";
import { PROFIT_MARGIN } from "@/constants/business";

export interface AppSettings {
  profitMargin: number;
  currency: string;
  maintenanceMode: boolean;
  supportEmail: string;
  esimAccessCode?: string;
  esimSecretKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFromEmail?: string;
  smtpFromName?: string;
  smtpSecure?: boolean;
}

class SettingsService {
  private defaultSettings: AppSettings = {
    profitMargin: 1.2,
    currency: "USD",
    maintenanceMode: false,
    supportEmail: "support@veloxesim.com",
    esimAccessCode: "",
    esimSecretKey: "",
    smtpHost: "smtp.hostinger.com",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    smtpFromEmail: "noreply@veloxesim.com",
    smtpFromName: "Velox eSIM",
    smtpSecure: true,
  };

  private normalizeSettings(settings: Record<string, unknown>): AppSettings {
    return {
      profitMargin: (settings.profitMargin as number) || this.defaultSettings.profitMargin,
      currency: (settings.currency as string) || this.defaultSettings.currency,
      maintenanceMode: (settings.maintenanceMode as boolean) || this.defaultSettings.maintenanceMode,
      supportEmail: (settings.supportEmail as string) || this.defaultSettings.supportEmail,
      esimAccessCode: (settings.esimAccessCode as string | null) || undefined,
      esimSecretKey: (settings.esimSecretKey as string | null) || undefined,
      smtpHost: (settings.smtpHost as string | null) || this.defaultSettings.smtpHost,
      smtpPort: (settings.smtpPort as number) || this.defaultSettings.smtpPort,
      smtpUser: (settings.smtpUser as string | null) || this.defaultSettings.smtpUser,
      smtpPassword: (settings.smtpPassword as string | null) || this.defaultSettings.smtpPassword,
      smtpFromEmail: (settings.smtpFromEmail as string | null) || this.defaultSettings.smtpFromEmail,
      smtpFromName: (settings.smtpFromName as string | null) || this.defaultSettings.smtpFromName,
      smtpSecure: (settings.smtpSecure as boolean) !== undefined ? (settings.smtpSecure as boolean) : this.defaultSettings.smtpSecure,
    };
  }

  async getSettings(): Promise<AppSettings> {
    try {
      const settings = await db.settings.findFirst();
      
      if (!settings) {
        return {
          ...this.defaultSettings,
          esimAccessCode: process.env.ESIM_ACCESS_CODE || undefined,
          esimSecretKey: process.env.ESIM_SECRET_KEY || undefined,
        };
      }

      const normalized = this.normalizeSettings(settings);

      return {
        ...normalized,
        esimAccessCode: process.env.ESIM_ACCESS_CODE || normalized.esimAccessCode || undefined,
        esimSecretKey: process.env.ESIM_SECRET_KEY || normalized.esimSecretKey || undefined,
      };
    } catch (error) {
      logger.error("Error fetching settings", error instanceof Error ? error : new Error(String(error)));
      return {
        ...this.defaultSettings,
        esimAccessCode: process.env.ESIM_ACCESS_CODE || undefined,
        esimSecretKey: process.env.ESIM_SECRET_KEY || undefined,
      };
    }
  }

  async getProfitMargin(): Promise<number> {
    const settings = await this.getSettings();
    return settings.profitMargin;
  }

  async updateProfitMargin(margin: number): Promise<AppSettings> {
    if (margin < PROFIT_MARGIN.MIN || margin > PROFIT_MARGIN.MAX) {
      throw new Error(`Profit margin must be between ${PROFIT_MARGIN.MIN} and ${PROFIT_MARGIN.MAX}`);
    }

    let settings = await db.settings.findFirst();

    if (!settings) {
      settings = await db.settings.create({
        data: { ...this.defaultSettings, profitMargin: margin },
      });
    } else {
      settings = await db.settings.update({
        where: { id: settings.id },
        data: { profitMargin: margin },
      });
    }

    return this.normalizeSettings(settings);
  }

  async updateSettings(data: Partial<AppSettings>): Promise<AppSettings> {
    try {
      let settings = await db.settings.findFirst();

      if (!settings) {
        settings = await db.settings.create({
          data: { ...this.defaultSettings, ...data },
        });
      } else {
        const updateData = Object.fromEntries(
          Object.entries(data).filter(
            ([_, v]) => v !== undefined && v !== null,
          ),
        );

        settings = await db.settings.update({
          where: { id: settings.id },
          data: updateData,
        });
      }

      return this.normalizeSettings(settings);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("[SettingsService] Error updating settings", err);
      interface PrismaError {
        code?: string;
      }
      const prismaErr = err as PrismaError;
      if (prismaErr.code === "P2016") {
        throw new Error("Settings record not found");
      }
      if (prismaErr.code === "P2020") {
        throw new Error(
          "Column does not exist on settings table. Please run database migrations.",
        );
      }
      throw err;
    }
  }
applyProfitMargin(basePrice: number, margin: number): number {
    return parseFloat((basePrice * margin).toFixed(2));
  }
}

export const settingsService = new SettingsService();


