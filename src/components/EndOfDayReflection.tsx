import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, Target, Calendar, Lightbulb, Moon, Sun, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import GlassCard from '@/components/GlassCard';
import { useDailyTracking } from '@/hooks/useDailyTracking';
import { groqService } from '@/services/groqService';
import { useAuth } from '@/contexts/AuthContext';
import { useEnergy } from '@/contexts/EnergyContext';

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
  const { northStar } = useEnergy();

  const [reflection, setReflection] = useState<{
    fullReflection: string;
    dailySummary: string;
    energyDrains: string;
    energyBoosts: string;
    reflectiveQuestion: string;
    tomorrowFocus: string;
  } | null>(null);

  const [flowScoreInsight, setFlowScoreInsight] = useState<{ scoreExplanation: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showReflection, setShowReflection] = useState(false);

  useEffect(() => {
    const generateReflection = async () => {
      // Check if we have enough data to summarize
      if (isOpen && user && (trackingData.completedTasks.length > 0 || trackingData.flowScore !== undefined)) {
        setLoading(true);
        try {
          // Generate end-of-day reflection
          const reflectionData = await groqService.generateEndOfDayReflection(
            trackingData.energyTimeline,
            trackingData.completedTasks,
            trackingData.pendingTasks,
            trackingData.passiveSignals,
            trackingData.flowScore || 0,
            northStar
          );

          setReflection(reflectionData);

          // Generate flow score insights if we have a flow score
          if (trackingData.flowScore !== undefined) {
            const flowInsight = await groqService.generateFlowScoreInsights(
              trackingData.flowScore
            );
            setFlowScoreInsight(flowInsight);
          }

          setShowReflection(true);
        } catch (error) {
          console.error('Error generating reflection:', error);
          const completionRate = trackingData.completedTasks.length + trackingData.pendingTasks.length > 0
            ? Math.round((trackingData.completedTasks.length / (trackingData.completedTasks.length + trackingData.pendingTasks.length)) * 100)
            : 0;
          setReflection({
            fullReflection: `Great job today! You completed ${trackingData.completedTasks.length} tasks with a ${completionRate}% completion rate. Your Flow Score of ${trackingData.flowScore || 0}% shows solid progress. I noticed you were most productive during your peak energy hours. What's one routine adjustment you could make tomorrow to maintain this momentum? Consider protecting your high-energy time blocks for your most important work.`,
            dailySummary: `Great job today! You completed ${trackingData.completedTasks.length} tasks with a ${completionRate}% completion rate. Your Flow Score of ${trackingData.flowScore || 0}% shows solid progress.`,
            energyDrains: 'Evening hours showed decreased energy levels',
            energyBoosts: 'Morning/afternoon hours aligned well with task demands',
            reflectiveQuestion: 'What one boundary could you set tomorrow to preserve your peak energy hours?',
            tomorrowFocus: 'Protect high-energy time blocks for priority tasks'
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

  const handleDownloadReport = () => {
    if (!reflection) return;

    const reportContent = `
DaySense AI - Daily Cognitive Report
Date: ${new Date().toLocaleDateString()}
------------------------------------------

DAILY SUMMARY:
${reflection.dailySummary}

FULL REFLECTION:
${reflection.fullReflection}

ENERGY ANALYSIS:
- Peak Energy: ${energyInsight?.peak || 'N/A'}
- Average Energy: ${energyInsight?.avg || 'N/A'}
- Energy Dip: ${energyInsight?.low || 'N/A'}

INSIGHTS:
- Energy Boosters: ${reflection.energyBoosts}
- Energy Drainers: ${reflection.energyDrains}

TOMORROW'S FOCUS:
${reflection.tomorrowFocus}

REFLECTIVE QUESTION:
${reflection.reflectiveQuestion}

STATS:
- Tasks Completed: ${trackingData.completedTasks.length}
- Flow Score: ${trackingData.flowScore || 0}%
------------------------------------------
Generated by DaySense AI
`;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DaySense_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
      <DialogContent className="max-w-2xl w-[95vw] rounded-3xl max-h-[90vh] overflow-y-auto glass-card border-white/20 bg-black/40 backdrop-blur-xl text-white scrollbar-hide">
        <DialogHeader className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <DialogTitle className="flex items-center gap-2 text-xl md:text-2xl font-bold">
            <Moon className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
            Daily Reflection
          </DialogTitle>
          {showReflection && reflection && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadReport}
              className="bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-300 w-full sm:w-auto"
            >
              <Zap className="w-3.5 h-3.5 mr-2" />
              Download Report
            </Button>
          )}
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
              {/* Coach Introduction */}
              <GlassCard className="p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-full bg-indigo-500/20">
                    <Brain className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Your DaySense Coach Says</h3>
                    <p className="text-sm text-gray-400">Closing the cognitive loop for tomorrow's success</p>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-200 leading-relaxed whitespace-pre-line">
                    {reflection.fullReflection}
                  </p>
                </div>
              </GlassCard>

              {/* Energy Pattern Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GlassCard className="p-4 text-center bg-white/5 border-white/10">
                  <Sun className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-amber-400">{energyInsight?.peak || 3}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Peak Energy</div>
                  <div className="text-xs text-amber-300 mt-1">Best performance hours</div>
                </GlassCard>

                <GlassCard className="p-4 text-center bg-white/5 border-white/10">
                  <Zap className="w-6 h-6 text-violet-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-violet-400">{energyInsight?.avg || 3}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Avg Energy</div>
                  <div className="text-xs text-violet-300 mt-1">Overall daily level</div>
                </GlassCard>

                <GlassCard className="p-4 text-center bg-white/5 border-white/10">
                  <Moon className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-400">{energyInsight?.low || 3}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Energy Dip</div>
                  <div className="text-xs text-slate-300 mt-1">Restoration needed</div>
                </GlassCard>
              </div>

              {/* Detailed Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Energy Drains */}
                <GlassCard className="p-5 bg-rose-500/10 border-rose-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                    <h4 className="font-semibold text-rose-400">Energy Drains</h4>
                  </div>
                  <p className="text-gray-300 text-sm">
                    {reflection.energyDrains || 'Identifying patterns that depleted your energy...'}
                  </p>
                </GlassCard>

                {/* Energy Boosts */}
                <GlassCard className="p-5 bg-emerald-500/10 border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <h4 className="font-semibold text-emerald-400">Energy Boosts</h4>
                  </div>
                  <p className="text-gray-300 text-sm">
                    {reflection.energyBoosts || 'Recognizing what fueled your productivity...'}
                  </p>
                </GlassCard>
              </div>

              {/* Reflective Question */}
              <GlassCard className="p-6 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border-violet-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-violet-400" />
                  <h3 className="text-xl font-bold text-white">Tonight's Reflection</h3>
                </div>

                <div className="bg-black/30 rounded-xl p-5 mb-4 border border-white/10">
                  <p className="text-white font-medium text-lg italic leading-relaxed">
                    "{reflection.reflectiveQuestion || 'What one small change could transform your tomorrow?'}"
                  </p>
                </div>

                <p className="text-sm text-gray-400">
                  This question helps calibrate your cognitive patterns for better energy management tomorrow.
                </p>
              </GlassCard>

              {/* Tomorrow's Focus */}
              <GlassCard className="p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-amber-400" />
                  <h3 className="text-xl font-bold text-white">Tomorrow's North Star</h3>
                </div>

                <div className="bg-black/30 rounded-xl p-4 mb-4 border border-white/10">
                  <p className="text-amber-100 font-medium">
                    {reflection.tomorrowFocus || 'Focus on protecting your peak energy hours for priority work.'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Your North Star: {northStar || 'Not set'}</span>
                  <span>Flow Score: {trackingData.flowScore || 0}%</span>
                </div>
              </GlassCard>

              {/* Completion Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
                  <Calendar className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-emerald-400">
                    {trackingData.completedTasks.length}
                  </div>
                  <div className="text-xs text-gray-500">Tasks Completed</div>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
                  <TrendingUp className="w-5 h-5 text-violet-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-violet-400">
                    {trackingData.flowScore || 0}%
                  </div>
                  <div className="text-xs text-gray-500">Flow Score™</div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent border-white/10 text-white hover:bg-white/5 h-12"
                  onClick={onClose}
                >
                  Reflect Later
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg h-12"
                  onClick={handleComplete}
                >
                  <Moon className="w-4 h-4 mr-2" />
                  Complete Reflection
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-indigo-500/10 w-fit mx-auto mb-4">
                <Moon className="w-12 h-12 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Ready for Reflection?</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">Complete at least one task today to unlock your personalized end-of-day cognitive reflection and prepare for tomorrow's success.</p>
              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-2"
              >
                Back to Dashboard
              </Button>
            </div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default EndOfDayReflection;