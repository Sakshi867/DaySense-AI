import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MessageCircle, Lightbulb, Brain, Clock, Target, Zap, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import MeshBackground from '@/components/layout/MeshBackground';
import GlassCard from '@/components/GlassCard';
import AIInsightCard from '@/components/AIInsightCard';
import { useEnergy } from '@/contexts/EnergyContext';
import { useAuth } from '@/contexts/AuthContext';
import { tasksService } from '@/services/firebaseService';
import { geminiService } from '@/services/geminiService';
import { passiveEnergyDetection } from '@/services/geminiService';
import FlowScoreDisplay from '@/components/FlowScoreDisplay';
import { cn } from '@/lib/utils';

const AICoachPage: React.FC = () => {
  const { energyLevel, energyState, northStar } = useEnergy();
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tasksCount, setTasksCount] = useState(0);
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
      
      // Get user tasks for context
      const userTasks = user ? await tasksService.getUserTasks(user.id) : [];
      
      // Generate AI response for break suggestion
      const breakPrompt = `
        I need a break. My current energy level is ${energyLevel}/5 and I'm in ${energyState} mode.
        My North Star goal is: ${northStar || 'Not set'}.
        I have ${tasksCount} tasks for today, with ${userTasks.filter(t => !t.completed).length} pending and ${userTasks.filter(t => t.completed).length} completed.
        
        Please suggest an appropriate break activity that would help restore my energy and mental focus.
        Consider my current energy level (${energyLevel}/5) and cognitive state (${energyState}) when making your recommendation.
        Keep your response brief but specific and actionable.
      `;
      
      const aiInsight = await geminiService.generateInsights(
        userTasks, 
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
    const fetchTasksCount = async () => {
      if (user) {
        try {
          const tasks = await tasksService.getUserTasks(user.id);
          setTasksCount(tasks.length);
          
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
          
          const recommendations = await geminiService.generateTaskRecommendations(tasks, energyLevel, timeOfDay, signals);
          setRecommendedTasksWithExplanations(recommendations);
        } catch (error) {
          console.error('Error fetching tasks count:', error);
        }
      }
    };
    
    fetchTasksCount();
  }, [user, energyLevel]);

  const handleQuickAction = async (actionType: string) => {
    try {
      // Get user tasks for context
      const userTasks = user ? await tasksService.getUserTasks(user.id) : [];
      
      let prompt = "";
      
      switch(actionType) {
        case "north_star":
          prompt = `
            How can I align my tasks with my North Star goal: ${northStar || 'None set'}?
            I have ${userTasks.length} tasks total, with ${userTasks.filter(t => t.completed).length} completed and ${userTasks.filter(t => !t.completed).length} pending.
            My current energy level is ${energyLevel}/5 and I'm in ${energyState} mode.
            Provide specific, actionable suggestions for how each pending task can move me toward my North Star goal.
          `;
          break;
        case "boost_energy":
          prompt = `
            My current energy level is ${energyLevel}/5 and I'm in ${energyState} mode.
            I have ${userTasks.filter(t => !t.completed).length} tasks remaining for today.
            What are 3 practical, science-backed ways to boost my focus and energy right now?
            Include specific activities that match my current energy level (${energyLevel}/5).
          `;
          break;
        case "schedule_tasks":
          prompt = `
            Based on my energy level (${energyLevel}/5) and current mode (${energyState}), 
            I have ${userTasks.filter(t => !t.completed).length} tasks remaining: 
            ${userTasks.filter(t => !t.completed).slice(0, 5).map(t => `- ${t.title} (energy cost: ${t.energy_cost})`).join('\n')}
            What's the optimal order and timing to complete these tasks for maximum productivity?
            Consider energy fluctuations throughout the day and task complexity.
          `;
          break;
        case "cognitive_review":
          prompt = `
            Analyze my cognitive patterns based on:
            - Current energy level: ${energyLevel}/5 in ${energyState} mode
            - Task completion: ${userTasks.filter(t => t.completed).length} of ${userTasks.length} tasks completed
            - Energy-task alignment: ${userTasks.filter(t => !t.completed && t.energy_cost <= energyLevel).length} tasks match current energy
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
      const aiInsight = await geminiService.generateInsights(userTasks, energyLevel, northStar, prompt.trim());
      
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
    
    setChatMessages([...chatMessages, newMessage]);
    setInputText('');
    
    // Generate AI response using Gemini service
    setTimeout(async () => {
      try {
        // Get user tasks for context
        const userTasks = user ? await tasksService.getUserTasks(user.id) : [];
        
        // Generate AI response based on user context and their specific question
        const aiInsight = await geminiService.generateInsights(userTasks, energyLevel, northStar, inputText);
        
        const aiResponse = {
          id: chatMessages.length + 2,
          text: aiInsight.insight,
          sender: 'ai',
          timestamp: new Date()
        };
        
        setChatMessages(prev => [...prev, aiResponse]);
      } catch (error) {
        console.error('Error generating AI response:', error);
        
        // Fallback response
        const fallbackResponse = {
          id: chatMessages.length + 2,
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
      description: "Review your primary goal for today",
      onClick: () => handleQuickAction("north_star")
    },
    {
      icon: Zap,
      title: "Boost Energy",
      description: "Get tips to increase your focus",
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
                  AI Coach
                </h1>
                <p className="text-muted-foreground">
                  Your personal productivity advisor powered by AI
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium capitalize">
                  {energyState} Mode
                </span>
              </div>
            </div>
          </motion.header>
          
          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GlassCard 
                    className="p-5 cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={action.onClick}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <action.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{action.title}</h3>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat Interface */}
            <motion.div 
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <GlassCard className="h-[500px] md:h-[600px] flex flex-col">
                <div className="p-4 md:p-5 border-b border-border/50">
                  <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Coaching Session
                  </h2>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
                  {chatMessages.map((message) => (
                    <motion.div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2.5 md:px-4 md:py-3 ${
                          message.sender === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-none text-sm md:text-base'
                            : 'bg-muted text-foreground rounded-bl-none text-sm md:text-base'
                        }`}
                      >
                        {message.text}
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <div className="p-4 border-t border-border/50">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Textarea
                      placeholder="Ask your AI coach anything..."
                      className="flex-1 resize-none py-2 text-sm"
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
                      className="h-12 w-full sm:w-auto" 
                      onClick={handleSendMessage}
                      disabled={!inputText.trim()}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
            
            {/* AI Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="mb-6">
                <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  AI Insights
                </h2>
                <AIInsightCard />
              </div>
              
              {/* Flow Score Display */}
              <div className="mb-6">
                <FlowScoreDisplay size="sm" />
              </div>
              
              {/* Current Status */}
              <GlassCard className="p-4 md:p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Your Cognitive State
                </h3>
                
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <span className="text-sm text-muted-foreground">Energy Level</span>
                    <span className="font-semibold">{energyLevel}/5</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <span className="text-sm text-muted-foreground">Mode</span>
                    <span className="font-semibold capitalize">{energyState}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <span className="text-sm text-muted-foreground">North Star</span>
                    <span className="font-semibold text-right max-w-[60%] truncate" title={northStar || "Not set"}>
                      {northStar || "Not set"}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <span className="text-sm text-muted-foreground">Tasks Today</span>
                    <span className="font-semibold">{tasksCount}</span>
                  </div>
                </div>
                
                <Button 
                  className={`w-full mt-4 rounded-xl py-4 md:py-5 text-sm ${breakRequested ? 'bg-green-600 hover:bg-green-500' : ''}`}
                  onClick={handleBreakRequest}
                  disabled={breakRequested}
                >
                  {breakRequested ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Break Requested
                    </>
                  ) : (
                    <>
                      <Coffee className="w-4 h-4 mr-2" />
                      Request Break
                    </>
                  )}
                </Button>
                {breakRequestMessage && (
                  <p className="text-xs text-green-400 text-center mt-2">{breakRequestMessage}</p>
                )}
              </GlassCard>
            </motion.div>
          </div>
          
          {/* Divider */}
          <div className="my-8 flex items-center">
            <div className="flex-grow border-t border-border/50"></div>
            <span className="mx-4 text-muted-foreground text-sm">Recommended For You</span>
            <div className="flex-grow border-t border-border/50"></div>
          </div>
          
          {/* Recommended Tasks with Explanations */}
          <motion.div
            className="mt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Recommended Tasks with Explanations
            </h2>
            
            {recommendedTasksWithExplanations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {recommendedTasksWithExplanations.map((task, index) => (
                  <GlassCard key={task.id || index} className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-foreground">{task.title}</h3>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                        Energy {task.energy_cost || 'N/A'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{task.explanation}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-border/30">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Zap className="w-3 h-3" />
                        <span>Requires {task.energy_cost || 'N/A'}/5 energy</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Confidence: {task.confidence ? `${Math.round(task.confidence * 100)}%` : 'N/A'}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <GlassCard className="p-6 text-center">
                <div className="flex flex-col items-center justify-center py-8">
                  <Lightbulb className="w-10 h-10 text-muted-foreground mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">No Recommendations Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Your AI coach is analyzing your patterns and will provide personalized task recommendations shortly.
                  </p>
                </div>
              </GlassCard>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default AICoachPage;