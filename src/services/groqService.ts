// Groq AI Service - Replaces Gemini Service
// Backend URL: https://daysense-backend.vercel.app

const BACKEND_URL = import.meta.env.VITE_GROQ_BACKEND_URL || 'https://daysense-backend.vercel.app';

// Helper function to convert energy level (1-5) to percentage (20-100)
function energyLevelToPercentage(level: number): number {
    return Math.min(100, Math.max(20, level * 20));
}

// Helper function to convert energy level to state
function energyLevelToState(level: number): 'RECHARGE' | 'FLOW' | 'FOCUSED' {
    if (level <= 2) return 'RECHARGE';
    if (level <= 3) return 'FLOW';
    return 'FOCUSED';
}

// Helper function to make API requests
async function makeRequest<T>(endpoint: string, body: any): Promise<T> {
    try {
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error calling ${endpoint}:`, error);
        throw error;
    }
}

// Passive Energy Detection Service (kept local - no backend needed)
export const passiveEnergyDetection = {
    inferEnergyFromBehavior: async (behavioralSignals: {
        timeOfDay: 'morning' | 'afternoon' | 'evening' | 'late_night';
        taskSwitchingFreq: number;
        idleTime: number;
        taskCompletionSpeed: 'faster_than_usual' | 'slower_than_usual' | 'usual';
        lateNightUsage: boolean;
        recentActivity?: any[];
    }) => {
        const {
            timeOfDay,
            taskSwitchingFreq,
            idleTime,
            taskCompletionSpeed,
            lateNightUsage
        } = behavioralSignals;

        let energyScores: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        switch (timeOfDay) {
            case 'morning':
                energyScores[4] += 15; energyScores[5] += 10; energyScores[1] += 5;
                break;
            case 'afternoon':
                energyScores[3] += 20; energyScores[2] += 15;
                break;
            case 'evening':
                energyScores[2] += 15; energyScores[3] += 10;
                break;
            case 'late_night':
                energyScores[1] += 20; energyScores[2] += 10;
                break;
        }

        if (taskSwitchingFreq > 10) {
            energyScores[1] += 15; energyScores[2] += 10;
        } else if (taskSwitchingFreq < 3) {
            energyScores[4] += 10; energyScores[5] += 5;
        }

        if (idleTime > 15) {
            energyScores[1] += 10; energyScores[2] += 15;
        } else if (idleTime < 5) {
            energyScores[4] += 10; energyScores[5] += 5;
        }

        if (taskCompletionSpeed === 'slower_than_usual') {
            energyScores[1] += 15; energyScores[2] += 10;
        } else if (taskCompletionSpeed === 'faster_than_usual') {
            energyScores[4] += 15; energyScores[5] += 10;
        }

        if (lateNightUsage) {
            energyScores[1] += 10; energyScores[2] += 5;
        }

        let inferredEnergyLevel = 1;
        let maxScore = energyScores[1];
        for (let i = 2; i <= 5; i++) {
            if (energyScores[i] > maxScore) {
                maxScore = energyScores[i];
                inferredEnergyLevel = i;
            }
        }

        const sortedScores = Object.entries(energyScores).sort((a, b) => (b[1] as number) - (a[1] as number));
        const highestScore = sortedScores[0][1] as number;
        const secondHighestScore = sortedScores[1][1] as number;
        const confidenceScore = highestScore === 0 ? 0 : Math.min(100, Math.round(((highestScore - secondHighestScore) / highestScore) * 100));

        let signalSummaryParts = [];
        if (taskSwitchingFreq > 10) signalSummaryParts.push("high task switching");
        if (idleTime > 15) signalSummaryParts.push("long idle periods");
        if (taskCompletionSpeed === 'slower_than_usual') signalSummaryParts.push("slower completion");
        if (lateNightUsage) signalSummaryParts.push("late-night usage");

        const signalSummary = signalSummaryParts.length > 0
            ? `Based on ${signalSummaryParts.join(", ")}`
            : "Based on general usage patterns";

        const energyDescriptors = ["", "very low", "low", "moderate", "high", "very high"];
        const userMessage = `AI thinks your energy is ${energyDescriptors[inferredEnergyLevel]} (${inferredEnergyLevel}/5) based on your recent activity patterns.`;

        return {
            inferredEnergyLevel,
            confidenceScore: Math.max(0, confidenceScore),
            signalSummary,
            userMessage
        };
    }
};

export const groqService = {
    // Method 1: Generate general AI insights
    generateInsights: async (tasks: any[], energyLevel: number, northStar?: string, userQuestion?: string) => {
        try {
            const response = await makeRequest<{
                insight: string;
                optimalTasks: number;
                completionRate: number;
                recommendation: string;
                flowScore: number;
            }>('/api/insights/generate', {
                tasks: tasks.map(t => ({
                    id: t.id,
                    title: t.title,
                    completed: t.completed,
                    energy_cost: t.energy_cost,
                    estimated_minutes: t.estimated_minutes
                })),
                energyLevel,
                northStar,
                userQuestion
            });

            return response;
        } catch (error) {
            console.error('Error generating insights:', error);
            // Fallback calculation
            const completedTasks = tasks.filter(t => t.completed).length;
            const totalTasks = tasks.length;
            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const optimalTasks = tasks.filter(t => !t.completed && t.energy_cost <= energyLevel).length;

            return {
                insight: `Based on your ${completedTasks} completed tasks and ${energyLevel}/5 energy, keep up the good work.`,
                optimalTasks,
                completionRate,
                recommendation: "Continue focusing on tasks aligned with your energy level.",
                flowScore: completionRate
            };
        }
    },

    // Method 2: Generate task recommendations
    generateTaskRecommendations: async (tasks: any[], energyLevel: number, timeOfDay?: string, passiveSignals?: any) => {
        try {
            const incompleteTasks = tasks.filter(task => !task.completed);
            if (incompleteTasks.length === 0) return [];

            const response = await makeRequest<{
                task: any;
                explanation: string;
                bio_orb: any;
            }>('/api/intelligence/next', {
                tasks: incompleteTasks.map(t => ({
                    id: t.id,
                    title: t.title,
                    energy_cost: t.energy_cost,
                    estimated_minutes: t.estimated_minutes,
                    priority: t.priority
                })),
                userContext: {
                    energyLevel: energyLevelToPercentage(energyLevel),
                    energyState: energyLevelToState(energyLevel),
                    timeOfDay: timeOfDay || 'afternoon',
                    passiveSignals: passiveSignals || {}
                }
            });

            // Return the recommended task with explanation
            if (response.task) {
                const fullTask = incompleteTasks.find(t => t.title === response.task.title) || response.task;
                return [{
                    ...fullTask,
                    explanation: response.explanation || `Recommended based on your current energy level.`,
                    confidence: 0.85,
                    factors: ['energy_match', 'timing']
                }];
            }

            return [];
        } catch (error) {
            console.error('Error generating recommendations:', error);
            // Fallback: return tasks matching energy level
            return tasks
                .filter(t => !t.completed && t.energy_cost <= energyLevel)
                .slice(0, 3)
                .map(t => ({
                    ...t,
                    explanation: `Matches your current energy level (${energyLevel}/5) for optimal performance.`,
                    confidence: 0.7,
                    factors: ['energy_alignment']
                }));
        }
    },

    // Method 3: Generate Bio-Orb insights
    generateBioOrbInsights: async (currentEnergy: number, flowScore: number, activeTasks: any[], passiveSignals: any) => {
        try {
            const response = await makeRequest<{
                task: any;
                explanation: string;
                bio_orb: {
                    level: number;
                    state: string;
                };
            }>('/api/intelligence/next', {
                tasks: activeTasks.map(t => ({
                    id: t.id,
                    title: t.title,
                    energy_cost: t.energy_cost,
                    estimated_minutes: t.estimated_minutes
                })),
                userContext: {
                    energyLevel: energyLevelToPercentage(currentEnergy),
                    energyState: energyLevelToState(currentEnergy),
                    timeOfDay: passiveSignals?.timeOfDay || 'afternoon',
                    passiveSignals: passiveSignals || {}
                }
            });

            // Map bio_orb response to expected format
            const bioOrb = response.bio_orb;
            let visualCue: 'green' | 'yellow' | 'red' = 'green';
            let pulseSpeed: 'slow' | 'medium' | 'fast' = 'medium';
            let glowIntensity: 'low' | 'medium' | 'high' = 'medium';

            // Determine visual cues based on energy level
            if (bioOrb.level >= 80) {
                visualCue = 'green';
                pulseSpeed = 'fast';
                glowIntensity = 'high';
            } else if (bioOrb.level >= 50) {
                visualCue = 'yellow';
                pulseSpeed = 'medium';
                glowIntensity = 'medium';
            } else {
                visualCue = 'red';
                pulseSpeed = 'slow';
                glowIntensity = 'low';
            }

            return {
                insightMessage: bioOrb.state === 'FOCUSED'
                    ? "High energy! Push forward."
                    : bioOrb.state === 'FLOW'
                        ? "Good flow state. Keep momentum."
                        : "Conserve energy for later.",
                visualCue,
                pulseSpeed,
                glowIntensity
            };
        } catch (error) {
            console.error('Bio-Orb Error:', error);
            // Fallback based on current energy - with proper type assertions
            const visualCue: 'green' | 'yellow' | 'red' = currentEnergy > 3 ? 'green' : currentEnergy > 2 ? 'yellow' : 'red';
            const pulseSpeed: 'slow' | 'medium' | 'fast' = currentEnergy > 3 ? 'fast' : currentEnergy > 2 ? 'medium' : 'slow';
            const glowIntensity: 'low' | 'medium' | 'high' = currentEnergy > 3 ? 'high' : currentEnergy > 2 ? 'medium' : 'low';

            return {
                insightMessage: currentEnergy > 3 ? "High energy! Push forward." : "Conserve energy for later.",
                visualCue,
                pulseSpeed,
                glowIntensity
            };
        }
    },

    // Method 4: Generate end-of-day reflection
    generateEndOfDayReflection: async (
        energyTimeline: any[],
        completedTasks: any[],
        pendingTasks: any[],
        passiveSignals: any,
        flowScore?: number,
        northStar?: string
    ) => {
        try {
            const allTasks = [
                ...completedTasks.map(t => ({ ...t, completed: true })),
                ...pendingTasks.map(t => ({ ...t, completed: false }))
            ];

            const response = await makeRequest<{
                summary: string;
                highs: string[];
                lows: string[];
                suggested_north_star: string;
            }>('/api/reflection', {
                tasks: allTasks.map(t => ({
                    title: t.title,
                    completed: t.completed,
                    energy_cost: t.energy_cost
                }))
            });

            // Map response to expected format
            const fullReflection = `${response.summary}\n\nWhat energized you:\n${response.highs.join('\n')}\n\nWhat drained you:\n${response.lows.join('\n')}`;

            return {
                fullReflection,
                dailySummary: response.summary,
                energyDrains: response.lows.join(', '),
                energyBoosts: response.highs.join(', '),
                reflectiveQuestion: "What's one small change you could make tomorrow to protect your energy?",
                tomorrowFocus: response.suggested_north_star || 'Focus on high-priority tasks during peak energy hours'
            };
        } catch (error) {
            console.error('Error generating end-of-day reflection:', error);

            // Fallback reflection
            const completionRate = completedTasks.length + pendingTasks.length > 0
                ? Math.round((completedTasks.length / (completedTasks.length + pendingTasks.length)) * 100)
                : 0;

            return {
                fullReflection: `Great work today! You completed ${completedTasks.length} tasks with a ${completionRate}% completion rate. Your Flow Score of ${flowScore || 0}% shows solid progress.`,
                dailySummary: `Great work today! You completed ${completedTasks.length} tasks with a ${completionRate}% completion rate.`,
                energyDrains: 'Evening hours showed decreased energy levels',
                energyBoosts: 'Morning/afternoon hours aligned well with task demands',
                reflectiveQuestion: 'What one boundary could you set tomorrow to preserve your peak energy hours?',
                tomorrowFocus: 'Protect high-energy time blocks for priority tasks'
            };
        }
    },

    // Legacy methods for compatibility
    generateTaskExplanation: async (task: any, userEnergy: number) => {
        return { taskName: task.title, explanation: `Aligned with energy level ${userEnergy}.` };
    },

    generateFlowScoreInsights: async (score: number) => {
        return { scoreExplanation: `Your Flow Score is ${score}.` };
    },

    analyzeEnergyPatterns: async (_data: any[]) => {
        return { trend: 'stable', message: 'Patterns are emerging.', avgEnergy: 3 };
    }
};

// Export as default for backward compatibility
export const localAIService = groqService;
