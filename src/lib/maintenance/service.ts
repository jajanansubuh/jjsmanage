import prisma from "@/lib/prisma";

export interface MaintenanceStatus {
  enabled: boolean;
  message: string;
  estimatedFinish: Date | null;
  updatedAt: Date;
  updatedBy: string;
}

interface CacheEntry {
  status: MaintenanceStatus;
  expiresAt: number;
}

let cachedStatus: CacheEntry | null = null;
const CACHE_TTL_MS = 5000; // 5 seconds cache

export async function getMaintenanceStatus(forceRefresh = false): Promise<MaintenanceStatus> {
  const now = Date.now();

  if (!forceRefresh && cachedStatus && cachedStatus.expiresAt > now) {
    return cachedStatus.status;
  }

  try {
    let setting = await prisma.maintenanceSetting.findUnique({
      where: { id: "singleton" },
    });

    if (!setting) {
      // Seed default record if missing
      setting = await prisma.maintenanceSetting.upsert({
        where: { id: "singleton" },
        update: {},
        create: {
          id: "singleton",
          enabled: false,
          message: "System is under maintenance.",
          estimatedFinish: null,
          updatedBy: "SYSTEM",
        },
      });
    }

    const status: MaintenanceStatus = {
      enabled: setting.enabled,
      message: setting.message,
      estimatedFinish: setting.estimatedFinish,
      updatedAt: setting.updatedAt,
      updatedBy: setting.updatedBy,
    };

    cachedStatus = {
      status,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };

    return status;
  } catch (error) {
    console.error("Error reading maintenance status from DB:", error);
    // Return fallback status on database failure instead of crashing
    return {
      enabled: false,
      message: "System is under maintenance. (DB connection issue)",
      estimatedFinish: null,
      updatedAt: new Date(),
      updatedBy: "SYSTEM",
    };
  }
}

export async function updateMaintenanceStatus(params: {
  enabled?: boolean;
  message?: string;
  estimatedFinish?: Date | null;
  updatedBy: string;
  telegramUserId?: string | null;
}): Promise<MaintenanceStatus> {
  // Input validations
  if (params.message !== undefined && params.message.trim() === "") {
    throw new Error("Message cannot be empty");
  }

  const current = await getMaintenanceStatus(true);
  const nextEnabled = params.enabled !== undefined ? params.enabled : current.enabled;
  const nextMessage = params.message !== undefined ? params.message : current.message;
  const nextETA = params.estimatedFinish !== undefined ? params.estimatedFinish : current.estimatedFinish;

  try {
    // Perform transaction to ensure setting and log are both updated/created
    const setting = await prisma.$transaction(async (tx) => {
      const updated = await tx.maintenanceSetting.upsert({
        where: { id: "singleton" },
        update: {
          enabled: nextEnabled,
          message: nextMessage,
          estimatedFinish: nextETA,
          updatedBy: params.updatedBy,
        },
        create: {
          id: "singleton",
          enabled: nextEnabled,
          message: nextMessage,
          estimatedFinish: nextETA,
          updatedBy: params.updatedBy,
        },
      });

      await tx.maintenanceLog.create({
        data: {
          action: params.enabled !== undefined
            ? params.enabled
              ? "ENABLE_MAINTENANCE"
              : "DISABLE_MAINTENANCE"
            : "UPDATE_MAINTENANCE_DETAILS",
          enabled: nextEnabled,
          message: nextMessage,
          eta: nextETA,
          telegramUserId: params.telegramUserId || null,
        },
      });

      return updated;
    });

    const status: MaintenanceStatus = {
      enabled: setting.enabled,
      message: setting.message,
      estimatedFinish: setting.estimatedFinish,
      updatedAt: setting.updatedAt,
      updatedBy: setting.updatedBy,
    };

    // Update Cache
    cachedStatus = {
      status,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };

    return status;
  } catch (error: any) {
    console.error("Error updating maintenance status in DB:", error);
    throw new Error(`Database failure: ${error.message}`);
  }
}
