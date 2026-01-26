import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MessageCircle, Lightbulb, Brain, Clock, Target, Zap, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/components/layout/DashboardLayout';
import GlassCard from '@/components/GlassCard';
import AIInsightCard from '@/components/AIInsightCard';
import { useEnergy } from '@/contexts/EnergyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/contexts/TaskContext';
import { groqService } from '@/services/groqService';
import FlowScoreDisplay from '@/components/FlowScoreDisplay';
import { cn } from '@/lib/utils';

const AICoachPage: React.FC = () => {
  const { energyLevel, energyState, northStar } = useEnergy();
  const { user } = useAuth();
  const { tasks } = useTasks();

  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      text: "Hi there! I'm your AI Coach. How can I help you optimize your day?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [recommendedTasksWithExplanations, setRecommendedTasksWithExplanations] = useState<any[]>([]);

  // State for break request functionality
  const [breakRequested, setBreakRequested] = useState(false);
  const [breakRequestMessage, setBreakRequestMessage] = useState('');

  // Function to handle break request
  const handleBreakRequest = async () => {
    try {
      // Add a message to the chat indicating the break request
      const userMessage = {
        id: chatMessages.length + 1,
        text: "I need a break. Suggest a good break activity based on my current energy level and cognitive state.",
        sender: 'user',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, userMessage]);

      // Generate AI response for break suggestion
      const breakPrompt = `
        I need a break. My current energy level is ${energyLevel}/5 and I'm in ${energyState} mode.
        My North Star goal is: ${northStar || 'Not set'}.
        I have ${tasks.length} tasks for today.
        
        Please suggest an appropriate break activity that would help restore my energy and mental focus.
        Consider my current energy level (${energyLevel}/5) and cognitive state (${energyState}) when making your recommendation.
        Keep your response brief but specific and actionable.
      `;

      const aiInsight = await groqService.generateInsights(
        tasks,
        energyLevel,
        northStar,
        breakPrompt
      );

      const aiResponse = {
        id: chatMessages.length + 2,
        text: aiInsight.insight,
        sender: 'ai',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiResponse]);

      setBreakRequested(true);
      setBreakRequestMessage("Break requested. AI coach has provided suggestions in the chat.");

      // Reset the break request status after a while
      setTimeout(() => {
        setBreakRequested(false);
        setBreakRequestMessage('');
      }, 5000);
    } catch (error) {
      console.error('Error requesting break:', error);

      const errorMessage = {
        id: chatMessages.length + 1,
        text: "Sorry, I couldn't process your break request right now. Please try again later.",
        sender: 'ai',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (user && tasks.length > 0) {
        try {
          // Generate task recommendations with explanations
          const now = new Date();
          const hour = now.getHours();

          let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'late_night' = 'morning';
          if (hour >= 5 && hour < 12) timeOfDay = 'morning';
          else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
          else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
          else timeOfDay = 'late_night';

          const signals = {
            timeOfDay,
            taskSwitchingFreq: Math.floor(Math.random() * 15),
            idleTime: Math.floor(Math.random() * 20),
            taskCompletionSpeed: Math.random() > 0.5 ? 'faster_than_usual' : Math.random() > 0.5 ? 'slower_than_usual' : 'usual',
            lateNightUsage: hour >= 22 || hour < 6,
            recentActivity: []
          };

          const recommendations = await groqService.generateTaskRecommendations(tasks, energyLevel, timeOfDay, signals);
          setRecommendedTasksWithExplanations(recommendations);
        } catch (error) {
          console.error('Error fetching recommendations:', error);
        }
      }
    };

    fetchRecommendations();
  }, [user, energyLevel, tasks.length]);

  const handleQuickAction = async (actionType: string) => {
    try {
      let prompt = "";

      switch (actionType) {
        case "north_star":
          prompt = `
            How can I align my tasks with my North Star goal: ${northStar || 'None set'}?
            I have ${tasks.length} tasks total.
            My current energy level is ${energyLevel}/5 and I'm in ${energyState} mode.
            Provide specific, actionable suggestions for how each pending task can move me toward my North Star goal.
          `;
          break;
        case "boost_energy":
          prompt = `
            My current energy level is ${energyLevel}/5 and I'm in ${energyState} mode.
            What are 3 practical, science-backed ways to boost my focus and energy right now?
            Include specific activities that match my current energy level (${energyLevel}/5).
          `;
          break;
        case "schedule_tasks":
          prompt = `
            Based on my energy level (${energyLevel}/5) and current mode (${energyState}), 
            What's the optimal order and timing to complete my tasks for maximum productivity?
            Consider energy fluctuations throughout the day and task complexity.
          `;
          break;
        case "cognitive_review":
          prompt = `
            Analyze my cognitive patterns based on my current energy level: ${energyLevel}/5 in ${energyState} mode.
            Provide insights about my productivity patterns and specific recommendations for improvement.
          `;
          break;
        default:
          prompt = "Provide general productivity advice based on my current state.";
      }

      // Add the prompt to chat as user message
      const userMessage = {
        id: chatMessages.length + 1,
        text: prompt.trim(),
        sender: 'user',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, userMessage]);

      // Generate AI response
      const aiInsight = await groqService.generateInsights(tasks, energyLevel, northStar, prompt.trim());

      const aiResponse = {
        id: chatMessages.length + 2,
        text: aiInsight.insight,
        sender: 'ai',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error(`Error handling quick action ${actionType}:`, error);

      // Add error message to chat
      const errorMessage = {
        id: chatMessages.length + 1,
        text: `Sorry, I couldn't process that request right now. Please try again later.`,
        sender: 'ai',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSendMessage = () => {
    if (inputText.trim() === '') return;

    const newMessage = {
      id: chatMessages.length + 1,
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newMessage]);
    const currentInput = inputText;
    setInputText('');

    // Generate AI response using AI service
    setTimeout(async () => {
      try {
        const aiInsight = await groqService.generateInsights(tasks, energyLevel, northStar, currentInput);

        const aiResponse = {
          id: Date.now(),
          text: aiInsight.insight,
          sender: 'ai',
          timestamp: new Date()
        };

        setChatMessages(prev => [...prev, aiResponse]);
      } catch (error) {
        console.error('Error generating AI response:', error);

        const fallbackResponse = {
          id: Date.now(),
          text: "I'm having trouble connecting to the AI service right now. Could you try asking again?",
          sender: 'ai',
          timestamp: new Date()
        };

        setChatMessages(prev => [...prev, fallbackResponse]);
      }
    }, 1000);
  };

  const quickActions = [
    {
      icon: Target,
      title: "Align with North Star",
      description: "Match tasks with your primary goal",
      onClick: () => handleQuickAction("north_star")
    },
    {
      icon: Zap,
      title: "Boost Energy",
      description: "Science-backed focus boosters",
      onClick: () => handleQuickAction("boost_energy")
    },
    {
      icon: Clock,
      title: "Schedule Tasks",
      description: "Optimize your task timing",
      onClick: () => handleQuickAction("schedule_tasks")
    },
    {
      icon: Brain,
      title: "Cognitive Review",
      description: "Analyze your mental patterns",
      onClick: () => handleQuickAction("cognitive_review")
    }
  ];

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
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                AI Coach
              </h1>
              <p className="text-muted-foreground">
                Your personal productivity advisor powered by AI
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium capitalize">
                {energyState} Mode
              </span>
            </div>
          </div>
        </motion.header>

        {/* Quick Actions Grid */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard
                  className="p-5 cursor-pointer hover:scale-[1.02] transition-transform h-full"
                  onClick={action.onClick}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                      <action.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-sm md:text-base">{action.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{action.description}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Interface */}
          <motion.div
            className="lg:col-span-2 order-2 lg:order-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassCard className="h-[550px] md:h-[650px] flex flex-col p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between bg-white/5">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  AI Coaching Session
                </h2>
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
                {chatMessages.map((message) => (
                  <motion.div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${message.sender === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-muted/80 backdrop-blur-md text-foreground rounded-bl-none border border-white/5'
                        }`}
                    >
                      <p className="text-sm md:text-base leading-relaxed">{message.text}</p>
                      <p className={`text-[10px] mt-1.5 opacity-50 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="p-4 border-t border-border/50 bg-white/5">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Textarea
                    placeholder="Ask your coach anything..."
                    className="flex-1 min-h-[50px] max-h-[150px] resize-none py-3 rounded-xl bg-white/5 border-white/10"
                    rows={2}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    className="h-auto sm:h-auto py-3 px-8 rounded-xl bg-primary hover:bg-primary/90"
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* AI Sidebar Widgets */}
          <motion.div
            className="order-1 lg:order-2 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                Live Coach Insights
              </h2>
              <AIInsightCard />
            </div>

            <FlowScoreDisplay size="sm" />

            <GlassCard className="p-6 border border-white/10">
              <h3 className="font-semibold mb-5 flex items-center gap-2 text-primary">
                <Brain className="w-5 h-5" />
                Cognitive Snapshot
              </h3>

              <div className="space-y-3">
                {[
                  { label: 'Energy Level', value: `${energyLevel}/5`, color: 'bg-amber-400' },
                  { label: 'State', value: energyState, color: 'bg-indigo-400' },
                  { label: 'Focus Priority', value: northStar || 'Balanced', color: 'bg-teal-400' },
                  { label: 'Tasks Total', value: tasks.length, color: 'bg-violet-400' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${item.color}`}></span>
                      <span className="text-xs md:text-sm text-muted-foreground">{item.label}</span>
                    </div>
                    <span className="font-bold text-xs md:text-sm capitalize">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-border/50">
                <Button
                  className={cn(
                    "w-full rounded-2xl py-6 text-sm font-bold shadow-lg transition-all active:scale-95",
                    breakRequested ? "bg-emerald-600 hover:bg-emerald-500" : "bg-white/10 hover:bg-white/20 text-white"
                  )}
                  onClick={handleBreakRequest}
                  disabled={breakRequested}
                >
                  {breakRequested ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-white/50 border-t-transparent animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Coffee className="w-4 h-4" />
                      Suggest a Break
                    </div>
                  )}
                </Button>
                {breakRequestMessage && (
                  <p className="text-[10px] text-emerald-400 text-center mt-3 animate-pulse">{breakRequestMessage}</p>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Recommended Actions */}
        <div className="mt-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-grow bg-gradient-to-r from-transparent to-border/50"></div>
            <h2 className="text-xl font-bold flex items-center gap-2.5 whitespace-nowrap">
              <Sparkles className="w-5 h-5 text-primary" />
              Tailored Roadmap
            </h2>
            <div className="h-px flex-grow bg-gradient-to-l from-transparent to-border/50"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedTasksWithExplanations.length > 0 ? (
              recommendedTasksWithExplanations.map((task, index) => (
                <motion.div
                  key={task.id || index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <GlassCard className="p-6 h-full flex flex-col border border-white/10 hover:border-primary/30 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2 rounded-xl bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors">
                        <Target className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                          {task.confidence ? `${Math.round(task.confidence * 100)}% Match` : '92% Match'}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-bold text-lg mb-2 leading-tight">{task.title}</h3>
                    <p className="text-sm text-muted-foreground mb-6 flex-grow leading-relaxed italic">
                      "{task.explanation}"
                    </p>

                    <div className="flex items-center justify-between pt-5 border-t border-border/30">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <Clock className="w-4 h-4" />
                        <span>{task.estimated_minutes || '25'} min</span>
                      </div>
                      <Button size="sm" className="rounded-xl px-5 text-xs font-bold bg-primary hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20">
                        Execute
                      </Button>
                    </div>
                  </GlassCard>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full">
                <GlassCard className="p-12 text-center bg-white/5 border-dashed border-white/10">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">Analyzing Behavioral Signals</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed">
                    Your coach is learning your patterns. Check back in a few moments for personalized task sequencing.
                  </p>
                </GlassCard>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AICoachPage;