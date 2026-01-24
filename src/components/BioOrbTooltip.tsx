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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 bg-black/40 backdrop-blur-xl border-white/20 text-white">
        <div className={`p-6 ${getBackgroundColor()} rounded-lg`}>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              {getIconForVisualCue()}
              <h3 className="font-bold text-lg">Bio-Orb Insight</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-auto text-gray-400 hover:text-white"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Main Insight */}
          <div className="mb-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Lightbulb className="w-4 h-4 text-violet-400" />
              </div>
              <p className="text-gray-200 leading-relaxed">
                {insight.insightMessage}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {onNextTask && (
              <Button
                onClick={onNextTask}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white"
              >
                <Target className="w-4 h-4 mr-2" />
                What to do next?
              </Button>
            )}
            
            {onQuickTask && (
              <Button
                variant="outline"
                onClick={onQuickTask}
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                Quick Task Creation
              </Button>
            )}
            
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full text-gray-400 hover:text-white hover:bg-white/5"
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