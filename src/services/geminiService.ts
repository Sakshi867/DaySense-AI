import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_GEMINI_API_KEY;

// Log API key status for debugging
if (!API_KEY) {
  console.warn('⚠️  Gemini API key not found in environment variables');
  console.warn('Expected: VITE_GEMINI_API_KEY or VITE_GOOGLE_GEMINI_API_KEY');
} else {
  console.log('✅ Gemini API key found');
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Using gemini-1.5-pro model for enhanced capabilities
const MODEL_NAME = "models/gemini-1.5-pro";

// Fallback models in order of preference
const FALLBACK_MODELS = [
  "models/gemini-1.5-pro",
  "models/gemini-pro",
  "models/gemini-1.0-pro"
];

// Cache for available models to avoid repeated API calls
let cachedModelInfo: { available: string[]; bestAvailable: string | null } | null = null;

// Helper function to get a working generative model with fallback support
async function getWorkingModel() {
  // Use cached results if available
  if (cachedModelInfo) {
    if (cachedModelInfo.bestAvailable) {
      console.log(`🔄 Using cached model: ${cachedModelInfo.bestAvailable}`);
      return genAI.getGenerativeModel({ model: cachedModelInfo.bestAvailable });
    } else {
      throw new Error('No available models found in cache');
    }
  }
  
  // First, try to list available models
  console.log('🔄 Refreshing model availability cache...');
  const modelInfo = await listAvailableModels();
  cachedModelInfo = {
    available: modelInfo.available,
    bestAvailable: modelInfo.bestAvailable
  };
  
  if (modelInfo.bestAvailable) {
    console.log(`✅ Using model: ${modelInfo.bestAvailable}`);
    return genAI.getGenerativeModel({ model: modelInfo.bestAvailable });
  }
  
  // If no models work, throw a detailed error
  const errorMessage = `
❌ No available Gemini models found for your API key.

Debug Information:
- Available models tested: ${modelInfo.unavailable.length}
- Common issues:
  • API key may not have access to Gemini models
  • Project may not be enabled for the Generative AI API
  • Region restrictions may apply
  • Billing may not be enabled

Suggested actions:
1. Verify your API key at https://console.cloud.google.com/
2. Enable the Generative AI API for your project
3. Check billing is enabled for your Google Cloud project
4. Ensure your project has access to Gemini models
  `;
  
  throw new Error(errorMessage);
}
function pruneData(data: any[]): any[] {
  if (data.length <= 20) return data;
  
  // Get 10 most recent entries
  const recentEntries = data.slice(-10);
  
  // Get 5 most significant (highest/lowest energy) entries
  const sortedByEnergy = [...data].sort((a, b) => Math.abs(b.energy_level || b.level || 0) - Math.abs(a.energy_level || a.level || 0));
  const significantEntries = sortedByEnergy.slice(0, 5);
  
  // Combine and deduplicate
  const combined = [...recentEntries, ...significantEntries];
  const uniqueEntries = Array.from(new Set(combined.map(item => JSON.stringify(item))))
    .map(str => JSON.parse(str));
    
  return uniqueEntries.slice(0, 15); // Return up to 15 unique entries
}

// Safety fallback calculation
function calculateSafetyFallback(energyTimeline: any[]): number {
  if (!energyTimeline || energyTimeline.length === 0) {
    return 50; // Default to 50 if no data
  }
  
  // Calculate based on average energy level
  const avgEnergy = energyTimeline.reduce((sum, entry) => sum + (entry.level || 0), 0) / energyTimeline.length;
  // Convert to percentage (assuming energy level is out of 5)
  return Math.min(100, Math.max(0, Math.round((avgEnergy / 5) * 100)));
}

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
      const model = await getWorkingModel();
      
      // Prepare user data with pruning if necessary
      const completedTasks = tasks.filter(t => t.completed).length;
      const totalTasks = tasks.length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const optimalTasks = tasks.filter(t => !t.completed && t.energy_cost <= energyLevel);
      
      // System instruction for consistent JSON output
      const systemInstruction = {
        role: 'system',
        parts: [{
          text: `You are the DaySense AI Engine. Analyze user bio-rhythm data and return ONLY a JSON object. DO NOT include markdown formatting, backticks, or conversational text. JSON Structure: { "flow_score": number (0-100), "insight": "string (max 15 words)", "recommendation": "string (max 20 words)", "peak_hour": "string (HH:MM)" }`
        }]
      };
      
      const prompt = `
        User Question: "${userQuestion || 'Provide general productivity advice.'}"
        User Data:
        - Current energy level: ${energyLevel}/5
        - Total tasks: ${totalTasks}
        - Completed tasks: ${completedTasks}
        - Completion rate: ${completionRate}%
        - Optimal tasks available: ${optimalTasks.length}
        ${northStar ? `- North Star goal: "${northStar}"` : ''}
        
        Respond with the required JSON format ONLY.
      `;
      
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        systemInstruction: systemInstruction
      });
      
      const responseText = (await result.response).text();
      
      // Attempt to parse the response as JSON
      let parsedResponse;
      try {
        // Try to find JSON in the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.warn('Failed to parse Gemini response as JSON, using fallback:', parseError);
        // Return a safety fallback object
        return {
          insight: `Based on your ${completedTasks} completed tasks and ${energyLevel}/5 energy, keep up the good work.`,
          optimalTasks: optimalTasks.length,
          completionRate,
          recommendation: "Continue focusing on tasks aligned with your energy level."
        };
      }
      
      // Validate the response structure
      if (parsedResponse && typeof parsedResponse === 'object') {
        return {
          insight: parsedResponse.insight || `Based on your ${completedTasks} completed tasks, keep up the good work.`,
          optimalTasks: optimalTasks.length,
          completionRate,
          recommendation: parsedResponse.recommendation || "Continue focusing on tasks aligned with your energy level.",
          flowScore: parsedResponse.flow_score || completionRate
        };
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (error) {
      console.error('Error generating Gemini insight:', error);
      // Safety fallback based on simple calculation
      return {
        insight: `Based on your ${tasks.filter(t => t.completed).length} completed tasks and ${energyLevel}/5 energy, keep up the good work.`,
        optimalTasks: tasks.filter(t => !t.completed && t.energy_cost <= energyLevel).length,
        completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0,
        recommendation: "Continue focusing on tasks aligned with your energy level.",
        flowScore: tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0
      };
    }
  },

  generateTaskRecommendations: async (tasks: any[], energyLevel: number, timeOfDay?: string, passiveSignals?: any) => {
    try {
      const model = await getWorkingModel();
      const incompleteTasks = tasks.filter(task => !task.completed);
      if (incompleteTasks.length === 0) return [];
      
      // Prune task data if too large
      const prunedTasks = pruneData(incompleteTasks);
      
      // Get completion history for better context
      const completedTasks = tasks.filter(task => task.completed);
      const recentCompletions = completedTasks
        .sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())
        .slice(0, 5);
      
      // Calculate energy-task alignment scores
      const alignmentScores = prunedTasks.map(task => {
        const energyMatch = Math.abs(task.energy_cost - energyLevel);
        return {
          taskId: task.id,
          title: task.title,
          energyCost: task.energy_cost,
          alignmentScore: 1 - (energyMatch / 4) // Normalize to 0-1
        };
      });
      
      const taskDetails = prunedTasks.map(task => {
        const alignment = alignmentScores.find(a => a.taskId === task.id);
        return `- ${task.title} (Energy cost: ${task.energy_cost}/5, Est. ${task.estimated_minutes}min, Alignment: ${(alignment?.alignmentScore * 100).toFixed(0)}%)`;
      }).join('\n');
      
      const systemInstruction = {
        role: 'system',
        parts: [{
          text: `You are the DaySense Explainable AI Engine. Your role is to explain WHY each task is recommended NOW based on user context. DO NOT choose tasks - only explain the reasoning. Return ONLY valid JSON. Structure: [{"title": "task title", "explanation": "detailed reasoning why now (20-30 words)", "confidence": 0.0-1.0, "factors": ["factor1", "factor2"]}]`
        }]
      };
      
      const prompt = `
        CONTEXT FOR EXPLANATION:
        Current User State:
        - Energy Level: ${energyLevel}/5 (${energyLevel <= 2 ? 'Low' : energyLevel <= 3 ? 'Moderate' : 'High'})
        - Time of Day: ${timeOfDay || 'Unknown'}
        - Recent Activity: ${recentCompletions.length > 0 ? recentCompletions.map(t => t.title).join(', ') : 'None'}
        
        Behavioral Patterns:
        - Task Switching Frequency: ${passiveSignals?.taskSwitchingFreq || 'Unknown'}
        - Idle Time: ${passiveSignals?.idleTime || 'Unknown'} minutes
        - Completion Speed: ${passiveSignals?.taskCompletionSpeed || 'Normal'}
        - Late Night Usage: ${passiveSignals?.lateNightUsage ? 'Yes' : 'No'}
        
        TASK LIST WITH ALIGNMENT SCORES:
        ${taskDetails}
        
        INSTRUCTIONS:
        For EACH task, explain WHY it's recommended NOW considering:
        1. Energy-task alignment (higher alignment = better match)
        2. Time-of-day productivity patterns
        3. Recent completion momentum
        4. Cognitive load balance
        5. Focus consistency factors
        
        RETURN FORMAT ONLY:
        [{"title": "exact task title", "explanation": "Why this task now: [specific reason based on context]", "confidence": 0.85, "factors": ["energy_match", "timing", "momentum"]}]
        
        Example explanation: "Why this task now: Your focus peaks between 4-6 PM and this deep work task requires sustained concentration that matches your current high energy level."
      `;
  
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        systemInstruction: systemInstruction
      });
      
      const text = (await result.response).text();
      let recommendations;
      
      try {
        // Try to find JSON in the response
        const jsonMatch = text.match(/\[(.*?)\]/s);
        if (jsonMatch) {
          recommendations = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON array found in response');
        }
      } catch (parseError) {
        console.warn('Failed to parse recommendations as JSON, using fallback:', parseError);
        return prunedTasks.slice(0, 3).map(t => ({ 
          ...t,
          explanation: `Why this task now: Matches your current energy level (${energyLevel}/5) for optimal performance.`,
          confidence: 0.7,
          factors: ['energy_alignment']
        }));
      }
      
      return prunedTasks
        .filter(task => recommendations.some((rec: any) => rec.title === task.title))
        .map(task => {
          const rec = recommendations.find((r: any) => r.title === task.title);
          return {
            ...task,
            explanation: rec?.explanation || `Why this task now: Aligned with your energy level (${energyLevel}/5) for best results.`,
            confidence: rec?.confidence || 0.7,
            factors: rec?.factors || ['energy_match']
          };
        }).slice(0, 3);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return tasks.filter(t => !t.completed).slice(0, 3).map(t => ({ 
        ...t, 
        explanation: `Why this task now: Recommended based on energy alignment (${t.energy_cost}/5 matches your ${energyLevel}/5 level).`,
        confidence: 0.7,
        factors: ['energy_match']
      }));
    }
  },

  generateBioOrbInsights: async (currentEnergy: number, flowScore: number, _activeTasks: any[], _passiveSignals: any) => {
    try {
      const model = await getWorkingModel();
      
      const systemInstruction = {
        role: 'system',
        parts: [{
          text: `You are the DaySense AI Engine. Analyze user bio-rhythm data and return ONLY a JSON object. DO NOT include markdown formatting, backticks, or conversational text. JSON Structure: { "flow_score": number (0-100), "insight": "string (max 15 words)", "recommendation": "string (max 20 words)", "peak_hour": "string (HH:MM)" }`
        }]
      };
      
      const prompt = `Generate real-time Bio-Orb feedback for Energy: ${currentEnergy}, Flow: ${flowScore}.
        Return JSON: {"insightMessage": "...", "visualCue": "green|yellow|red", "pulseSpeed": "slow|medium|fast", "glowIntensity": "low|medium|high"}`;
    
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        systemInstruction: systemInstruction
      });
      
      const text = (await result.response).text();
      let parsedResponse;
      
      try {
        // Try to find JSON in the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.warn('Failed to parse BioOrb response as JSON, using fallback:', parseError);
        return { 
          insightMessage: currentEnergy > 3 ? "High energy! Push forward." : "Conserve energy for later.",
          visualCue: currentEnergy > 3 ? "green" : currentEnergy > 2 ? "yellow" : "red",
          pulseSpeed: currentEnergy > 3 ? "fast" : currentEnergy > 2 ? "medium" : "slow", 
          glowIntensity: currentEnergy > 3 ? "high" : currentEnergy > 2 ? "medium" : "low"
        };
      }
      
      return parsedResponse;
    } catch (error) {
      console.error('Bio-Orb Error:', error);
      return { 
        insightMessage: currentEnergy > 3 ? "High energy! Push forward." : "Conserve energy for later.",
        visualCue: currentEnergy > 3 ? "green" : currentEnergy > 2 ? "yellow" : "red",
        pulseSpeed: currentEnergy > 3 ? "fast" : currentEnergy > 2 ? "medium" : "slow", 
        glowIntensity: currentEnergy > 3 ? "high" : currentEnergy > 2 ? "medium" : "low"
      };
    }
  },

  generateEndOfDayReflection: async (energyTimeline: any[], completedTasks: any[], pendingTasks: any[], passiveSignals: any, flowScore?: number, northStar?: string) => {
    try {
      // Prune timeline data if too large
      const prunedTimeline = pruneData(energyTimeline);
      
      // Calculate energy patterns
      const energyLevels = prunedTimeline.map(e => e.level);
      const avgEnergy = energyLevels.length > 0 
        ? energyLevels.reduce((sum, level) => sum + level, 0) / energyLevels.length 
        : 3;
      
      const peakEnergy = energyLevels.length > 0 ? Math.max(...energyLevels) : 3;
      const lowEnergy = energyLevels.length > 0 ? Math.min(...energyLevels) : 3;
      
      // Calculate completion rate
      const totalTasks = completedTasks.length + pendingTasks.length;
      const completionRate = totalTasks > 0 
        ? Math.round((completedTasks.length / totalTasks) * 100) 
        : 0;
      
      const model = await getWorkingModel();
      
      const systemInstruction = {
        role: 'system',
        parts: [{
          text: `You are DaySense Reflection Coach. Your role is to provide thoughtful end-of-day cognitive reflection that builds self-awareness. Write naturally and conversationally. Focus on: 1) Energy pattern analysis, 2) Task completion insights, 3) Identifying energy drains/boosts, 4) One meaningful reflective question, 5) Tomorrow's focus suggestion. Be encouraging and insightful, like a human coach.`
        }]
      };
      
      const prompt = `
        DAYSENSE END-OF-DAY REFLECTION COACH
        
        TODAY'S DATA:
        Energy Pattern:
        - Average Energy: ${avgEnergy.toFixed(1)}/5
        - Peak Energy: ${peakEnergy}/5
        - Lowest Energy: ${lowEnergy}/5
        - Energy Timeline Entries: ${prunedTimeline.length}
        
        Task Performance:
        - Completed Tasks: ${completedTasks.length}
        - Pending Tasks: ${pendingTasks.length}
        - Completion Rate: ${completionRate}%
        
        Cognitive Metrics:
        - Flow Score: ${flowScore || 'Not calculated'}%
        - Passive Signals: ${JSON.stringify(passiveSignals || {})}
        
        User Context:
        - North Star Goal: ${northStar || 'Not set'}
        
        YOUR ROLE AS COACH:
        1. Summarize the day with warmth and insight
        2. Identify what drained energy (be specific about timing/patterns)
        3. Highlight what boosted flow and productivity
        4. Ask ONE thoughtful reflective question that promotes growth
        5. Suggest tomorrow's focus area to protect/boost energy
        
        RESPONSE FORMAT:
        Write in natural, conversational language like a human coach.
        Structure your response as:
        
        "Good evening! Let's reflect on your day...
        
        [Day Summary - 2-3 sentences warm acknowledgment]
        
        Energy Insights:
        • What drained you: [specific observation]
        • What energized you: [specific observation]
        
        [Reflective Question - ONE thoughtful question]
        
        Tomorrow's Focus:
        [Specific suggestion for tomorrow's energy protection/productivity]"
        
        EXAMPLE GOOD RESPONSE:
        "Good evening! You completed 3 of 5 tasks today with a solid 72% completion rate. I noticed your energy peaked around 2 PM but dipped significantly after 6 PM - those evening meetings really took a toll. Your most energizing work happened during morning hours when you tackled creative tasks. What one boundary could you set tomorrow to preserve that afternoon energy? Consider blocking 2-4 PM for your most important work and politely declining non-essential evening commitments."
      `;
      
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        systemInstruction: systemInstruction
      });
      
      const responseText = (await result.response).text();
      
      // Parse response to extract structured data
      let reflectionData = {
        fullReflection: responseText,
        dailySummary: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''),
        energyDrains: '',
        energyBoosts: '',
        reflectiveQuestion: '',
        tomorrowFocus: ''
      };
      
      // Extract specific components from the natural language response
      const lines = responseText.split('\n').filter(line => line.trim());
      
      // Look for energy insights section
      const energySectionIndex = lines.findIndex(line => 
        line.includes('Energy Insights') || line.includes('energy drain') || line.includes('drained you')
      );
      
      if (energySectionIndex !== -1) {
        // Extract energy drains and boosts
        const energyLines = lines.slice(energySectionIndex, energySectionIndex + 4);
        reflectionData.energyDrains = energyLines.find(line => line.includes('drain') || line.includes('dip') || line.includes('tired')) || '';
        reflectionData.energyBoosts = energyLines.find(line => line.includes('energized') || line.includes('boost') || line.includes('peak')) || '';
      }
      
      // Extract reflective question (look for question mark)
      reflectionData.reflectiveQuestion = lines.find(line => line.includes('?')) || 
        "What's one small change you could make tomorrow to protect your energy?";
      
      // Extract tomorrow's focus
      const tomorrowIndex = lines.findIndex(line => 
        line.includes('Tomorrow') || line.includes('tomorrow') || line.includes('focus')
      );
      
      if (tomorrowIndex !== -1) {
        reflectionData.tomorrowFocus = lines.slice(tomorrowIndex, tomorrowIndex + 3).join(' ');
      }
      
      return reflectionData;
    } catch (error) {
      console.error('Error generating end-of-day reflection:', error);
      
      // Comprehensive fallback with all elements
      const completionRate = completedTasks.length + pendingTasks.length > 0 
        ? Math.round((completedTasks.length / (completedTasks.length + pendingTasks.length)) * 100)
        : 0;
      
      return {
        fullReflection: `Great work today! You completed ${completedTasks.length} tasks with a ${completionRate}% completion rate. Your Flow Score of ${flowScore || 0}% shows solid progress. I noticed you were most productive during your peak energy hours. What's one routine adjustment you could make tomorrow to maintain this momentum? Consider protecting your high-energy time blocks for your most important work.`,
        dailySummary: `Great work today! You completed ${completedTasks.length} tasks with a ${completionRate}% completion rate. Your Flow Score of ${flowScore || 0}% shows solid progress.`,
        energyDrains: 'Evening hours showed decreased energy levels',
        energyBoosts: 'Morning/afternoon hours aligned well with task demands',
        reflectiveQuestion: 'What one boundary could you set tomorrow to preserve your peak energy hours?',
        tomorrowFocus: 'Protect high-energy time blocks for priority tasks'
      };
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

// Export a function to list all available models for debugging
export async function listAvailableModels() {
  try {
    console.log('🔍 Checking available Gemini models...');
    
    // Try to list models - this might not be available in all SDK versions
    // For now, we'll test common model names
    const commonModels = [
      'models/gemini-1.5-pro',
      'models/gemini-1.5-flash',
      'models/gemini-pro',
      'models/gemini-1.0-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-pro',
      'gemini-1.0-pro'
    ];
    
    const availableModels = [];
    const unavailableModels = [];
    
    for (const modelName of commonModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        // Test if model is accessible by making a simple request
        await model.generateContent({
          contents: [{
            role: 'user',
            parts: [{ text: 'test' }]
          }]
        });
        availableModels.push(modelName);
        console.log(`✅ Model available: ${modelName}`);
      } catch (error) {
        unavailableModels.push({
          name: modelName,
          error: error instanceof Error ? error.message : String(error)
        });
        console.log(`❌ Model unavailable: ${modelName} - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log('\n📊 Model Availability Summary:');
    console.log(`Available models (${availableModels.length}):`, availableModels);
    console.log(`Unavailable models (${unavailableModels.length}):`, unavailableModels.map(m => m.name));
    
    return {
      available: availableModels,
      unavailable: unavailableModels,
      bestAvailable: availableModels[0] || null
    };
  } catch (error) {
    console.error('❌ Error listing models:', error);
    return {
      available: [],
      unavailable: [],
      bestAvailable: null,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Export function to manually refresh model cache
export async function refreshModelCache() {
  console.log('🔄 Manually refreshing model cache...');
  cachedModelInfo = null; // Clear cache
  const modelInfo = await listAvailableModels();
  cachedModelInfo = {
    available: modelInfo.available,
    bestAvailable: modelInfo.bestAvailable
  };
  return cachedModelInfo;
}

// Export current cache status
export function getModelCacheStatus() {
  return cachedModelInfo;
}

export const localAIService = geminiService;