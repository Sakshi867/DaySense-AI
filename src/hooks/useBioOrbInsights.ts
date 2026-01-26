import { useState, useEffect, useCallback } from 'react';
import { useEnergy } from '@/contexts/EnergyContext';
import { useDailyTracking } from '@/hooks/useDailyTracking';
import { groqService } from '@/services/groqService';

export interface BioOrbInsight {
  insightMessage: string;
  visualCue: 'green' | 'yellow' | 'red';
  pulseSpeed: 'slow' | 'medium' | 'fast';
  glowIntensity: 'low' | 'medium' | 'high';
}

export const useBioOrbInsights = () => {
  const { energyLevel } = useEnergy();
  const { trackingData } = useDailyTracking();
  const [insight, setInsight] = useState<BioOrbInsight | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsight = useCallback(async () => {
    setLoading(true);
    try {
      // Get active/incomplete tasks
      const activeTasks = trackingData.pendingTasks.filter((task: any) => !task.completed);

      // Get current flow score (or 50 as neutral if undefined)
      const flowScore = trackingData.flowScore !== undefined ? trackingData.flowScore : 50;

      // Generate AI-powered insight
      const aiInsight = await groqService.generateBioOrbInsights(
        energyLevel,
        flowScore,
        activeTasks,
        trackingData.passiveSignals
      );

      setInsight(aiInsight);
    } catch (error) {
      console.error('Error generating Bio-Orb insight:', error);
      // Set fallback insight
      setInsight(generateFallbackInsight(energyLevel, trackingData.flowScore));
    } finally {
      setLoading(false);
    }
  }, [energyLevel, trackingData.flowScore, trackingData.pendingTasks, trackingData.passiveSignals]);

  // Generate fallback insight when AI fails
  const generateFallbackInsight = (currentEnergy: number, flowScore?: number): BioOrbInsight => {
    const effectiveFlowScore = flowScore !== undefined ? flowScore : 50;

    let visualCue: 'green' | 'yellow' | 'red' = 'green';
    let pulseSpeed: 'slow' | 'medium' | 'fast' = 'medium';
    let glowIntensity: 'low' | 'medium' | 'high' = 'medium';
    let insightMessage = '';

    // Determine visual cue based on flow score
    if (effectiveFlowScore >= 80) {
      visualCue = 'green';
      insightMessage = 'You\'re in great flow! Keep up the momentum with your current tasks.';
    } else if (effectiveFlowScore >= 60) {
      visualCue = 'yellow';
      insightMessage = 'Good progress! Consider aligning your next task with your energy level.';
    } else {
      visualCue = 'red';
      insightMessage = 'You might be overloaded. Take a moment to reassess your task priorities.';
      pulseSpeed = 'fast';
      glowIntensity = 'high';
    }

    // Adjust based on energy level
    if (currentEnergy <= 2) {
      insightMessage = 'Your energy is low. Consider lighter tasks or a short break to recharge.';
      visualCue = 'red';
      pulseSpeed = 'slow';
      glowIntensity = 'low';
    } else if (currentEnergy >= 4) {
      insightMessage = 'High energy detected! This is perfect for tackling challenging tasks.';
      visualCue = 'green';
      pulseSpeed = 'fast';
      glowIntensity = 'high';
    }

    return {
      insightMessage,
      visualCue,
      pulseSpeed,
      glowIntensity
    };
  };

  // Regenerate insight when key data changes
  useEffect(() => {
    generateInsight();
  }, [generateInsight]);

  // Also regenerate periodically for fresh insights
  useEffect(() => {
    const interval = setInterval(generateInsight, 300000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [generateInsight]);

  return {
    insight,
    loading,
    regenerate: generateInsight
  };
};