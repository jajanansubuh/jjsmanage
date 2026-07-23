import { NextResponse } from "next/server";
import { getMaintenanceStatus, updateMaintenanceStatus } from "@/lib/maintenance/service";

export const dynamic = "force-dynamic";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID;

async function sendTelegramMessage(chatId: number, text: string) {
  if (!BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not set in environment variables");
    return;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });
    if (!res.ok) {
      console.error("Failed to send telegram message:", await res.text());
    }
  } catch (error) {
    console.error("Error sending telegram message:", error);
  }
}

function formatDateWIB(date: Date | null | undefined): string {
  if (!date) return "None";
  try {
    const jktDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const day = jktDate.getDate();
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const month = months[jktDate.getMonth()];
    const year = jktDate.getFullYear();
    const hour = String(jktDate.getHours()).padStart(2, "0");
    const minute = String(jktDate.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${year}\n${hour}:${minute} WIB`;
  } catch (error) {
    return date.toISOString();
  }
}

function formatTimeOnlyWIB(date: Date): string {
  try {
    const jktDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const hour = String(jktDate.getHours()).padStart(2, "0");
    const minute = String(jktDate.getMinutes()).padStart(2, "0");
    return `${hour}:${minute} WIB`;
  } catch (error) {
    return date.toISOString();
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Verify webhook has message
    const message = body?.message;
    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat?.id;
    const fromId = String(message.from?.id);
    const text = message.text?.trim() || "";

    if (!chatId) {
      return NextResponse.json({ ok: true });
    }

    // Verify ADMIN_TELEGRAM_ID security
    if (!ADMIN_ID || fromId !== ADMIN_ID) {
      await sendTelegramMessage(chatId, "❌ Unauthorized");
      return NextResponse.json({ ok: true });
    }

    // Command Parser
    if (text.startsWith("/maintenance on")) {
      await updateMaintenanceStatus({
        enabled: true,
        updatedBy: `Telegram Bot (${fromId})`,
        telegramUserId: fromId,
      });
      await sendTelegramMessage(chatId, "✅ Maintenance Enabled");
    } else if (text.startsWith("/maintenance off")) {
      await updateMaintenanceStatus({
        enabled: false,
        updatedBy: `Telegram Bot (${fromId})`,
        telegramUserId: fromId,
      });
      await sendTelegramMessage(chatId, "✅ Maintenance Disabled");
    } else if (text.startsWith("/maintenance status")) {
      const status = await getMaintenanceStatus(true);
      const responseText = `Maintenance:\n${status.enabled ? "Enabled" : "Disabled"}\n\nMessage:\n${status.message}\n\nEstimated Finish:\n${formatDateWIB(status.estimatedFinish)}\n\nUpdated At:\n${formatTimeOnlyWIB(status.updatedAt)}`;
      await sendTelegramMessage(chatId, responseText);
    } else if (text.startsWith("/maintenance message")) {
      const messageText = text.replace(/^\/maintenance message/, "").trim();
      if (!messageText) {
        await sendTelegramMessage(chatId, "❌ Please specify a maintenance message.\nExample: /maintenance message Database Upgrade");
        return NextResponse.json({ ok: true });
      }

      await updateMaintenanceStatus({
        message: messageText,
        updatedBy: `Telegram Bot (${fromId})`,
        telegramUserId: fromId,
      });
      await sendTelegramMessage(chatId, `✅ Message updated to:\n"${messageText}"`);
    } else if (text.startsWith("/maintenance eta")) {
      const etaText = text.replace(/^\/maintenance eta/, "").trim();
      if (!etaText) {
        await sendTelegramMessage(chatId, "❌ Please specify a date in YYYY-MM-DD HH:mm format.\nExample: /maintenance eta 2026-07-30 22:00");
        return NextResponse.json({ ok: true });
      }

      const dateRegex = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/;
      const match = etaText.match(dateRegex);

      if (!match) {
        await sendTelegramMessage(chatId, "❌ Invalid format. Please use YYYY-MM-DD HH:mm format.\nExample: /maintenance eta 2026-07-30 22:00");
        return NextResponse.json({ ok: true });
      }

      const [_, year, month, day, hour, minute] = match;
      const isoString = `${year}-${month}-${day}T${hour}:${minute}:00+07:00`;
      const date = new Date(isoString);

      if (isNaN(date.getTime())) {
        await sendTelegramMessage(chatId, "❌ Invalid date or time. Please check your input.");
        return NextResponse.json({ ok: true });
      }

      await updateMaintenanceStatus({
        estimatedFinish: date,
        updatedBy: `Telegram Bot (${fromId})`,
        telegramUserId: fromId,
      });
      await sendTelegramMessage(chatId, `✅ Estimated Finish updated to:\n${formatDateWIB(date)}`);
    } else if (text.startsWith("/start") || text.startsWith("/help")) {
      const helpText = `🛠️ *JJS Manage Maintenance Bot* 🛠️\n\nCommands:\n• \`/maintenance on\` - Enable maintenance mode\n• \`/maintenance off\` - Disable maintenance mode\n• \`/maintenance status\` - View current status\n• \`/maintenance message <text>\` - Change message\n• \`/maintenance eta YYYY-MM-DD HH:mm\` - Change Estimated Finish Time`;
      await sendTelegramMessage(chatId, helpText);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error processing telegram webhook:", error);
    // Always return 200/ok: true to Telegram to prevent infinite retry loops on failure
    return NextResponse.json({ ok: true });
  }
}
