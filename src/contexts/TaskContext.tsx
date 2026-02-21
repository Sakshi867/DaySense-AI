import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { tasksService } from '@/services/firebaseService';
import { NotificationService } from '@/services/NotificationService';

export interface UserTask {
  id: string;
  user_id?: string;
  title: string;
  description: string | null;
  energy_cost: number;
  estimated_minutes: number;
  priority: 'low' | 'medium' | 'high';
  category: string | null;
  completed: boolean;
  status?: 'pending' | 'in_progress' | 'completed';
  started_at?: Date | any | null;
  total_seconds_spent?: number;
  created_at: Date | any;
  updated_at: Date | any;
  due_at?: Date | any | null;
}

interface TaskContextType {
  tasks: UserTask[];
  loading: boolean;
  error: string | null;
  addTask: (task: Omit<UserTask, 'id' | 'created_at' | 'updated_at' | 'status' | 'total_seconds_spent'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<UserTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  startTask: (id: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
  getPendingTasks: () => UserTask[];
  getCompletedTasks: () => UserTask[];
  getOptimalTasks: (energyLevel: number) => UserTask[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks from Firebase
  const fetchTasks = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const userTasks = await tasksService.getUserTasks(user.id);
      setTasks(userTasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Add new task with Optimistic UI
  const addTask = useCallback(async (taskData: Omit<UserTask, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) return;

    // 1. Create Optimistic Task
    const tempId = `temp-${Date.now()}`;
    const optimisticTask: UserTask = {
      ...taskData,
      id: tempId,
      user_id: user.id,
      created_at: new Date(),
      updated_at: new Date(),
      completed: false,
      status: 'pending',
      total_seconds_spent: 0
    } as UserTask;

    // 2. Update State Immediately
    setTasks(prev => [...prev, optimisticTask]);

    try {
      // 3. API Call
      const newTask = await tasksService.createTask(user.id, taskData);

      // 4. Replace Temp with Real
      setTasks(prev => prev.map(task =>
        task.id === tempId ? { ...newTask, created_at: newTask.created_at || new Date() } as UserTask : task
      ));
    } catch (err) {
      console.error('Error adding task:', err);
      setError('Failed to add task');

      // 5. Rollback on Failure
      setTasks(prev => prev.filter(task => task.id !== tempId));
      throw err;
    }
  }, [user?.id]);

  // Update existing task with Optimistic UI
  const updateTask = useCallback(async (id: string, updates: Partial<UserTask>) => {
    // 1. Snapshot previous state
    const previousTasks = [...tasks];

    // 2. Optimistic Update
    setTasks(prev => prev.map(task => task.id === id ? { ...task, ...updates } : task));

    try {
      // 3. API Call
      await tasksService.updateTask(id, updates);
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task');

      // 4. Rollback
      setTasks(previousTasks);
      throw err;
    }
  }, [tasks]);

  // Delete task with Optimistic UI
  const deleteTask = useCallback(async (id: string) => {
    // 1. Snapshot previous state
    const previousTasks = [...tasks];

    // 2. Optimistic Update
    setTasks(prev => prev.filter(task => task.id !== id));

    try {
      // 3. API Call
      await tasksService.deleteTask(id);
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task');

      // 4. Rollback
      setTasks(previousTasks);
      throw err;
    }
  }, [tasks]);

  // Toggle task completion
  const toggleTask = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const isCompleting = !task.completed;
    const updates: Partial<UserTask> = {
      completed: isCompleting,
      status: isCompleting ? 'completed' : 'pending',
      updated_at: new Date()
    };

    // If completing an in-progress task, calculate extra time spent
    if (isCompleting && task.status === 'in_progress' && task.started_at) {
      const extraSeconds = Math.floor((new Date().getTime() - new Date(task.started_at).getTime()) / 1000);
      updates.total_seconds_spent = (task.total_seconds_spent || 0) + extraSeconds;
      updates.started_at = null;
    }

    try {
      await updateTask(id, updates);
    } catch (err) {
      console.error('Error toggling task:', err);
      throw err;
    }
  }, [tasks, updateTask]);

  // Start a task
  const startTask = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task || task.completed) return;

    try {
      await updateTask(id, {
        status: 'in_progress',
        started_at: new Date(),
        updated_at: new Date()
      });
    } catch (err) {
      console.error('Error starting task:', err);
      throw err;
    }
  }, [tasks, updateTask]);

  // Refresh tasks
  const refreshTasks = useCallback(async () => {
    await fetchTasks();
  }, [fetchTasks]);

  // Helper functions
  const getPendingTasks = useCallback(() => {
    return tasks.filter(task => !task.completed);
  }, [tasks]);

  const getCompletedTasks = useCallback(() => {
    return tasks.filter(task => task.completed);
  }, [tasks]);

  const getOptimalTasks = useCallback((energyLevel: number) => {
    return tasks.filter(task => !task.completed && task.energy_cost <= energyLevel);
  }, [tasks]);

  // Fetch tasks when user changes
  useEffect(() => {
    if (user?.id) {
      fetchTasks();
    } else {
      setTasks([]);
    }
  }, [user?.id, fetchTasks]);

  // Sync notifications on task changes
  useEffect(() => {
    if (tasks.length > 0) {
      NotificationService.scheduleTaskReminders(tasks);
      NotificationService.scheduleBatchSummary(tasks);
    }
  }, [tasks]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        error,
        addTask,
        updateTask,
        deleteTask,
        toggleTask,
        startTask,
        refreshTasks,
        getPendingTasks,
        getCompletedTasks,
        getOptimalTasks
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};