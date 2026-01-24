import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Target, AlertTriangle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import GlassCard from '@/components/GlassCard';
import { BioOrbInsight } from '@/hooks/useBioOrbInsights';

interface BioOrbTooltipProps {
  insight: BioOrbInsight;
  isOpen: boolean;
  onClose: () => void;
  onNextTask?: () => void;
  onQuickTask?: () => void;
}

const BioOrbTooltip: React.FC<BioOrbTooltipProps> = ({ 
  insight, 
  isOpen, 
  onClose,
  onNextTask,
  onQuickTask
}) => {
  const getIconForVisualCue = () => {
    switch (insight.visualCue) {
      case 'green':
        return <Zap className="w-5 h-5 text-green-400" />;
      case 'yellow':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'red':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
    }
  };

  const getBackgroundColor = () => {
    switch (insight.visualCue) {
      case 'green':
        return 'bg-green-500/10 border-green-500/20';
      case 'yellow':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'red':
        return 'bg-red-500/10 border-red-500/20';
    }
  };

  const getPrimaryActionText = (visualCue: 'green' | 'yellow' | 'red') => {
    switch (visualCue) {
      case 'green':
        return 'Maintain This Flow';
      case 'yellow':
        return 'Adjust & Refocus';
      case 'red':
        return 'Recover Energy';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 bg-black/40 backdrop-blur-xl border-white/20 text-white">
        <div className={`p-6 ${getBackgroundColor()} rounded-lg`}>
          {/* Enhanced Header */}
          <div className="flex items-start justify-between mb-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-black/30">
                {getIconForVisualCue()}
              </div>
              <div>
                <h3 className="font-bold text-xl text-white">Bio-Orb Intelligence</h3>
                <p className="text-xs text-gray-400">Real-time energy analysis</p>
              </div>
            </div>
          </div>

          {/* Enhanced Insight Display */}
          <div className="mb-6 space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-black/20 border border-white/10">
              <div className="mt-0.5 flex-shrink-0">
                {getIconForVisualCue()}
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Current State</h4>
                <p className="text-gray-200 text-sm leading-relaxed">
                  {insight.insightMessage}
                </p>
              </div>
            </div>
            
            {/* Energy Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-white/5 border border-white/10">
                <div className="text-gray-400">Pulse</div>
                <div className="text-white font-medium capitalize">{insight.pulseSpeed}</div>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/10">
                <div className="text-gray-400">Glow</div>
                <div className="text-white font-medium capitalize">{insight.glowIntensity}</div>
              </div>
            </div>
          </div>

          {/* Enhanced Action Buttons with Context-Aware Suggestions */}
          <div className="flex flex-col gap-3">
            {/* Primary Action - Context Specific */}
            {onNextTask && (
              <Button
                onClick={onNextTask}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg"
              >
                <Target className="w-4 h-4 mr-2" />
                {getPrimaryActionText(insight.visualCue)}
              </Button>
            )}
            
            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-2">
              {onQuickTask && (
                <Button
                  variant="outline"
                  onClick={onQuickTask}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Quick Task
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => console.log('Analyzing energy drains...')}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                What's Draining?
              </Button>
            </div>
            
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full text-gray-400 hover:text-white hover:bg-white/5 mt-2"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BioOrbTooltip;