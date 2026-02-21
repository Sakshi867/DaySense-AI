import React from 'react';
import { motion } from 'framer-motion';
import { Brain, MessageCircle, FileText, Palette, Heart, Clock, Zap, Check, Play, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { categoryColors } from '@/constants/mockData';
import { useEnergy } from '@/contexts/EnergyContext';
import { UserTask as Task, useTasks } from '@/contexts/TaskContext';
import useBehaviorTracking from '@/hooks/useBehaviorTracking';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { START_MESSAGES, getRandomMessage } from '@/constants/taskMessages';
import { useEffect, useState, useMemo } from 'react';

// Extend the Task type with explanation property
interface ExtendedTask extends Task {
  explanation?: string;
}

interface TaskCardProps {
  task: ExtendedTask;
  onToggle?: (id: string) => void;
  index?: number;
}

const categoryIconMap: Record<string, any> = {
  'work': Brain,
  'personal': Palette,
  'health': Heart,
  'learning': Zap,
  'admin': FileText,
  // Legacy mappings
  'deep-work': Brain,
  'communication': MessageCircle,
  'creative': Palette,
  'wellness': Heart,
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, index = 0 }) => {
  const { energyLevel } = useEnergy();
  const { startTask } = useTasks();
  const { trackTaskSwitch, trackTaskCompletion } = useBehaviorTracking();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Choose a message once when the component mounts or when task starts
  const creativeMessage = useMemo(() => {
    if (task.status === 'in_progress') {
      return getRandomMessage(START_MESSAGES);
    }
    return '';
  }, [task.status]);

  // Timer logic for in-progress tasks
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (task.status === 'in_progress' && task.started_at) {
      // Initialize elapsed time
      const startTime = new Date(task.started_at).getTime();
      const updateTimer = () => {
        const now = new Date().getTime();
        setElapsedSeconds(Math.floor((now - startTime) / 1000) + (task.total_seconds_spent || 0));
      };

      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setElapsedSeconds(task.total_seconds_spent || 0);
    }
    return () => clearInterval(interval);
  }, [task.status, task.started_at, task.total_seconds_spent]);

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle task completion tracking
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggle) {
      if (!task.completed) {
        // Track task completion with actual time if available, otherwise estimate
        const finalTime = task.status === 'in_progress' ? Math.floor(elapsedSeconds / 60) : task.estimated_minutes;
        trackTaskCompletion(finalTime, task.estimated_minutes);
      }
      onToggle(task.id);
    }
    trackTaskSwitch();
  };

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTask(task.id);
    trackTaskSwitch();
  };

  const Icon = categoryIconMap[task.category || 'admin'] || FileText;

  const isLowEnergy = task.energy_cost > energyLevel && !task.completed;
  const isOptimal = task.energy_cost <= energyLevel && !task.completed;

  const getEnergyBadgeClass = () => {
    if (task.energy_cost <= 2) return 'energy-badge-low';
    if (task.energy_cost === 3) return 'energy-badge-medium';
    return 'energy-badge-high';
  };

  return (
    <motion.div
      layout
      className={cn(
        'glass-card group cursor-pointer relative overflow-hidden',
        task.completed && 'opacity-60',
        isLowEnergy && 'low-energy-warning',
        isOptimal && 'ring-1 ring-primary/30'
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        layout: { duration: 0.3 },
        opacity: { duration: 0.2 }
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={() => !task.completed && task.status !== 'in_progress' && startTask(task.id)}
    >
      {/* Background decoration for in-progress */}
      {task.status === 'in_progress' && (
        <motion.div
          className="absolute inset-0 bg-primary/5 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}
      {/* Optimal indicator */}
      {isOptimal && (
        <motion.div
          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: index * 0.1 + 0.3 }}
        />
      )}

      {/* Low energy warning pulse */}
      {isLowEnergy && (
        <motion.div
          className="absolute inset-0 bg-amber-500/5 pointer-events-none"
          animate={{ opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {/* Category Icon */}
          <div className={cn(
            'p-2 rounded-xl',
            categoryColors[task.category]
          )}>
            <Icon className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex items-start gap-2">
                <h3 className={cn(
                  'font-semibold text-foreground truncate',
                  task.completed && 'line-through'
                )}>
                  {task.title}
                </h3>
                {task.explanation && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center cursor-help">
                          <span className="text-xs text-primary font-bold">i</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{task.explanation}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              {task.priority === 'high' && (
                <span className="text-xs px-1.5 py-0.5 bg-destructive/10 text-destructive rounded-full">
                  Priority
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {task.description || ''}
            </p>
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex flex-col items-end gap-2">
          {/* Start Button */}
          {!task.completed && task.status !== 'in_progress' && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg border-primary/20 hover:bg-primary/10 text-primary gap-1"
              onClick={handleStart}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start</span>
            </Button>
          )}

          {/* Timer Display */}
          {task.status === 'in_progress' && (
            <div className="flex items-center gap-1.5 text-primary font-mono text-sm bg-primary/10 px-2 py-1 rounded-lg">
              <Timer className="w-3.5 h-3.5 animate-pulse" />
              <span>{formatTime(elapsedSeconds)}</span>
            </div>
          )}

          {/* Completion checkbox */}
          <motion.div
            className={cn(
              'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
              task.completed
                ? 'bg-primary border-primary'
                : 'border-muted-foreground/30 group-hover:border-primary/50'
            )}
            whileTap={{ scale: 0.9 }}
            onClick={handleToggle}
          >
            {task.completed && <Check className="w-4 h-4 text-primary-foreground" />}
          </motion.div>
        </div>
      </div>

      {/* Motivational Message */}
      {task.status === 'in_progress' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 px-3 py-2 rounded-xl bg-primary/5 border border-primary/10 text-xs font-medium text-primary/80 italic"
        >
          "{creativeMessage}"
        </motion.div>
      )}

      {/* Footer with metadata */}
      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/50">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{task.estimated_minutes}m</span>
          {task.total_seconds_spent > 0 && !task.completed && task.status !== 'in_progress' && (
            <span className="text-xs">({formatTime(task.total_seconds_spent)} spent)</span>
          )}
          {task.completed && (
            <span className="text-xs text-primary/70 font-medium">Done in {formatTime(task.total_seconds_spent)}</span>
          )}
          {task.due_at && !task.completed && (
            <div className="flex items-center gap-1 text-xs font-medium text-amber-500/80">
              <Clock className="w-3 h-3" />
              <span>Due {new Date(task.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>

        <div className={cn('energy-badge', getEnergyBadgeClass())}>
          <Zap className="w-3 h-3" />
          <span>Energy {task.energy_cost}</span>
        </div>

        {isLowEnergy && (
          <span className="text-xs text-amber-600 font-medium ml-auto">
            Low energy warning
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default TaskCard;
