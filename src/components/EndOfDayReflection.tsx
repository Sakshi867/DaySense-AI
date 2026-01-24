import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, Target, Calendar, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import GlassCard from '@/components/GlassCard';
import { useDailyTracking } from '@/hooks/useDailyTracking';
import { geminiService } from '@/services/geminiService';
import { useAuth } from '@/contexts/AuthContext';

interface EndOfDayReflectionProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const EndOfDayReflection: React.FC<EndOfDayReflectionProps> = ({ 
  isOpen, 
  onClose,
  onComplete 
}) => {
  // FIX: Destructure from the hook correctly
  const { trackingData, resetDailyTracking } = useDailyTracking();
  const { user } = useAuth();
  const [reflection, setReflection] = useState<{
    dailySummary: string;
    reflectiveQuestion: string;
  } | null>(null);
  const [flowScoreInsight, setFlowScoreInsight] = useState<{scoreExplanation: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [showReflection, setShowReflection] = useState(false);

  useEffect(() => {
    const generateReflection = async () => {
      // Check if we have enough data to summarize
      if (isOpen && user && (trackingData.completedTasks.length > 0 || trackingData.flowScore !== undefined)) {
        setLoading(true);
        try {
          // Generate end-of-day reflection
          const reflectionData = await geminiService.generateEndOfDayReflection(
            trackingData.energyTimeline,
            trackingData.completedTasks,
            trackingData.pendingTasks,
            trackingData.passiveSignals,
            trackingData.flowScore || 0
          );
          
          setReflection(reflectionData);
          
          // Generate flow score insights if we have a flow score
          if (trackingData.flowScore !== undefined) {
            const flowInsight = await geminiService.generateFlowScoreInsights(
              trackingData.flowScore,
              trackingData.energyTimeline,
              trackingData.completedTasks,
              trackingData.pendingTasks,
              trackingData.passiveSignals
            );
            setFlowScoreInsight(flowInsight);
          }
          
          setShowReflection(true);
        } catch (error) {
          console.error('Error generating reflection:', error);
          setReflection({
            dailySummary: `Great job today! You completed ${trackingData.completedTasks.length} tasks and maintained a Flow Score of ${trackingData.flowScore || 0}%.`,
            reflectiveQuestion: `Looking at your patterns, what's one thing you'd change about your routine tomorrow?`
          });
          
          // Set fallback flow score insight
          setFlowScoreInsight({
            scoreExplanation: trackingData.flowScore !== undefined
              ? `Your Flow Score of ${trackingData.flowScore} reflects how well your energy matched your tasks today.`
              : 'Complete more tasks to calculate your Flow Score.'
          });
          
          setShowReflection(true);
        } finally {
          setLoading(false);
        }
      }
    };

    if (isOpen) {
      generateReflection();
    }
  }, [isOpen, user, trackingData.completedTasks.length, trackingData.flowScore]); // Optimized dependency array

  const handleComplete = () => {
    resetDailyTracking();
    setShowReflection(false);
    setReflection(null);
    onComplete?.();
    onClose();
  };

  const energyInsight = (() => {
    const energyLevels = trackingData.energyTimeline.map(e => e.level);
    if (energyLevels.length === 0) return null;
    
    const avgEnergy = energyLevels.reduce((sum, level) => sum + level, 0) / energyLevels.length;
    return {
      avg: avgEnergy.toFixed(1),
      peak: Math.max(...energyLevels),
      low: Math.min(...energyLevels)
    };
  })();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-card border-white/20 bg-black/40 backdrop-blur-xl text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Brain className="w-6 h-6 text-violet-400" />
            End-of-Day Reflection
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <div className="w-12 h-12 rounded-full border-4 border-t-violet-500 border-white/10 animate-spin mb-4" />
              <p className="text-gray-400">DaySense AI is analyzing your cognitive patterns...</p>
            </motion.div>
          ) : showReflection && reflection ? (
            <motion.div
              key="reflection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <GlassCard className="p-6 bg-white/5 border-white/10">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-violet-400" />
                  <h3 className="text-xl font-bold">The Day in Review</h3>
                </div>
                <p className="text-gray-300 leading-relaxed mb-6">
                  {reflection.dailySummary}
                </p>
                
                {energyInsight && (
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-violet-400">{energyInsight.avg}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">Avg Energy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-400">{energyInsight.peak}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">Peak Flow</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-400">{energyInsight.low}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">Lowest Dip</div>
                    </div>
                  </div>
                )}
              </GlassCard>

              <GlassCard className="p-6 bg-violet-500/10 border-violet-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-violet-400" />
                  <h3 className="text-xl font-bold">AI Insight</h3>
                </div>
                <div className="bg-black/20 rounded-xl p-4 mb-4 border border-white/5">
                  <p className="text-white font-medium italic">
                    "{reflection.reflectiveQuestion}"
                  </p>
                </div>
                <p className="text-sm text-gray-400">
                  Focusing on this answer helps calibrate your Bio-Orb for a better start tomorrow.
                </p>
              </GlassCard>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
                  <Calendar className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-emerald-400">
                    {trackingData.completedTasks.length}
                  </div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
                  <Target className="w-5 h-5 text-violet-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-violet-400">
                    {trackingData.flowScore || 0}%
                  </div>
                  <div className="text-xs text-gray-500">Flow Score™</div>
                </div>
              </div>
              
              {/* Flow Score Explanation */}
              {flowScoreInsight && (
                <GlassCard className="p-4 bg-gradient-to-r from-violet-500/10 to-blue-500/10 border-violet-500/20">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 w-2 h-2 rounded-full bg-violet-400 flex-shrink-0"></div>
                    <p className="text-sm text-gray-300">
                      {flowScoreInsight.scoreExplanation}
                    </p>
                  </div>
                </GlassCard>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 bg-transparent border-white/10 text-white hover:bg-white/5" onClick={onClose}>
                  Review Later
                </Button>
                <Button className="flex-1 bg-violet-600 hover:bg-violet-500 text-white" onClick={handleComplete}>
                  Complete Reflection
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Not Enough Data</h3>
              <p className="text-gray-400 mb-6">Complete at least one task today to unlock your daily reflection summary.</p>
              <Button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white border border-white/10">Back to Dashboard</Button>
            </div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default EndOfDayReflection;