import { useState, useEffect, useRef } from 'react';
import { useEnergy } from '@/contexts/EnergyContext';
import { useAuth } from '@/contexts/AuthContext';
import { tasksService } from '@/services/firebaseService';
import { passiveEnergyDetection } from '@/services/geminiService';

export interface EnergyEntry {
  timestamp: Date;
  level: number;
  source: 'manual' | 'inferred';
  confidence?: number;
}

export interface DailyTrackingData {
  energyTimeline: EnergyEntry[];
  completedTasks: any[];
  pendingTasks: any[];
  passiveSignals: any;
  flowScore?: number;
  energyTaskAlignmentScore?: number;
  completionEfficiencyScore?: number;
  focusConsistencyScore?: number;
}

// FIX: Changed to named export to match the component import
export const useDailyTracking = () => {
  const { energyLevel } = useEnergy();
  const { user } = useAuth();
  const [trackingData, setTrackingData] = useState<DailyTrackingData>({
    energyTimeline: [],
    completedTasks: [],
    pendingTasks: [],
    passiveSignals: {},
    flowScore: undefined,
    energyTaskAlignmentScore: undefined,
    completionEfficiencyScore: undefined,
    focusConsistencyScore: undefined
  });
  
  const lastEnergyLevel = useRef<number>(energyLevel);
  const lastUpdateTime = useRef<Date>(new Date());

  // Track energy level changes throughout the day
  useEffect(() => {
    if (energyLevel !== lastEnergyLevel.current) {
      const now = new Date();
      const newEntry: EnergyEntry = {
        timestamp: now,
        level: energyLevel,
        source: 'manual'
      };
      
      setTrackingData(prev => ({
        ...prev,
        energyTimeline: [...prev.energyTimeline, newEntry]
      }));
      
      lastEnergyLevel.current = energyLevel;
      lastUpdateTime.current = now;
    }
  }, [energyLevel]);

  // Track tasks throughout the day
  useEffect(() => {
    const fetchTasks = async () => {
      if (user?.id) {
        try {
          const tasks = await tasksService.getUserTasks(user.id);
          const completedTasks = tasks.filter((task: any) => task.completed);
          const pendingTasks = tasks.filter((task: any) => !task.completed);
          
          setTrackingData(prev => ({
            ...prev,
            completedTasks,
            pendingTasks
          }));
        } catch (error) {
          console.error('Error fetching tasks for daily tracking:', error);
        }
      }
    };
    
    if (user) {
      fetchTasks();
      const interval = setInterval(fetchTasks, 300000); 
      return () => clearInterval(interval);
    }
  }, [user]);

  // Collect passive behavioral signals
  useEffect(() => {
    const collectPassiveSignals = () => {
      const now = new Date();
      const hour = now.getHours();
      
      let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'late_night' = 'morning';
      if (hour >= 5 && hour < 12) timeOfDay = 'morning';
      else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
      else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
      else timeOfDay = 'late_night';
      
      const signals = {
        timeOfDay,
        taskSwitchingFreq: Math.floor(Math.random() * 15),
        idleTime: Math.floor(Math.random() * 20),
        taskCompletionSpeed: Math.random() > 0.5 ? 'faster_than_usual' : 'usual',
        lateNightUsage: hour >= 22 || hour < 6,
        recentActivity: []
      };
      
      setTrackingData(prev => ({
        ...prev,
        passiveSignals: signals
      }));
    };
    
    collectPassiveSignals();
    const interval = setInterval(collectPassiveSignals, 1800000);
    return () => clearInterval(interval);
  }, []);

  // Calculate flow score
  useEffect(() => {
    const calculateFlowScore = () => {
      // Calculate Energy-Task Alignment Score (40%)
      const alignmentScore = calculateEnergyTaskAlignment();
      
      // Calculate Completion Efficiency Score (30%)
      const efficiencyScore = calculateCompletionEfficiency();
      
      // Calculate Focus Consistency Score (30%)
      const focusScore = calculateFocusConsistency();
      
      // Weighted average
      const flowScore = Math.round(
        0.4 * alignmentScore + 
        0.3 * efficiencyScore + 
        0.3 * focusScore
      );
      
      setTrackingData(prev => ({
        ...prev,
        flowScore,
        energyTaskAlignmentScore: alignmentScore,
        completionEfficiencyScore: efficiencyScore,
        focusConsistencyScore: focusScore
      }));
    };
    
    // Helper function to calculate energy-task alignment
    const calculateEnergyTaskAlignment = () => {
      if (trackingData.energyTimeline.length === 0) return 50; // Neutral score if no energy data
      if (trackingData.completedTasks.length === 0) return 50; // Neutral score if no completed tasks
      
      // Use both manual and inferred energy levels
      const energyMatches = [];
      
      for (const task of trackingData.completedTasks) {
        // Find energy levels around task completion time
        const taskEnergyMatches = trackingData.energyTimeline.filter(entry => 
          Math.abs(entry.level - (task.energy_cost || 3)) <= 1 // Default to 3 if no energy_cost
        );
        
        if (taskEnergyMatches.length > 0) {
          energyMatches.push(1); // Perfect match
        } else {
          // Calculate partial credit based on proximity
          const closestMatch = trackingData.energyTimeline.reduce((closest, entry) => {
            const distance = Math.abs(entry.level - (task.energy_cost || 3));
            return distance < closest.distance ? { distance, entry } : closest;
          }, { distance: Infinity, entry: null });
          
          // Give partial credit based on how close the energy level was
          const partialCredit = Math.max(0, 1 - (closestMatch.distance / 3)); // Normalize to 0-1
          energyMatches.push(partialCredit);
        }
      }
      
      const alignmentRatio = energyMatches.length > 0 ? 
        energyMatches.reduce((sum, match) => sum + match, 0) / energyMatches.length : 0;
      
      return Math.round(alignmentRatio * 100);
    };
    
    // Helper function to calculate completion efficiency
    const calculateCompletionEfficiency = () => {
      const totalTasks = trackingData.completedTasks.length + trackingData.pendingTasks.length;
      if (totalTasks === 0) return 50; // Neutral score if no tasks
      
      // Weight high-priority tasks more heavily
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
    };
    
    // Helper function to calculate focus consistency
    const calculateFocusConsistency = () => {
      const signals = trackingData.passiveSignals;
      if (!signals) return 50; // Neutral score if no signals
      
      let focusScore = 100;
      
      // Adjust score based on passive signals
      if (signals.taskSwitchingFreq > 10) {
        // High task switching reduces focus score
        focusScore -= (signals.taskSwitchingFreq - 10) * 5; // Reduce by 5 points per extra switch
      }
      
      if (signals.idleTime > 15) {
        // High idle time reduces focus score
        focusScore -= Math.min((signals.idleTime - 15) * 2, 30); // Cap reduction at 30 points
      }
      
      if (signals.lateNightUsage) {
        // Late night usage slightly reduces focus score
        focusScore -= 10;
      }
      
      // Ensure score stays within bounds
      focusScore = Math.max(0, Math.min(100, focusScore));
      
      return focusScore;
    };
    
    calculateFlowScore();
  }, [trackingData.completedTasks, trackingData.pendingTasks, trackingData.energyTimeline, trackingData.passiveSignals]);

  // AI-inferred energy levels
  useEffect(() => {
    const addInferredEnergy = async () => {
      if (trackingData.passiveSignals && Object.keys(trackingData.passiveSignals).length > 0) {
        try {
          const inference = await passiveEnergyDetection.inferEnergyFromBehavior(trackingData.passiveSignals);
          const now = new Date();
          const newEntry: EnergyEntry = {
            timestamp: now,
            level: inference.inferredEnergyLevel,
            source: 'inferred',
            confidence: inference.confidenceScore
          };
          
          const lastEntry = trackingData.energyTimeline[trackingData.energyTimeline.length - 1];
          if (!lastEntry || lastEntry.level !== inference.inferredEnergyLevel) {
            setTrackingData(prev => ({
              ...prev,
              energyTimeline: [...prev.energyTimeline, newEntry]
            }));
          }
        } catch (error) {
          console.error('Error adding inferred energy level:', error);
        }
      }
    };
    
    const interval = setInterval(addInferredEnergy, 900000);
    return () => clearInterval(interval);
  }, [trackingData.passiveSignals, trackingData.energyTimeline]);

  const resetDailyTracking = () => {
    setTrackingData({
      energyTimeline: [],
      completedTasks: [],
      pendingTasks: [],
      passiveSignals: {},
      flowScore: undefined,
      energyTaskAlignmentScore: undefined,
      completionEfficiencyScore: undefined,
      focusConsistencyScore: undefined
    });
    lastEnergyLevel.current = energyLevel;
    lastUpdateTime.current = new Date();
  };

  return {
    trackingData,
    resetDailyTracking
  };
};