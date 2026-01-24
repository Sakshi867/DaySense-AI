import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Filter, Search, Clock, Target, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import MeshBackground from '@/components/layout/MeshBackground';
import TaskCard from '@/components/TaskCard';
import GlassCard from '@/components/GlassCard';
import { useEnergy } from '@/contexts/EnergyContext';
import { useAuth } from '@/contexts/AuthContext';
import { tasksService } from '@/services/firebaseService';
import { UserTask as Task } from '@/services/firebaseService';
import { cn } from '@/lib/utils';

const TasksPage: React.FC = () => {
  const { energyLevel, energyState } = useEnergy();
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Task Creation State
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isCreating, setIsCreating] = useState(false); // Loading state for create button
  const [newTask, setNewTask] = useState({
    title: '',
    description: null as string | null,
    energy_cost: 3,
    estimated_minutes: 30,
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: 'admin' as string | null
  });
  
  // Handle new task creation
  const handleCreateTask = async () => {
    if (!user || !newTask.title.trim() || isCreating) return;
    
    setIsCreating(true);
    
    try {
      const taskData = {
        ...newTask,
        completed: false
      };
      
      const createdTask = await tasksService.createTask(user.id, taskData);
      
      setTasks([...tasks, createdTask]);
      setNewTask({
        title: '',
        description: null as string | null,
        energy_cost: 3,
        estimated_minutes: 30,
        priority: 'medium' as 'low' | 'medium' | 'high',
        category: 'admin' as string | null
      });
      setIsCreatingTask(false);
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsCreating(false);
    }
  };
  
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        if (user) {
          const fetchedTasks = await tasksService.getUserTasks(user.id);
          setTasks(fetchedTasks);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const toggleTask = async (id: string) => {
    try {
      if (user) {
        const updatedTask = await tasksService.updateTask(id, { completed: !tasks.find(t => t.id === id)?.completed });
        setTasks(tasks.map(t => 
          t.id === id ? { ...t, completed: !t.completed } : t
        ));
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'all' || 
                         (filter === 'pending' && !task.completed) || 
                         (filter === 'completed' && task.completed);
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (task.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const optimalTasks = pendingTasks.filter(t => t.energy_cost <= energyLevel);

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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Task Management
                </h1>
                <p className="text-muted-foreground">
                  Organize and prioritize your tasks based on energy levels
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    className="pl-10 py-5 rounded-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button className="py-5 rounded-xl" onClick={() => setIsCreatingTask(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </Button>
              </div>
            </div>
          </motion.header>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <GlassCard className="p-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Optimal Tasks</span>
              </div>
              <p className="text-2xl font-bold">{optimalTasks.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Match your energy level
              </p>
            </GlassCard>
            
            <GlassCard className="p-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-teal-500" />
                <span className="text-sm font-medium">Pending</span>
              </div>
              <p className="text-2xl font-bold">{pendingTasks.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ready to tackle
              </p>
            </GlassCard>
            
            <GlassCard className="p-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium">Completed</span>
              </div>
              <p className="text-2xl font-bold">{completedTasks.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Great progress!
              </p>
            </GlassCard>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filter:</span>
            </div>
            <div className="flex gap-2">
              {(['all', 'pending', 'completed'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  className="capitalize rounded-full px-4"
                  onClick={() => setFilter(f)}
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Tasks List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {filter === 'all' ? 'All Tasks' : 
                 filter === 'pending' ? 'Pending Tasks' : 'Completed Tasks'}
              </h2>
              <span className="text-sm font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
                {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>
            
            <div className="grid gap-4">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task, index) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onToggle={toggleTask}
                    index={index}
                  />
                ))
              ) : (
                <GlassCard className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Target className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No tasks found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm 
                      ? 'Try adjusting your search term' 
                      : 'Create a new task to get started'}
                  </p>
                  <Button variant="outline" className="rounded-xl" onClick={() => setIsCreatingTask(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Task
                  </Button>
                </GlassCard>
              )}
            </div>
          </motion.div>
        </div>
      </main>
      
      {/* Task Creation Dialog */}
      <Dialog open={isCreatingTask} onOpenChange={setIsCreatingTask}>
        <DialogContent className="max-w-md rounded-2xl glass-card border-white/20 bg-black/40 backdrop-blur-xl text-white">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="task-title">Task Title *</Label>
              <Input
                id="task-title"
                placeholder="What needs to be done?"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                className="mt-1 bg-white/5 border-white/10"
              />
            </div>
            
            <div>
              <Label htmlFor="task-desc">Description</Label>
              <Input
                id="task-desc"
                placeholder="Add details..."
                value={newTask.description || ''}
                onChange={(e) => setNewTask({...newTask, description: e.target.value || null})}
                className="mt-1 bg-white/5 border-white/10"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task-energy">Energy Cost</Label>
                <Select
                  value={String(newTask.energy_cost)}
                  onValueChange={(value) => setNewTask({...newTask, energy_cost: parseInt(value)})}
                >
                  <SelectTrigger id="task-energy" className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card bg-black/80 border-white/20">
                    {[1, 2, 3, 4, 5].map(level => (
                      <SelectItem key={level} value={String(level)}>
                        Level {level} {level === 1 ? '(Low)' : level === 5 ? '(High)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="task-priority">Priority</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value: 'low' | 'medium' | 'high') => setNewTask({...newTask, priority: value})}
                >
                  <SelectTrigger id="task-priority" className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card bg-black/80 border-white/20">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="task-category">Category</Label>
              <Select
                value={newTask.category}
                onValueChange={(value) => setNewTask({...newTask, category: value})}
              >
                <SelectTrigger id="task-category" className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card bg-black/80 border-white/20">
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="learning">Learning</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="task-duration">Estimated Duration (minutes)</Label>
              <Input
                id="task-duration"
                type="number"
                min="1"
                value={newTask.estimated_minutes}
                onChange={(e) => setNewTask({...newTask, estimated_minutes: parseInt(e.target.value) || 30})}
                className="mt-1 bg-white/5 border-white/10"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              className="border-white/20" 
              onClick={() => setIsCreatingTask(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-violet-600 hover:bg-violet-500" 
              onClick={handleCreateTask}
              disabled={!newTask.title.trim() || isCreating}
            >
              {isCreating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksPage;