import cron from "node-cron";
import { prisma } from "./db/prisma.js";
import { sendWhatsAppMessage, sendMessageToRecipient } from "./whatsapp/connection.js";

export function startReminderScheduler() {
  console.log("⏰ [Scheduler] Starting Action Scheduler (runs every minute)...");

  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      // Find all pending scheduled actions (reminders, appointments, follow-ups, messages) that are due
      const actionsDue = await prisma.action.findMany({
        where: {
          scheduledFor: { lte: now },
          status: "pending",
        },
        select: { id: true, userId: true, userPhone: true, type: true, title: true, payload: true, entityId: true },
      });

      if (actionsDue.length === 0) return;

      console.log(`⏰ [Scheduler] Found ${actionsDue.length} scheduled action(s) due for execution.`);

      for (const action of actionsDue) {
        try {
          await prisma.action.update({
            where: { id: action.id },
            data: { status: "processing" },
          });

          let success = false;
          let notificationText = "";

          const payload = (action.payload || {}) as any;

          if (action.type === "scheduled_message" || action.type === "send_message") {
            const recipientPhone = payload.recipientPhone;
            const messageContent = payload.messageText || action.title;

            if (!recipientPhone) {
               console.warn(`⏰ [Scheduler] Scheduled message ${action.id} has no recipientPhone in payload, skipping.`);
               await prisma.action.update({ where: { id: action.id }, data: { status: "failed" } });
               continue;
            }

            console.log(`⏰ [Scheduler] Sending scheduled message to ${recipientPhone} for User ${action.userId}...`);
            success = await sendMessageToRecipient(action.userId, recipientPhone, messageContent);
            notificationText = `📤 *Scheduled Message Sent:* To ${payload.recipientName || recipientPhone}: "${messageContent}"`;
            
            // Inform the user that their scheduled message went out
            if (success && action.userPhone) {
               await sendWhatsAppMessage(action.userPhone, `✅ System has successfully delivered your scheduled message to *${payload.recipientName || recipientPhone}*: "${messageContent}"`);
            }
          } else {
            // Default behavior: Regular Reminders sent BACK to the user
            if (!action.userPhone) {
              console.warn(`⏰ [Scheduler] Action ${action.id} has no userPhone, skipping.`);
              continue;
            }

            console.log(`⏰ [Scheduler] Executing ${action.type}: "${action.title}" for ${action.userPhone}...`);
            notificationText = `⏰ *Reminder:* ${action.title}`;
            success = await sendWhatsAppMessage(action.userPhone, notificationText);
          }

          await prisma.action.update({
            where: { id: action.id },
            data: { status: success ? "completed" : "failed", completedAt: success ? new Date() : undefined },
          });

          if (success && action.userPhone) {
            // Store the event in conversation log for user context
            await prisma.conversationEvent.create({
              data: { userId: action.userId, userPhone: action.userPhone, role: "assistant", message: notificationText },
            });
          }
        } catch (execErr) {
          console.error(`⏰ [Scheduler] Error processing action ${action.id}:`, execErr);
          try {
            await prisma.action.update({ where: { id: action.id }, data: { status: "failed" } });
          } catch {}
        }
      }
    } catch (err) {
      console.error("⏰ [Scheduler] Critical error in scheduler loop:", err);
    }
  });
}
