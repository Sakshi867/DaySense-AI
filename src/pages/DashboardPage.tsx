import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Clock, CheckCircle2, Brain } from 'lucide-react';
import { useEnergy } from '@/contexts/EnergyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/contexts/TaskContext';
import { useFlowScore } from '@/contexts/FlowScoreContext';
import { useReflections } from '@/contexts/ReflectionContext';
import TaskCard from '@/components/TaskCard';
import AIInsightCard from '@/components/AIInsightCard';
import GlassCard from '@/components/GlassCard';
import BioOrb from '@/components/BioOrb';
import BehavioralInsightsCard from '@/components/BehavioralInsightsCard';
import EndOfDayReflection from '@/components/EndOfDayReflection';
import FlowScoreDisplay from '@/components/FlowScoreDisplay';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import DashboardLayout from '@/components/layout/DashboardLayout';

const DashboardPage: React.FC = () => {
  const { energyLevel, energyState, northStar } = useEnergy();
  const { user } = useAuth();
  const { tasks, loading: tasksLoading, getPendingTasks, getCompletedTasks, getOptimalTasks, toggleTask } = useTasks();
  const { flowScore } = useFlowScore();
  const { generateDailyReflection, currentReflection } = useReflections();

  const [showEndOfDayReflection, setShowEndOfDayReflection] = useState(false);
  const [reflectionCompleted, setReflectionCompleted] = useState(false);

  // Track if user dismissed reflection today to prevent spamming on refresh
  const [hasDismissedReflection, setHasDismissedReflection] = useState(() => {
    try {
      const today = new Date().toDateString();
      return sessionStorage.getItem(`reflection_dismissed_${today}`) === 'true';
    } catch (e) {
      return false;
    }
  });

  // Trigger end-of-day reflection automatically
  useEffect(() => {
    const checkEndOfDay = () => {
      const now = new Date();
      const hour = now.getHours();

      // Show reflection between 9 PM and 10 PM if not already shown today or dismissed
      if (hour >= 21 && hour < 22 && !reflectionCompleted && !hasDismissedReflection) {
        setShowEndOfDayReflection(true);
      }
    };

    // Check immediately on mount
    checkEndOfDay();

    // Check every minute
    const interval = setInterval(checkEndOfDay, 60000);

    return () => clearInterval(interval);
  }, [reflectionCompleted, hasDismissedReflection]);

  const handleCloseReflection = () => {
    setShowEndOfDayReflection(false);
    try {
      const today = new Date().toDateString();
      sessionStorage.setItem(`reflection_dismissed_${today}`, 'true');
      setHasDismissedReflection(true);
    } catch (e) {
      console.warn("Could not save dismissal state", e);
    }
  };

  const completedTasksCount = getCompletedTasks().length;
  const pendingTasks = getPendingTasks();
  const optimalTasks = getOptimalTasks(energyLevel);

  const stats = useMemo(() => [
    {
      icon: CheckCircle2,
      label: 'Completed',
      value: `${completedTasksCount}/${tasks.length}`,
      color: 'text-primary',
    },
    {
      icon: TrendingUp,
      label: 'Streak',
      value: `${user?.streak_days || 0} days`,
      color: 'text-teal-500',
    },
    {
      icon: Target,
      label: 'Flow Score',
      value: `${flowScore.currentScore || 0}/100`,
      color: flowScore.currentScore !== null ?
        (flowScore.currentScore >= 80 ? 'text-emerald-500' :
          flowScore.currentScore >= 60 ? 'text-yellow-500' : 'text-red-500') :
        'text-gray-500',
    },
    {
      icon: Clock,
      label: 'Est. Time',
      value: `${pendingTasks.reduce((acc, t) => acc + t.estimated_minutes, 0)}m`,
      color: 'text-amber-500',
    },
  ], [completedTasksCount, tasks.length, user?.streak_days, flowScore.currentScore, pendingTasks]);

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.header
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                Good {getTimeOfDay()}, {user?.full_name || user?.email?.split('@')[0] || 'User'}
              </h1>
              {northStar && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="w-4 h-4" />
                  <span className="text-sm">
                    North Star: <strong className="text-foreground">{northStar}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Manual trigger for end-of-day reflection */}
              <Button
                variant="outline"
                className="flex items-center gap-2 w-full sm:w-auto"
                onClick={() => setShowEndOfDayReflection(true)}
              >
                <Brain className="w-4 h-4" />
                Daily Reflection
              </Button>

              {/* Quick Stats */}
              <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full sm:w-auto">
                {stats.map((stat) => (
                  <motion.div
                    key={stat.label}
                    className="glass-card px-3 py-1.5 md:px-4 md:py-2 flex items-center gap-2 flex-grow sm:flex-grow-0"
                    whileHover={{ y: -2 }}
                  >
                    <stat.icon className={cn('w-4 h-4', stat.color)} />
                    <div className="text-right">
                      <p className="text-[10px] md:text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-sm md:font-semibold">{stat.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.header>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Insight - Full Width on mobile, spans 2 cols on lg */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="p-4 md:p-5 h-full">
              <AIInsightCard />
            </GlassCard>
          </motion.div>

          {/* Bio-Orb Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="flex flex-col items-center justify-center p-6 h-full min-h-[250px]">
              <BioOrb size="md" showLabel interactive />
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Click to adjust energy
              </p>
            </GlassCard>
          </motion.div>

          {/* Optimal Tasks Section */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="p-5">
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold">Optimal Tasks</h2>
                  <p className="text-sm text-muted-foreground">
                    Matches your current energy level
                  </p>
                </div>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary self-start">
                  {optimalTasks.length} available
                </span>
              </div>

              <div className="grid gap-4">
                {optimalTasks.slice(0, 3).map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    index={index}
                  />
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Flow Score Display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="h-full"
          >
            <FlowScoreDisplay />
          </motion.div>

          {/* Behavioral Insights Section */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <BehavioralInsightsCard />
          </motion.div>

          {/* All Tasks Section */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GlassCard className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <div>
                  <h2 className="text-xl font-bold">All Tasks</h2>
                  <p className="text-sm text-muted-foreground">
                    Your complete task list for today
                  </p>
                </div>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary self-start">
                  {tasks.length} total
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    index={index}
                  />
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>

      <EndOfDayReflection
        isOpen={showEndOfDayReflection}
        onClose={handleCloseReflection}
        onComplete={() => setReflectionCompleted(true)}
      />
    </DashboardLayout>
  );
};

export default DashboardPage;
