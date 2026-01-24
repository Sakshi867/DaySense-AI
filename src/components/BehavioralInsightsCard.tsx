import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Eye, MousePointer, Clock, Zap, TrendingUp } from 'lucide-react';
import { useEnergy } from '@/contexts/EnergyContext';
import { useAuth } from '@/contexts/AuthContext';
import { passiveEnergyDetection } from '@/services/geminiService';
import GlassCard from './GlassCard';
import { cn } from '@/lib/utils';

interface BehavioralSignal {
  timestamp: Date;
  inferredEnergyLevel: number;
  confidenceScore: number;
  signalSummary: string;
  userMessage: string;
  timeOfDay: string;
  taskSwitchingFreq: number;
  idleTime: number;
}

const BehavioralInsightsCard: React.FC = () => {
  const { energyState, energyLevel } = useEnergy();
  const { user } = useAuth();
  const [behavioralHistory, setBehavioralHistory] = useState<BehavioralSignal[]>([]);
  const [currentInsight, setCurrentInsight] = useState<string | null>(null);
  const [currentConfidence, setCurrentConfidence] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Function to collect behavioral signals
  const collectBehavioralSignals = (): any => {
    const now = new Date();
    const hour = now.getHours();

    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'late_night' = 'morning';
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'late_night';

    // Simulate realistic behavioral signals
    // In a real app, these would be measured from actual user interactions
    return {
      timeOfDay,
      taskSwitchingFreq: Math.floor(Math.random() * 15), // Real tracking would measure actual task switches
      idleTime: Math.floor(Math.random() * 20), // Real tracking would measure actual idle times
      taskCompletionSpeed: Math.random() > 0.5 ? 'faster_than_usual' : Math.random() > 0.5 ? 'slower_than_usual' : 'usual',
      lateNightUsage: hour >= 22 || hour < 6,
      recentActivity: [] // Would contain actual recent user actions
    };
  };

  useEffect(() => {
    if (!user) return;

    // Initial collection
    const initialSignals = collectBehavioralSignals();
    passiveEnergyDetection.inferEnergyFromBehavior(initialSignals)
      .then(result => {
        const newEntry: BehavioralSignal = {
          timestamp: new Date(),
          inferredEnergyLevel: result.inferredEnergyLevel,
          confidenceScore: result.confidenceScore,
          signalSummary: result.signalSummary,
          userMessage: result.userMessage,
          timeOfDay: initialSignals.timeOfDay,
          taskSwitchingFreq: initialSignals.taskSwitchingFreq,
          idleTime: initialSignals.idleTime
        };

        setCurrentInsight(result.userMessage);
        setCurrentConfidence(result.confidenceScore);
        setLastUpdated(new Date());
        setBehavioralHistory(prev => [...prev.slice(-9), newEntry]); // Keep last 10 entries
      });

    // Set up interval to periodically update behavioral signals
    const interval = setInterval(() => {
      const signals = collectBehavioralSignals();
      passiveEnergyDetection.inferEnergyFromBehavior(signals)
        .then(result => {
          const newEntry: BehavioralSignal = {
            timestamp: new Date(),
            inferredEnergyLevel: result.inferredEnergyLevel,
            confidenceScore: result.confidenceScore,
            signalSummary: result.signalSummary,
            userMessage: result.userMessage,
            timeOfDay: signals.timeOfDay,
            taskSwitchingFreq: signals.taskSwitchingFreq,
            idleTime: signals.idleTime
          };

          setCurrentInsight(result.userMessage);
          setCurrentConfidence(result.confidenceScore);
          setLastUpdated(new Date());
          setBehavioralHistory(prev => [...prev.slice(-9), newEntry]); // Keep last 10 entries
        });
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-500';
    if (confidence >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getEnergyColor = (level: number) => {
    switch (level) {
      case 1: return 'text-red-500';
      case 2: return 'text-orange-500';
      case 3: return 'text-amber-500';
      case 4: return 'text-teal-500';
      case 5: return 'text-green-500';
      default: return 'text-foreground';
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-foreground" />
          <h2 className="text-xl font-bold">Behavioral Insights</h2>
        </div>
        <div className="text-xs text-muted-foreground">
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Loading...'}
        </div>
      </div>

      {currentInsight ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-muted/30">
            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground">
                {currentInsight}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-background/30">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">Inferred Level</span>
              </div>
              <span className={cn('font-bold', getEnergyColor(energyLevel))}>
                {energyLevel}/5
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-background/30">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Confidence</span>
              </div>
              <span className={cn('font-bold', getConfidenceColor(currentConfidence))}>
                {currentConfidence}%
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-border/30">
            <h3 className="text-sm font-semibold mb-3">Recent Patterns</h3>
            <div className="space-y-3">
              {behavioralHistory.slice(-3).reverse().map((entry, index) => (
                <motion.div
                  key={entry.timestamp.getTime()}
                  className="flex items-center justify-between text-xs"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-2">
                    <MousePointer className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{entry.timeOfDay}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span>{entry.idleTime}m idle</span>
                    </div>
                    <span className={cn(getEnergyColor(entry.inferredEnergyLevel))}>
                      {entry.inferredEnergyLevel}/5
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-muted-foreground">Analyzing behavior patterns...</p>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default BehavioralInsightsCard;