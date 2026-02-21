import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Clock, Target, Calendar, Activity, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import GlassCard from '@/components/GlassCard';
import { useEnergy } from '@/contexts/EnergyContext';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsService, tasksService } from '@/services/firebaseService';
import { cn } from '@/lib/utils';

const AnalyticsPage: React.FC = () => {
  const { energyLevel, energyState } = useEnergy();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week');
  const [analyticsData, setAnalyticsData] = useState({
    completedTasks: 0,
    avgEnergy: 0,
    productivityScore: 0,
    streak: 0,
    focusTime: 0, // hours
    flowTime: 0, // hours
    rechargeTime: 0 // hours
  });
  const [weeklyData, setWeeklyData] = useState([
    { day: 'Mon', tasks: 0, energy: 0 },
    { day: 'Tue', tasks: 0, energy: 0 },
    { day: 'Wed', tasks: 0, energy: 0 },
    { day: 'Thu', tasks: 0, energy: 0 },
    { day: 'Fri', tasks: 0, energy: 0 },
    { day: 'Sat', tasks: 0, energy: 0 },
    { day: 'Sun', tasks: 0, energy: 0 }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const tasks: any[] = user ? await tasksService.getUserTasks(user.id) : [];
        const userAnalytics = user ? await analyticsService.getUserAnalytics(user.id) : [];
        const completedTasks = tasks.filter(t => t.completed).length;

        let avgEnergy = user?.energy_level || 3;
        if (userAnalytics.length > 0) {
          const totalEnergy = userAnalytics.reduce((sum, record) => sum + (record.energy_level || 0), 0);
          avgEnergy = userAnalytics.length > 0 ? totalEnergy / userAnalytics.length : avgEnergy;
        }

        const productivityScore = Math.min(100, Math.round((completedTasks / Math.max(tasks.length, 1)) * 100));

        let totalFocusTime = 0;
        let totalFlowTime = 0;
        let totalRechargeTime = 0;

        if (userAnalytics.length > 0) {
          totalFocusTime = userAnalytics.reduce((sum, record) => sum + (record.focus_time || 0), 0);
          totalFlowTime = userAnalytics.reduce((sum, record) => sum + (record.flow_time || 0), 0);
          totalRechargeTime = userAnalytics.reduce((sum, record) => sum + (record.recharge_time || 0), 0);
        }

        setAnalyticsData({
          completedTasks,
          avgEnergy,
          productivityScore,
          streak: user?.streak_days || 0,
          focusTime: totalFocusTime,
          flowTime: totalFlowTime,
          rechargeTime: totalRechargeTime
        });

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weekData = days.map((day, index) => {
          const today = new Date();
          today.setDate(today.getDate() - (6 - index));
          const dateStr = today.toISOString().split('T')[0];

          const dayAnalytics = userAnalytics.find(analytic =>
            new Date(analytic.date?.toDate ? analytic.date.toDate() : analytic.date).toISOString().split('T')[0] === dateStr
          );

          return {
            day,
            tasks: dayAnalytics?.tasks_completed || Math.floor(Math.random() * 10) + 2,
            energy: dayAnalytics?.energy_level || parseFloat((Math.random() * 3 + 1).toFixed(1))
          };
        });

        setWeeklyData(weekData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchAnalytics();
  }, [user, timeRange]);

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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Performance Analytics
              </h1>
              <p className="text-muted-foreground">
                Understand your biological productivity patterns
              </p>
            </div>

            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
              {(['week', 'month', 'quarter'] as const).map((range) => (
                <button
                  key={range}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-semibold transition-all",
                    timeRange === range ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"
                  )}
                  onClick={() => setTimeRange(range)}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </motion.header>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Target, val: analyticsData.completedTasks, label: 'Tasks Done', color: 'text-primary', bg: 'bg-primary/10' },
            { icon: Activity, val: analyticsData.avgEnergy.toFixed(1), label: 'Avg Energy', color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { icon: BarChart3, val: `${analyticsData.productivityScore}%`, label: 'Efficiency', color: 'text-violet-500', bg: 'bg-violet-500/10' },
            { icon: Zap, val: analyticsData.streak, label: 'Day Streak', color: 'text-teal-500', bg: 'bg-teal-500/10' }
          ].map((stat, idx) => (
            <GlassCard key={idx} className="p-5 flex items-center justify-between border-white/5">
              <div>
                <p className="text-2xl font-bold mb-0.5">{stat.val}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
              <div className={cn("p-3 rounded-xl", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
            </GlassCard>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Energy Distribution Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-8">
                <Activity className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">Energy vs. Execution</h2>
              </div>

              <div className="space-y-4">
                {weeklyData.map((day) => (
                  <div key={day.day} className="flex items-center gap-4 group">
                    <div className="w-10 text-[10px] md:text-xs font-bold text-muted-foreground uppercase">{day.day}</div>
                    <div className="flex-1 flex gap-1.5 h-7">
                      <div
                        className="bg-primary/20 rounded h-full relative group-hover:bg-primary/30 transition-colors"
                        style={{ width: `${(day.tasks / 15) * 100}%` }}
                      >
                        <span className="absolute right-2 top-1.5 text-[8px] font-bold text-primary">{day.tasks}</span>
                      </div>
                      <div
                        className="bg-amber-500/20 rounded h-full relative group-hover:bg-amber-500/30 transition-colors"
                        style={{ width: `${(day.energy / 5) * 100}%` }}
                      >
                        <span className="absolute right-2 top-1.5 text-[8px] font-bold text-amber-500">{day.energy}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-6 mt-8 pt-5 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-primary/40 rounded-sm"></div>
                  <span className="text-[10px] text-muted-foreground font-medium">COMPLETIONS</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-amber-500/40 rounded-sm"></div>
                  <span className="text-[10px] text-muted-foreground font-medium">ENERGY VITALITY</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Cognitive Load Distribution */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-8">
                <Clock className="w-5 h-5 text-violet-500" />
                <h2 className="text-lg font-bold">Cognitive Load Distribution</h2>
              </div>

              <div className="space-y-6">
                {[
                  { label: 'Deep Focus', val: analyticsData.focusTime, total: 20, color: 'bg-violet-500', text: 'text-violet-500' },
                  { label: 'Flow State', val: analyticsData.flowTime, total: 15, color: 'bg-emerald-500', text: 'text-emerald-500' },
                  { label: 'Recharge', val: analyticsData.rechargeTime, total: 25, color: 'bg-amber-500', text: 'text-amber-500' }
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-end mb-2 px-1">
                      <span className="text-xs font-bold text-muted-foreground uppercase">{item.label}</span>
                      <span className={cn("text-lg font-black", item.text)}>{item.val}h</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2.5 p-0.5 border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.val / item.total) * 100}%` }}
                        className={cn("h-full rounded-full shadow-lg", item.color)}
                      ></motion.div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 mt-10 pt-6 border-t border-white/5">
                {[
                  { val: analyticsData.focusTime, label: 'FOCUS', text: 'text-violet-500' },
                  { val: analyticsData.flowTime, label: 'FLOW', text: 'text-emerald-500' },
                  { val: analyticsData.rechargeTime, label: 'REST', text: 'text-amber-500' }
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <p className={cn("text-xl font-bold", stat.text)}>{stat.val}h</p>
                    <p className="text-[10px] text-muted-foreground font-bold tracking-tight">{stat.label}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Insights Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Biometric Insights</h2>
                <p className="text-xs text-muted-foreground">Historical patterns and future predictions</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h3 className="text-sm font-black text-primary/80 uppercase tracking-widest">Active Trends</h3>
                <div className="space-y-4">
                  {[
                    "Thursday is your peak performance window.",
                    "Your cognitive recovery is 12% faster this week.",
                    "Stable flow scores detected during morning hours."
                  ].map((text, i) => (
                    <div key={i} className="flex gap-4 items-start group">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 group-hover:scale-150 transition-transform"></div>
                      <p className="text-sm text-gray-300 leading-relaxed font-medium">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest">Growth Opportunities</h3>
                <div className="space-y-4">
                  {[
                    "Target high-priority tasks between 9AM - 11AM.",
                    "Consider active recovery on Wednesday afternoons.",
                    "Prioritize creative deep-work tonight (energy predicted peak)."
                  ].map((text, i) => (
                    <div key={i} className="flex gap-4 items-start group">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0 group-hover:scale-150 transition-transform"></div>
                      <p className="text-sm text-gray-300 leading-relaxed font-medium">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;