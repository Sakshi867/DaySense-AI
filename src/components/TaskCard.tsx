import React from 'react';
import { motion } from 'framer-motion';
import { Brain, MessageCircle, FileText, Palette, Heart, Clock, Zap, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { categoryColors } from '@/constants/mockData';
import { useEnergy } from '@/contexts/EnergyContext';
import { UserTask as Task } from '@/contexts/TaskContext';
import useBehaviorTracking from '@/hooks/useBehaviorTracking';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Extend the Task type with explanation property
interface ExtendedTask extends Task {
  explanation?: string;
}

interface TaskCardProps {
  task: ExtendedTask;
  onToggle?: (id: string) => void;
  index?: number;
}

const categoryIconMap = {
  'deep-work': Brain,
  'communication': MessageCircle,
  'admin': FileText,
  'creative': Palette,
  'wellness': Heart,
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, index = 0 }) => {
  const { energyLevel } = useEnergy();
  const { trackTaskSwitch, trackTaskCompletion } = useBehaviorTracking();
  
  // Handle task completion tracking
  const handleToggle = () => {
    if (onToggle) {
      // If completing the task, track it
      if (!task.completed) {
        // In a real implementation, we would track actual time spent
        // For now, we'll use the estimated time as a proxy
        trackTaskCompletion(task.estimated_minutes, task.estimated_minutes);
      }
      onToggle(task.id);
    }
    // Track task switch when clicking on the card
    trackTaskSwitch();
  };
  
  const Icon = categoryIconMap[task.category || 'admin'];
  
  const isLowEnergy = task.energy_cost > energyLevel && !task.completed;
  const isOptimal = task.energy_cost <= energyLevel && !task.completed;
  
  const getEnergyBadgeClass = () => {
    if (task.energy_cost <= 2) return 'energy-badge-low';
    if (task.energy_cost === 3) return 'energy-badge-medium';
    return 'energy-badge-high';
  };
  
  return (
    <motion.div
      className={cn(
        'glass-card group cursor-pointer relative overflow-hidden',
        task.completed && 'opacity-60',
        isLowEnergy && 'low-energy-warning',
        isOptimal && 'ring-1 ring-primary/30'
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={handleToggle}
    >
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
        
        {/* Completion checkbox */}
        <motion.div
          className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
            task.completed 
              ? 'bg-primary border-primary' 
              : 'border-muted-foreground/30 group-hover:border-primary/50'
          )}
          whileTap={{ scale: 0.9 }}
        >
          {task.completed && <Check className="w-4 h-4 text-primary-foreground" />}
        </motion.div>
      </div>
      
      {/* Footer with metadata */}
      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/50">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{task.estimated_minutes}m</span>
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
