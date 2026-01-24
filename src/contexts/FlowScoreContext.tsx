import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useEnergy } from '@/contexts/EnergyContext';
import { useTasks } from '@/contexts/TaskContext';
import { useDailyTracking } from '@/hooks/useDailyTracking';

interface FlowScoreData {
  currentScore: number | null;
  dailyHistory: {
    date: string;
    score: number;
    energyAlignment: number;
    completionEfficiency: number;
    focusConsistency: number;
  }[];
  weeklyAverage: number | null;
  lastCalculated: Date | null;
}

interface FlowScoreContextType {
  flowScore: FlowScoreData;
  loading: boolean;
  error: string | null;
  calculateFlowScore: () => Promise<number>;
  getDailyScore: (date: string) => number | null;
  getWeeklyTrend: () => number[];
  refreshFlowScore: () => Promise<void>;
}

const FlowScoreContext = createContext<FlowScoreContextType | undefined>(undefined);

export { FlowScoreContext };

export const FlowScoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { energyLevel } = useEnergy();
  const { tasks } = useTasks();
  const { trackingData } = useDailyTracking();
  
  const [flowScore, setFlowScore] = useState<FlowScoreData>({
    currentScore: null,
    dailyHistory: [],
    weeklyAverage: null,
    lastCalculated: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate flow score based on the weighted formula
  const calculateFlowScore = useCallback(async (): Promise<number> => {
    setLoading(true);
    setError(null);
    
    try {
      // Wait for tracking data to be populated
      if (trackingData.completedTasks.length === 0) {
        // Return neutral score if no data
        const neutralScore = 50;
        setFlowScore(prev => ({
          ...prev,
          currentScore: neutralScore,
          lastCalculated: new Date()
        }));
        return neutralScore;
      }

      // Calculate Energy-Task Alignment Score (40%)
      const alignmentScore = calculateEnergyTaskAlignment();

      // Calculate Completion Efficiency Score (30%)
      const efficiencyScore = calculateCompletionEfficiency();

      // Calculate Focus Consistency Score (30%)
      const focusScore = calculateFocusConsistency();

      // Weighted average
      const calculatedScore = Math.round(
        0.4 * alignmentScore + 
        0.3 * efficiencyScore + 
        0.3 * focusScore
      );

      // Update flow score state
      setFlowScore(prev => ({
        ...prev,
        currentScore: calculatedScore,
        dailyHistory: [...prev.dailyHistory, {
          date: new Date().toISOString().split('T')[0],
          score: calculatedScore,
          energyAlignment: alignmentScore,
          completionEfficiency: efficiencyScore,
          focusConsistency: focusScore
        }],
        lastCalculated: new Date()
      }));

      return calculatedScore;
    } catch (err) {
      console.error('Error calculating flow score:', err);
      setError('Failed to calculate flow score');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [trackingData]);

  // Helper function to calculate energy-task alignment
  const calculateEnergyTaskAlignment = useCallback((): number => {
    if (trackingData.energyTimeline.length === 0) return 50; // Neutral score if no data
    
    const energyMatches = [];
    
    for (const task of trackingData.completedTasks) {
      const taskEnergyMatches = trackingData.energyTimeline.filter(entry => 
        Math.abs(entry.level - (task.energy_cost || 3)) <= 1
      );
      
      if (taskEnergyMatches.length > 0) {
        energyMatches.push(1); // Perfect match
      } else {
        const closestMatch = trackingData.energyTimeline.reduce((closest, entry) => {
          const distance = Math.abs(entry.level - (task.energy_cost || 3));
          return distance < closest.distance ? { distance, entry } : closest;
        }, { distance: Infinity, entry: null });
        
        const partialCredit = Math.max(0, 1 - (closestMatch.distance / 3));
        energyMatches.push(partialCredit);
      }
    }
    
    const alignmentRatio = energyMatches.length > 0 ? 
      energyMatches.reduce((sum, match) => sum + match, 0) / energyMatches.length : 0;
    
    return Math.round(alignmentRatio * 100);
  }, [trackingData]);

  // Helper function to calculate completion efficiency
  const calculateCompletionEfficiency = useCallback((): number => {
    const totalTasks = trackingData.completedTasks.length + trackingData.pendingTasks.length;
    if (totalTasks === 0) return 0;
    
    const weightedCompleted = trackingData.completedTasks.reduce((sum, task) => {
      const weight = task.priority === 'high' ? 1.5 : task.priority === 'medium' ? 1.2 : 1.0;
      return sum + weight;
    }, 0);
    
    const weightedTotal = totalTasks > 0 ? 
      trackingData.completedTasks.reduce((sum, task) => {
        const weight = task.priority === 'high' ? 1.5 : task.priority === 'medium' ? 1.2 : 1.0;
        return sum + weight;
      }, 0) + 
      trackingData.pendingTasks.reduce((sum, task) => {
        const weight = task.priority === 'high' ? 1.5 : task.priority === 'medium' ? 1.2 : 1.0;
        return sum + weight;
      }, 0) : 1;
    
    const efficiencyRatio = weightedCompleted / weightedTotal;
    return Math.round(efficiencyRatio * 100);
  }, [trackingData]);

  // Helper function to calculate focus consistency
  const calculateFocusConsistency = useCallback((): number => {
    const signals = trackingData.passiveSignals;
    if (!signals) return 50; // Neutral score if no signals
    
    let focusScore = 100;
    
    if (signals.taskSwitchingFreq > 10) {
      focusScore -= (signals.taskSwitchingFreq - 10) * 5;
    }
    
    if (signals.idleTime > 15) {
      focusScore -= Math.min((signals.idleTime - 15) * 2, 30);
    }
    
    if (signals.lateNightUsage) {
      focusScore -= 10;
    }
    
    return Math.max(0, Math.min(100, focusScore));
  }, [trackingData]);

  // Get daily score for a specific date
  const getDailyScore = useCallback((date: string): number | null => {
    const dailyRecord = flowScore.dailyHistory.find(record => record.date === date);
    return dailyRecord ? dailyRecord.score : null;
  }, [flowScore.dailyHistory]);

  // Get weekly trend data
  const getWeeklyTrend = useCallback((): number[] => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    return flowScore.dailyHistory
      .filter(record => new Date(record.date) >= weekAgo)
      .map(record => record.score);
  }, [flowScore.dailyHistory]);

  // Refresh flow score calculation
  const refreshFlowScore = useCallback(async () => {
    await calculateFlowScore();
  }, [calculateFlowScore]);

  // Recalculate when key dependencies change
  useEffect(() => {
    if (trackingData.completedTasks.length > 0) {
      calculateFlowScore();
    }
  }, [trackingData.completedTasks.length, trackingData.pendingTasks.length, energyLevel, calculateFlowScore]);

  // Calculate weekly average
  useEffect(() => {
    if (flowScore.dailyHistory.length > 0) {
      const recentWeek = flowScore.dailyHistory.slice(-7);
      const average = recentWeek.reduce((sum, record) => sum + record.score, 0) / recentWeek.length;
      setFlowScore(prev => ({
        ...prev,
        weeklyAverage: Math.round(average)
      }));
    }
  }, [flowScore.dailyHistory]);

  return (
    <FlowScoreContext.Provider
      value={{
        flowScore,
        loading,
        error,
        calculateFlowScore,
        getDailyScore,
        getWeeklyTrend,
        refreshFlowScore
      }}
    >
      {children}
    </FlowScoreContext.Provider>
  );
};

export const useFlowScore = (): FlowScoreContextType => {
  const context = useContext(FlowScoreContext);
  if (!context) {
    throw new Error('useFlowScore must be used within a FlowScoreProvider');
  }
  return context;
};