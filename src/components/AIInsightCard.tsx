import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Lightbulb, ArrowRight, Loader2, Activity } from 'lucide-react';
import { useEnergy } from '@/contexts/EnergyContext';
import { useAuth } from '@/contexts/AuthContext';
import { tasksService } from '@/services/firebaseService';
import { groqService, passiveEnergyDetection } from '@/services/groqService';
import { cn } from '@/lib/utils';

const AIInsightCard: React.FC = () => {
  const { energyState, energyLevel, northStar } = useEnergy();
  const { user } = useAuth();
  const [insight, setInsight] = useState('Analyzing your productivity patterns...');
  const [passiveEnergyInsight, setPassiveEnergyInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [behavioralSignals, setBehavioralSignals] = useState<any>(null);

  // Function to collect behavioral signals
  const collectBehavioralSignals = (): any => {
    const now = new Date();
    const hour = now.getHours();

    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'late_night' = 'morning';
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'late_night';

    // These would be calculated based on actual user behavior tracking
    // For now, using realistic placeholder values that would be collected from real user interactions
    return {
      timeOfDay,
      taskSwitchingFreq: Math.floor(Math.random() * 15), // Actual tracking would measure real task switches
      idleTime: Math.floor(Math.random() * 20), // Actual tracking would measure real idle times
      taskCompletionSpeed: Math.random() > 0.5 ? 'faster_than_usual' : Math.random() > 0.5 ? 'slower_than_usual' : 'usual',
      lateNightUsage: hour >= 22 || hour < 6,
      recentActivity: [] // Would contain actual recent user actions
    };
  };

  useEffect(() => {
    const fetchInsight = async () => {
      if (user) {
        try {
          setLoading(true);

          // Collect behavioral signals
          const signals = collectBehavioralSignals();
          setBehavioralSignals(signals);

          // Fetch user tasks
          const tasks = await tasksService.getUserTasks(user.id);

          // Generate AI insight based on tasks and user data
          const aiResult = await groqService.generateInsights(tasks, energyLevel, northStar, undefined);
          setInsight(aiResult.insight);

          // Generate task recommendations with explanations
          const taskRecommendations = await groqService.generateTaskRecommendations(tasks, energyLevel, signals.timeOfDay, signals);

          // Generate passive energy inference based on behavioral signals
          const passiveEnergyResult = await passiveEnergyDetection.inferEnergyFromBehavior(signals);
          setPassiveEnergyInsight(passiveEnergyResult.userMessage);
        } catch (error) {
          console.error('Error generating AI insight:', error);
          setInsight('Could not load personalized insights. Check your connection.');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchInsight();

    // Set up interval to periodically update behavioral signals (simulating real-time tracking)
    const interval = setInterval(() => {
      if (user) {
        const signals = collectBehavioralSignals();
        setBehavioralSignals(signals);

        // Update passive energy inference based on new signals
        passiveEnergyDetection.inferEnergyFromBehavior(signals)
          .then(result => setPassiveEnergyInsight(result.userMessage));
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [user, energyLevel, northStar]);

  const getGradientClass = () => {
    switch (energyState) {
      case 'recharge':
        return 'from-amber-500/20 via-orange-500/10 to-transparent';
      case 'flow':
        return 'from-teal-500/20 via-emerald-500/10 to-transparent';
      case 'focus':
        return 'from-violet-500/20 via-purple-500/10 to-transparent';
    }
  };

  const getIconColor = () => {
    switch (energyState) {
      case 'recharge':
        return 'text-amber-500';
      case 'flow':
        return 'text-teal-500';
      case 'focus':
        return 'text-violet-500';
    }
  };

  return (
    <motion.div
      className="glass-card relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Gradient overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-r pointer-events-none',
          getGradientClass()
        )}
      />

      <div className="relative flex items-start gap-4">
        {/* Icon */}
        <motion.div
          className={cn(
            'p-3 rounded-2xl bg-gradient-to-br',
            energyState === 'recharge' && 'from-amber-100 to-orange-100',
            energyState === 'flow' && 'from-teal-100 to-emerald-100',
            energyState === 'focus' && 'from-violet-100 to-purple-100'
          )}
          animate={{
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Sparkles className={cn('w-6 h-6', getIconColor())} />
        </motion.div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-foreground">AI Insight</h3>
            <Lightbulb className={cn('w-4 h-4', getIconColor())} />
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <motion.p
                key={insight}
                className="text-muted-foreground leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {insight}
              </motion.p>

              {passiveEnergyInsight && (
                <motion.div
                  className="flex items-start gap-2 pt-2 border-t border-border/30 mt-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <Activity className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground/80 italic">
                    {passiveEnergyInsight}
                  </p>
                </motion.div>
              )}
            </div>
          )}

          <motion.button
            className={cn(
              'mt-4 inline-flex items-center gap-2 text-sm font-medium haptic',
              getIconColor()
            )}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.97 }}
          >
            View recommended tasks
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default AIInsightCard;
