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
        select: {
          id: true,
          userId: true,
          userPhone: true,
          type: true,
          title: true,
          payload: true,
          entityId: true,
          scheduledFor: true,
          recurrence: true,
          parentActionId: true
        },
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

          // Recurrence logic: schedule next instance
          if (success && action.recurrence && action.scheduledFor) {
            const nextDate = calculateNextRecurrence(action.scheduledFor, action.recurrence);
            if (nextDate) {
              console.log(`🔄 [Scheduler] Recurring action detected. Scheduling next instance for ${nextDate.toISOString()}`);
              await prisma.action.create({
                data: {
                  userId: action.userId,
                  userPhone: action.userPhone,
                  type: action.type,
                  title: action.title,
                  status: "pending",
                  payload: action.payload || undefined,
                  entityId: action.entityId,
                  scheduledFor: nextDate,
                  recurrence: action.recurrence,
                  parentActionId: action.parentActionId || action.id, // Link to root parent
                }
              });
            }
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

function calculateNextRecurrence(currentDate: Date, rule: string): Date | null {
  const normalized = rule.toLowerCase().trim();
  let next = new Date(currentDate);
  const now = new Date();

  const applyIncrement = (d: Date) => {
    if (normalized === "daily" || normalized === "every day") {
      d.setDate(d.getDate() + 1);
    } else if (normalized === "weekly" || normalized === "every week") {
      d.setDate(d.getDate() + 7);
    } else if (normalized === "monthly" || normalized === "every month") {
      d.setMonth(d.getMonth() + 1);
    } else if (normalized === "yearly" || normalized === "every year" || normalized === "annually") {
      d.setFullYear(d.getFullYear() + 1);
    } else if (normalized.match(/every\s+(\d+)\s+(day|week|month)s?/)) {
      const match = normalized.match(/every\s+(\d+)\s+(day|week|month)s?/)!;
      const value = parseInt(match[1], 10);
      const unit = match[2];
      if (unit === "day") d.setDate(d.getDate() + value);
      else if (unit === "week") d.setDate(d.getDate() + (value * 7));
      else if (unit === "month") d.setMonth(d.getMonth() + value);
    } else {
      const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      let matched = false;
      for (let i = 0; i < weekdays.length; i++) {
        if (normalized === `every ${weekdays[i]}`) {
          d.setDate(d.getDate() + 7);
          matched = true;
          break;
        }
      }
      if (!matched) return false;
    }
    return true;
  };

  // Advance by the rule at least once
  if (!applyIncrement(next)) {
    return null;
  }

  // If the calculated time is still in the past (e.g., system down for days), advance it sequentially
  // to the next immediate future slot.
  let iterations = 0;
  while (next <= now && iterations < 1000) {
    if (!applyIncrement(next)) break;
    iterations++;
  }

  return next;
}
