import cron from "node-cron";
import { prisma } from "./db/prisma.js";
import { sendMessageToRecipient } from "./whatsapp/connection.js";
import { sendUnifiedMessage } from "./messaging.js";

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
          platform: true,
          userPhone: true,
          telegramChatId: true,
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

          const targetId = action.platform === "telegram" ? action.telegramChatId : action.userPhone;

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
            if (success && targetId) {
               await sendUnifiedMessage(action.platform, targetId, `✅ System has successfully delivered your scheduled message to *${payload.recipientName || recipientPhone}*: "${messageContent}"`);
            }
          } else {
            // Default behavior: Regular Reminders sent BACK to the user
            if (!targetId) {
              console.warn(`⏰ [Scheduler] Action ${action.id} has no destination address (userPhone/telegramChatId) on platform ${action.platform}, skipping.`);
              continue;
            }

            console.log(`⏰ [Scheduler] Executing ${action.type}: "${action.title}" for ${targetId} on platform ${action.platform}...`);
            notificationText = `⏰ *Reminder:* ${action.title}`;
            success = await sendUnifiedMessage(action.platform, targetId, notificationText);
          }

          await prisma.action.update({
            where: { id: action.id },
            data: { status: success ? "completed" : "failed", completedAt: success ? new Date() : undefined },
          });

          if (success && targetId) {
            // Store the event in conversation log for user context
            await prisma.conversationEvent.create({
              data: { userId: action.userId, userPhone: targetId, role: "assistant", message: notificationText },
            });
          }

        } catch (execErr) {
          console.error(`⏰ [Scheduler] Error processing action ${action.id}:`, execErr);
          try {
            await prisma.action.update({ where: { id: action.id }, data: { status: "failed" } });
          } catch {}
        } finally {
          // Recurrence logic: always schedule next instance to ensure determinism
          if (action.recurrence && action.scheduledFor) {
            try {
              const nextDate = calculateNextRecurrence(action.scheduledFor, action.recurrence);
              if (nextDate) {
                console.log(`🔄 [Scheduler] Recurring action detected. Scheduling next instance for ${nextDate.toISOString()}`);
                await prisma.action.create({
                  data: {
                    userId: action.userId,
                    platform: action.platform,
                    userPhone: action.userPhone,
                    telegramChatId: action.telegramChatId,
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
              } else {
                console.warn(`⚠️ [Scheduler] Could not calculate next recurrence for action ${action.id} with rule: ${action.recurrence}`);
              }
            } catch (recurErr) {
              console.error(`⏰ [Scheduler] Failed to schedule next recurrence for ${action.id}:`, recurErr);
            }
          }
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
    } else if (normalized === "hourly" || normalized === "every hour") {
      d.setHours(d.getHours() + 1);
    } else if (normalized === "every weekday" || normalized === "weekdays" || normalized === "every working day") {
      const currentDay = d.getDay();
      if (currentDay === 5) {
        d.setDate(d.getDate() + 3); // Friday -> Monday
      } else if (currentDay === 6) {
        d.setDate(d.getDate() + 2); // Saturday -> Monday
      } else {
        d.setDate(d.getDate() + 1); // Sunday-Thursday -> Next day
      }
    } else if (normalized === "every weekend" || normalized === "weekends") {
      const currentDay = d.getDay();
      if (currentDay === 6) {
        d.setDate(d.getDate() + 1); // Saturday -> Sunday
      } else {
        const diff = 6 - currentDay;
        d.setDate(d.getDate() + (diff <= 0 ? diff + 7 : diff)); // Next Saturday
      }
    } else if (normalized.match(/every\s+(\d+)\s+(minute|hour|day|week|month|year)s?/)) {
      const match = normalized.match(/every\s+(\d+)\s+(minute|hour|day|week|month|year)s?/)!;
      const value = parseInt(match[1], 10);
      const unit = match[2];
      if (unit === "minute") d.setMinutes(d.getMinutes() + value);
      else if (unit === "hour") d.setHours(d.getHours() + value);
      else if (unit === "day") d.setDate(d.getDate() + value);
      else if (unit === "week") d.setDate(d.getDate() + (value * 7));
      else if (unit === "month") d.setMonth(d.getMonth() + value);
      else if (unit === "year") d.setFullYear(d.getFullYear() + value);
    } else {
      const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      let matched = false;
      for (let i = 0; i < weekdays.length; i++) {
        if (normalized === `every ${weekdays[i]}`) {
          let diff = i - d.getDay();
          if (diff <= 0) diff += 7;
          d.setDate(d.getDate() + diff);
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
