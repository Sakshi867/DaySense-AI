import { LocalNotifications } from '@capacitor/local-notifications';
import { groqService } from './groqService';

export interface UserTask {
    id: string;
    title: string;
    energy_cost: number;
    category?: string;
    start_time?: string; // ISO string
    due_at?: string;    // ISO string
    completed?: boolean;
    [key: string]: any;
}

export const NotificationService = {
    requestPermissions: async () => {
        const status = await LocalNotifications.requestPermissions();
        return status.display === 'granted';
    },

    scheduleTaskReminders: async (tasks: any[]) => {
        try {
            // Cancel existing task notifications (IDs 1000-4000) to avoid duplicates
            const pending = await LocalNotifications.getPending();
            const taskNotifications = pending.notifications.filter(n =>
                (n.id >= 1000 && n.id < 2000) || (n.id >= 3000 && n.id < 4000)
            );
            if (taskNotifications.length > 0) {
                await LocalNotifications.cancel({ notifications: taskNotifications });
            }

            const notifications = [];
            const now = new Date();

            for (const task of tasks) {
                if (task.completed) continue;

                // --- Start Time Reminder (Mindful Prep) ---
                if (task.start_time) {
                    try {
                        const startTime = new Date(task.start_time);
                        const prepTrigger = new Date(startTime.getTime() - 10 * 60 * 1000); // 10 minutes before

                        if (prepTrigger > now) {
                            const prepTemplates = [
                                `Take a deep breath, your next focus session "${task.title}" starts in 10 minutes.`,
                                `Gently preparing for "${task.title}". You've got this.`,
                                `Time to slowly transition. "${task.title}" is 10 minutes away.`,
                                `Mindful reminder: your focus on "${task.title}" begins shortly.`
                            ];
                            notifications.push({
                                title: 'Mindful Prep',
                                body: prepTemplates[Math.floor(Math.random() * prepTemplates.length)],
                                id: 1000 + (parseInt(task.id.substring(0, 3), 16) || Math.floor(Math.random() * 900)),
                                schedule: { at: prepTrigger },
                                extra: { taskId: task.id }
                            });
                        }
                    } catch (e) {
                        console.error(`Error parsing start_time for task ${task.id}:`, e);
                    }
                }

                // --- Deadline Reminder (Action Alert) ---
                if (task.due_at) {
                    try {
                        const dueTime = new Date(task.due_at);
                        const deadlineTrigger = new Date(dueTime.getTime() - 30 * 60 * 1000); // 30 minutes before

                        if (deadlineTrigger > now) {
                            notifications.push({
                                title: 'Deadline Approaching',
                                body: `Friendly reminder: Your task "${task.title}" is due in 30 minutes.`,
                                id: 3000 + (parseInt(task.id.substring(0, 3), 16) || Math.floor(Math.random() * 900)),
                                schedule: { at: deadlineTrigger },
                                extra: { taskId: task.id }
                            });
                        }
                    } catch (e) {
                        console.error(`Error parsing due_at for task ${task.id}:`, e);
                    }
                }
            }

            if (notifications.length > 0) {
                await LocalNotifications.schedule({ notifications });
                console.log(`Scheduled ${notifications.length} reminders.`);
            }
        } catch (error) {
            console.error('Error scheduling task reminders:', error);
        }
    },

    scheduleBatchSummary: async (tasks: any[]) => {
        try {
            await LocalNotifications.cancel({ notifications: [{ id: 2000 }] });

            const pending = tasks.filter(t => !t.completed);
            if (pending.length === 0) return;

            const trigger = new Date();
            trigger.setHours(20, 0, 0, 0); // 8:00 PM today

            if (trigger <= new Date()) {
                trigger.setDate(trigger.getDate() + 1);
            }

            await LocalNotifications.schedule({
                notifications: [{
                    title: 'Tomorrow Looks Bright',
                    body: 'You’ve planned a great day ahead. Rest well tonight so you can start fresh tomorrow!',
                    id: 2000,
                    schedule: { at: trigger }
                }]
            });
            console.log('Scheduled 8 PM batch summary.');
        } catch (error) {
            console.error('Error scheduling batch summary:', error);
        }
    }
};
