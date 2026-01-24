import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * 2026 UPDATE: 
 * 'gemini-1.5-flash' is now retired. 
 * Using 'gemini-3-flash-preview' for performance and to fix the 404 error.
 */
const MODEL_NAME = "gemini-3-flash-preview";

// Passive Energy Detection Service
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

    switch(timeOfDay) {
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

    // Sort entries correctly to calculate confidence
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

export const geminiService = {
  generateInsights: async (tasks: any[], energyLevel: number, northStar?: string, userQuestion?: string) => {
    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      const completedTasks = tasks.filter(t => t.completed).length;
      const totalTasks = tasks.length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const optimalTasks = tasks.filter(t => !t.completed && t.energy_cost <= energyLevel);
      
      const prompt = `
        As a productivity AI coach, respond to the user's question: "${userQuestion || 'Provide general productivity advice.'}"
        User Data:
        - Current energy level: ${energyLevel}/5
        - Total tasks: ${totalTasks}
        - Completed tasks: ${completedTasks}
        - Completion rate: ${completionRate}%
        - Optimal tasks available: ${optimalTasks.length}
        ${northStar ? `- North Star goal: "${northStar}"` : ''}
        
        Provide a helpful, personalized response to the user's question. Keep under 100 words.
      `;
      
      const result = await model.generateContent(prompt);
      const insight = (await result.response).text();
      
      return {
        insight: insight.trim(),
        optimalTasks: optimalTasks.length,
        completionRate,
        recommendation: generateRecommendation(optimalTasks, energyLevel)
      };
    } catch (error) {
      console.error('Error generating Gemini insight:', error);
      return generateFallbackInsight(tasks, energyLevel, northStar, userQuestion);
    }
  },

  generateTaskRecommendations: async (tasks: any[], energyLevel: number, _timeOfDay?: string, _passiveSignals?: any) => {
    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      const incompleteTasks = tasks.filter(task => !task.completed);
      if (incompleteTasks.length === 0) return [];
      
      const taskList = incompleteTasks.map(task => 
        `- ${task.title} (Energy cost: ${task.energy_cost}, Est. min: ${task.estimated_minutes})`
      ).join('\n');
      
      const prompt = `Rank these tasks for someone with energy level ${energyLevel}/5:
        ${taskList}
        Return ONLY a JSON array: [{"title": "task title", "explanation": "reasoning"}]`;
    
      const result = await model.generateContent(prompt);
      const text = (await result.response).text();
      const jsonString = text.includes('```') ? text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)?.[1] || text : text;
      const recommendations = JSON.parse(jsonString);
      
      return incompleteTasks
        .filter(task => recommendations.some((rec: any) => rec.title === task.title))
        .map(task => ({
          ...task,
          explanation: recommendations.find((rec: any) => rec.title === task.title)?.explanation || `Matches your energy.`
        })).slice(0, 3);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return tasks.filter(t => !t.completed).slice(0, 3).map(t => ({ ...t, explanation: "Recommended based on energy." }));
    }
  },

  generateBioOrbInsights: async (currentEnergy: number, flowScore: number, _activeTasks: any[], _passiveSignals: any) => {
    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      const prompt = `Generate real-time Bio-Orb feedback for Energy: ${currentEnergy}, Flow: ${flowScore}.
        Output JSON: {"insightMessage": "...", "visualCue": "green|yellow|red", "pulseSpeed": "slow|medium|fast", "glowIntensity": "low|medium|high"}`;
    
      const result = await model.generateContent(prompt);
      const text = (await result.response).text();
      const jsonString = text.includes('```') ? text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)?.[1] || text : text;
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Bio-Orb Error:', error);
      return { 
        insightMessage: currentEnergy > 3 ? "High energy! Push forward." : "Conserve energy for later.",
        visualCue: "green", pulseSpeed: "medium", glowIntensity: "medium" 
      };
    }
  },

  generateEndOfDayReflection: async (energyTimeline: any[], completedTasks: any[], pendingTasks: any[], passiveSignals: any, flowScore?: number) => {
    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      const prompt = `
        Analyze this user's day data and return JSON:
        { "dailySummary": "...", "reflectiveQuestion": "..." }
        Data: Energy: ${JSON.stringify(energyTimeline)}, Completed: ${completedTasks.length}, Flow: ${flowScore}
      `;
      
      const result = await model.generateContent(prompt);
      const text = (await result.response).text();
      const jsonString = text.includes('```') ? text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)?.[1] || text : text;
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error generating end-of-day reflection:', error);
      return { dailySummary: "Day complete!", reflectiveQuestion: "What was your biggest win?" };
    }
  },

  generateTaskExplanation: async (task: any, userEnergy: number) => {
    return { taskName: task.title, explanation: `Aligned with energy level ${userEnergy}.` };
  },
  generateFlowScoreInsights: async (score: number, _et: any[], _ct: any[], _pt: any[], _ps: any) => {
    return { scoreExplanation: `Your Flow Score is ${score}.` };
  },
  analyzeEnergyPatterns: async (_data: any[]) => {
    return { trend: 'stable', message: 'Patterns are emerging.', avgEnergy: 3 };
  }
};

function generateRecommendation(optimalTasks: any[], energyLevel: number) {
  if (optimalTasks.length === 0) return "Take a break to recharge.";
  return energyLevel >= 4 ? "Tackle your biggest challenge!" : "Focus on manageable wins.";
}

function generateFallbackInsight(tasks: any[], energyLevel: number, northStar?: string, userQuestion?: string) {
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const optimalTasks = tasks.filter(t => !t.completed && t.energy_cost <= energyLevel);
  
  // Generate more varied and contextual fallback responses
  let insight = "";
  
  if (userQuestion && userQuestion.toLowerCase().includes('break')) {
    // Generate break-related response
    if (energyLevel <= 2) {
      insight = "Your energy level is quite low. Consider taking a 5-10 minute break with some light stretching or deep breathing to recharge.";
    } else if (energyLevel >= 4) {
      insight = "Your energy is high! You could power through a few more tasks, but a brief break could help maintain this momentum.";
    } else {
      insight = "You're at a moderate energy level. A short break could help refresh your mind before continuing.";
    }
  } else if (userQuestion && (userQuestion.toLowerCase().includes('focus') || userQuestion.toLowerCase().includes('concentrate'))) {
    // Generate focus-related response
    insight = `With your current energy level of ${energyLevel}/5, you're in a good position to tackle focused work. Consider blocking out distractions for 25-30 minutes to maximize your concentration.`;
  } else if (userQuestion && userQuestion.toLowerCase().includes('north star')) {
    // Generate North Star-related response
    if (northStar) {
      insight = `Your North Star goal is: "${northStar}". Consider how your next task aligns with this overarching objective to maintain focus on what matters most.`;
    } else {
      insight = "You haven't set a North Star goal yet. Consider defining a primary objective to help prioritize your tasks and maintain motivation.";
    }
  } else {
    // Default response based on task completion and energy level
    if (completedTasks === 0 && totalTasks > 0) {
      insight = `You have ${totalTasks} tasks waiting. Your current energy level is ${energyLevel}/5. Consider starting with a lower energy-cost task to build momentum.`;
    } else if (completedTasks > 0) {
      insight = `You've completed ${completedTasks} tasks so far. Your energy level is at ${energyLevel}/5. ${optimalTasks.length > 0 ? `You have ${optimalTasks.length} tasks that match your current energy level.` : 'Consider taking a break or scheduling more demanding tasks for when your energy peaks.'}`;
    } else {
      insight = `You're off to a good start! With ${energyLevel}/5 energy, you're in a good position to tackle your planned tasks.`;
    }
  }
  
  return {
    insight: insight,
    optimalTasks: optimalTasks.length,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    recommendation: generateRecommendation(optimalTasks, energyLevel)
  };
}

export const localAIService = geminiService;