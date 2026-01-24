import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Clock, Target, Calendar, Activity, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import MeshBackground from '@/components/layout/MeshBackground';
import GlassCard from '@/components/GlassCard';
import { useEnergy } from '@/contexts/EnergyContext';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsService, tasksService } from '@/services/firebaseService';
import { cn } from '@/lib/utils';

const AnalyticsPage: React.FC = () => {
  const { energyLevel, energyState } = useEnergy();
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
        
        // Fetch user tasks
        const tasks: any[] = user ? await tasksService.getUserTasks(user.id) : [];
        
        // Fetch user analytics
        const userAnalytics = user ? await analyticsService.getUserAnalytics(user.id) : [];
        
        // Calculate analytics based on tasks and user profile
        const completedTasks = tasks.filter(t => t.completed).length;
        
        // Calculate average energy from user profile and analytics
        let avgEnergy = user?.energy_level || 3;
        if (userAnalytics.length > 0) {
          const totalEnergy = userAnalytics.reduce((sum, record) => sum + (record.energy_level || 0), 0);
          avgEnergy = userAnalytics.length > 0 ? totalEnergy / userAnalytics.length : avgEnergy;
        }
        
        // Calculate productivity score
        const productivityScore = Math.min(100, Math.round((completedTasks / Math.max(tasks.length, 1)) * 100));
        
        // Calculate time distribution from analytics
        let totalFocusTime = 0;
        let totalFlowTime = 0;
        let totalRechargeTime = 0;
        
        if (userAnalytics.length > 0) {
          totalFocusTime = userAnalytics.reduce((sum, record) => sum + (record.focus_time || 0), 0);
          totalFlowTime = userAnalytics.reduce((sum, record) => sum + (record.flow_time || 0), 0);
          totalRechargeTime = userAnalytics.reduce((sum, record) => sum + (record.recharge_time || 0), 0);
        }
        
        const userData = {
          completedTasks,
          avgEnergy,
          productivityScore,
          streak: user?.streak_days || 0,
          focusTime: totalFocusTime,
          flowTime: totalFlowTime,
          rechargeTime: totalRechargeTime
        };
        
        setAnalyticsData(userData);
        
        // Generate weekly data based on analytics
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weekData = days.map((day, index) => {
          // Try to find matching analytics data for this day
          const today = new Date();
          today.setDate(today.getDate() - (6 - index)); // Go back from today to get the week
          const dateStr = today.toISOString().split('T')[0];
          
          // Find analytics for this date
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
    
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange]);

  return (
    <div className="min-h-screen relative">
      <MeshBackground />
      
      {/* Sidebar */}
      <DashboardSidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      {/* Main Content */}
      <main className={cn(
        'min-h-screen transition-all duration-300',
        sidebarCollapsed ? 'pl-20' : 'pl-64'
      )}>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <motion.header
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Analytics Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Track your productivity patterns and energy flows
                </p>
              </div>
              
              <div className="flex gap-2">
                {(['week', 'month', 'quarter'] as const).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? 'default' : 'outline'}
                    size="sm"
                    className="capitalize rounded-full px-4"
                    onClick={() => setTimeRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
          </motion.header>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{analyticsData.completedTasks}</p>
              <p className="text-sm text-muted-foreground">Tasks Completed</p>
            </GlassCard>
            
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Activity className="w-5 h-5 text-amber-500" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{analyticsData.avgEnergy.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Avg Energy Level</p>
            </GlassCard>
            
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{analyticsData.productivityScore}%</p>
              <p className="text-sm text-muted-foreground">Productivity Score</p>
            </GlassCard>
            
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-teal-500/10">
                  <Zap className="w-5 h-5 text-teal-500" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{analyticsData.streak}</p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </GlassCard>
          </div>
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Energy vs Tasks Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Activity className="w-5 h-5 text-foreground" />
                  <h2 className="text-xl font-bold">Energy vs Tasks</h2>
                </div>
                
                <div className="space-y-4">
                  {weeklyData.map((day, index) => (
                    <div key={day.day} className="flex items-center gap-4">
                      <div className="w-10 text-sm text-muted-foreground">{day.day}</div>
                      <div className="flex-1 flex gap-2">
                        <div 
                          className="bg-primary/20 rounded-l h-8 flex items-center justify-end pr-2 text-xs text-primary font-medium"
                          style={{ width: `${(day.tasks / 15) * 100}%` }}
                        >
                          {day.tasks}
                        </div>
                        <div 
                          className="bg-amber-500/20 rounded-r h-8 flex items-center justify-end pr-2 text-xs text-amber-500 font-medium"
                          style={{ width: `${(day.energy / 5) * 100}%` }}
                        >
                          {day.energy}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center gap-4 mt-6 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary/20 rounded"></div>
                    <span className="text-xs text-muted-foreground">Tasks Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500/20 rounded"></div>
                    <span className="text-xs text-muted-foreground">Energy Level</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
            
            {/* Time Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Clock className="w-5 h-5 text-foreground" />
                  <h2 className="text-xl font-bold">Time Distribution</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Focus Time</span>
                      <span className="text-sm font-medium">{analyticsData.focusTime}h</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div 
                        className="bg-purple-500 h-2.5 rounded-full" 
                        style={{ width: `${(analyticsData.focusTime / 20) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Flow Time</span>
                      <span className="text-sm font-medium">{analyticsData.flowTime}h</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div 
                        className="bg-teal-500 h-2.5 rounded-full" 
                        style={{ width: `${(analyticsData.flowTime / 20) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Recharge Time</span>
                      <span className="text-sm font-medium">{analyticsData.rechargeTime}h</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div 
                        className="bg-amber-500 h-2.5 rounded-full" 
                        style={{ width: `${(analyticsData.rechargeTime / 20) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-8 pt-4 border-t border-border/50">
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-500">{analyticsData.focusTime}h</div>
                    <div className="text-xs text-muted-foreground">Focus</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-teal-500">{analyticsData.flowTime}h</div>
                    <div className="text-xs text-muted-foreground">Flow</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-amber-500">{analyticsData.rechargeTime}h</div>
                    <div className="text-xs text-muted-foreground">Recharge</div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
          
          {/* Performance Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-foreground" />
                <h2 className="text-xl font-bold">Performance Insights</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Weekly Trends</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>You're most productive on Thursdays</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span>Your energy peaks mid-week</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Task completion rate: 87%</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Suggestions</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5"></div>
                      <span>Schedule high-priority tasks on Thursday-Friday</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-teal-500 rounded-full mt-1.5"></div>
                      <span>Take longer breaks on Wednesdays</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5"></div>
                      <span>Plan creative work during your peak flow hours</span>
                    </li>
                  </ul>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default AnalyticsPage;