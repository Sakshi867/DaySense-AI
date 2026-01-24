import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useEnergy } from '@/contexts/EnergyContext';
import { useTasks } from '@/contexts/TaskContext';
import { useDailyTracking } from '@/hooks/useDailyTracking';
import { useFlowScore } from '@/contexts/FlowScoreContext';
import { geminiService } from '@/services/geminiService';

interface DailyReflection {
  date: string;
  dailySummary: string;
  reflectiveQuestion: string;
  flowScore?: number;
  energyInsights?: {
    avg: string;
    peak: number;
    low: number;
  };
  taskStats?: {
    completed: number;
    pending: number;
    efficiency: number;
  };
}

interface ReflectionContextType {
  reflections: DailyReflection[];
  currentReflection: DailyReflection | null;
  loading: boolean;
  error: string | null;
  generateDailyReflection: () => Promise<DailyReflection | null>;
  getReflectionByDate: (date: string) => DailyReflection | null;
  getRecentReflections: (limit?: number) => DailyReflection[];
  saveReflection: (reflection: DailyReflection) => Promise<void>;
  clearReflections: () => Promise<void>;
}

const ReflectionContext = createContext<ReflectionContextType | undefined>(undefined);

export const ReflectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { energyLevel } = useEnergy();
  const { tasks } = useTasks();
  const { trackingData } = useDailyTracking();
  const { flowScore } = useFlowScore();
  
  const [reflections, setReflections] = useState<DailyReflection[]>([]);
  const [currentReflection, setCurrentReflection] = useState<DailyReflection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate daily reflection using AI
  const generateDailyReflection = useCallback(async (): Promise<DailyReflection | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if we have enough data
      if (trackingData.completedTasks.length === 0) {
        throw new Error('Not enough data to generate reflection');
      }

      // Generate reflection using Gemini service
      const reflectionData = await geminiService.generateEndOfDayReflection(
        trackingData.energyTimeline,
        trackingData.completedTasks,
        trackingData.pendingTasks,
        trackingData.passiveSignals,
        flowScore.currentScore || 0
      );

      // Calculate energy insights
      const energyLevels = trackingData.energyTimeline.map(e => e.level);
      const energyInsights = energyLevels.length > 0 ? {
        avg: (energyLevels.reduce((sum, level) => sum + level, 0) / energyLevels.length).toFixed(1),
        peak: Math.max(...energyLevels),
        low: Math.min(...energyLevels)
      } : undefined;

      // Calculate task stats
      const completedCount = trackingData.completedTasks.length;
      const pendingCount = trackingData.pendingTasks.length;
      const totalTasks = completedCount + pendingCount;
      const efficiency = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

      const taskStats = {
        completed: completedCount,
        pending: pendingCount,
        efficiency
      };

      const today = new Date().toISOString().split('T')[0];
      
      const newReflection: DailyReflection = {
        date: today,
        dailySummary: reflectionData.dailySummary,
        reflectiveQuestion: reflectionData.reflectiveQuestion,
        flowScore: flowScore.currentScore || undefined,
        energyInsights,
        taskStats
      };

      // Update state
      setCurrentReflection(newReflection);
      setReflections(prev => {
        // Remove existing reflection for today if it exists
        const filtered = prev.filter(r => r.date !== today);
        return [...filtered, newReflection];
      });

      return newReflection;
    } catch (err) {
      console.error('Error generating daily reflection:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate reflection');
      return null;
    } finally {
      setLoading(false);
    }
  }, [trackingData, flowScore]);

  // Get reflection by date
  const getReflectionByDate = useCallback((date: string): DailyReflection | null => {
    return reflections.find(reflection => reflection.date === date) || null;
  }, [reflections]);

  // Get recent reflections
  const getRecentReflections = useCallback((limit: number = 7): DailyReflection[] => {
    return [...reflections]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }, [reflections]);

  // Save reflection (could be extended for persistence)
  const saveReflection = useCallback(async (reflection: DailyReflection) => {
    try {
      // In a real implementation, this would save to a database
      setReflections(prev => {
        const filtered = prev.filter(r => r.date !== reflection.date);
        return [...filtered, reflection];
      });
      setCurrentReflection(reflection);
    } catch (err) {
      console.error('Error saving reflection:', err);
      setError('Failed to save reflection');
      throw err;
    }
  }, []);

  // Clear all reflections
  const clearReflections = useCallback(async () => {
    try {
      setReflections([]);
      setCurrentReflection(null);
    } catch (err) {
      console.error('Error clearing reflections:', err);
      setError('Failed to clear reflections');
      throw err;
    }
  }, []);

  // Auto-generate reflection at end of day (9-10 PM)
  useEffect(() => {
    const checkEndOfDay = () => {
      const now = new Date();
      const hour = now.getHours();
      
      // Generate reflection between 9 PM and 10 PM if not already generated today
      if (hour >= 21 && hour < 22) {
        const today = now.toISOString().split('T')[0];
        const existingReflection = getReflectionByDate(today);
        
        if (!existingReflection && trackingData.completedTasks.length > 0) {
          generateDailyReflection();
        }
      }
    };

    // Check immediately on mount
    checkEndOfDay();
    
    // Check every minute
    const interval = setInterval(checkEndOfDay, 60000);
    
    return () => clearInterval(interval);
  }, [generateDailyReflection, getReflectionByDate, trackingData.completedTasks.length]);

  // Load reflections from localStorage on mount (basic persistence)
  useEffect(() => {
    try {
      const savedReflections = localStorage.getItem('daySense-reflections');
      if (savedReflections) {
        const parsed = JSON.parse(savedReflections);
        setReflections(parsed);
      }
    } catch (err) {
      console.error('Error loading saved reflections:', err);
    }
  }, []);

  // Save reflections to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('daySense-reflections', JSON.stringify(reflections));
    } catch (err) {
      console.error('Error saving reflections:', err);
    }
  }, [reflections]);

  return (
    <ReflectionContext.Provider
      value={{
        reflections,
        currentReflection,
        loading,
        error,
        generateDailyReflection,
        getReflectionByDate,
        getRecentReflections,
        saveReflection,
        clearReflections
      }}
    >
      {children}
    </ReflectionContext.Provider>
  );
};

export const useReflections = (): ReflectionContextType => {
  const context = useContext(ReflectionContext);
  if (!context) {
    throw new Error('useReflections must be used within a ReflectionProvider');
  }
  return context;
};