import React from 'react';
import { TrendingUp, Target, Zap, Activity } from 'lucide-react';
import { useDailyTracking } from '@/hooks/useDailyTracking';
import GlassCard from './GlassCard';

interface FlowScoreDisplayProps {
  size?: 'sm' | 'md' | 'lg';
}

const FlowScoreDisplay: React.FC<FlowScoreDisplayProps> = ({ size = 'md' }) => {
  const { trackingData } = useDailyTracking();
  
  // Get flow score breakdown based on our calculation weights
  const flowScore = trackingData.flowScore || 0;
  
  // Determine score category for color coding
  const getScoreCategory = (score: number) => {
    if (score >= 80) return { text: 'In Flow', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    if (score >= 60) return { text: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
    return { text: 'Needs Attention', color: 'text-red-400', bg: 'bg-red-500/10' };
  };
  
  const scoreCategory = getScoreCategory(flowScore);

  // Size-dependent styles
  const sizeClasses = {
    sm: { scoreSize: 'text-2xl', labelSize: 'text-xs', iconSize: 'w-4 h-4' },
    md: { scoreSize: 'text-3xl', labelSize: 'text-sm', iconSize: 'w-5 h-5' },
    lg: { scoreSize: 'text-4xl', labelSize: 'text-base', iconSize: 'w-6 h-6' }
  };
  
  const classes = sizeClasses[size];

  return (
    <GlassCard className={`p-4 ${scoreCategory.bg} border ${scoreCategory.color.replace('text-', 'border-')}/20`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className={`${classes.iconSize} ${scoreCategory.color}`} />
            <span className={`${classes.labelSize} font-medium uppercase tracking-wider text-gray-400`}>
              Flow Score™
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`${classes.scoreSize} font-bold ${scoreCategory.color}`}>
              {flowScore}
            </span>
            <span className={`${classes.labelSize} text-gray-500`}>/100</span>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-xs font-medium ${scoreCategory.color}`}>
            {scoreCategory.text}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {trackingData.completedTasks.length} tasks
          </div>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="flex justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>Energy Alignment</span>
          </div>
          <span>{trackingData.energyTaskAlignmentScore || 0}%</span>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            <span>Task Efficiency</span>
          </div>
          <span>{trackingData.completionEfficiencyScore || 0}%</span>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Focus Consistency</span>
          </div>
          <span>{trackingData.focusConsistencyScore || 0}%</span>
        </div>
      </div>
    </GlassCard>
  );
};

export default FlowScoreDisplay;