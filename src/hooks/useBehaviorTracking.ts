import { useState, useEffect, useRef } from 'react';

interface BehaviorMetrics {
  taskSwitchCount: number;
  idleTime: number;
  lastActionTime: number;
  taskCompletionSpeed: 'faster_than_usual' | 'slower_than_usual' | 'usual';
  activePeriods: { start: number; end: number }[];
}

const useBehaviorTracking = () => {
  const [metrics, setMetrics] = useState<BehaviorMetrics>({
    taskSwitchCount: 0,
    idleTime: 0,
    lastActionTime: Date.now(),
    taskCompletionSpeed: 'usual',
    activePeriods: [],
  });

  const lastTaskCompletionTime = useRef<number | null>(null);
  const currentActivePeriod = useRef<{ start: number } | null>(null);

  // Track user actions to measure engagement
  useEffect(() => {
    const handleUserActivity = () => {
      const now = Date.now();
      const timeSinceLastAction = now - metrics.lastActionTime;

      // If the user was idle, calculate the idle time
      if (timeSinceLastAction > 5 * 60 * 1000) { // More than 5 minutes idle
        setMetrics(prev => ({
          ...prev,
          idleTime: prev.idleTime + timeSinceLastAction,
          lastActionTime: now,
        }));
      } else {
        setMetrics(prev => ({
          ...prev,
          lastActionTime: now,
        }));
      }

      // Start a new active period if not already in one
      if (!currentActivePeriod.current) {
        currentActivePeriod.current = { start: now };
      }
    };

    // Add event listeners for user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [metrics.lastActionTime]);

  // Track when user stops being active (after 5 minutes of inactivity)
  useEffect(() => {
    const checkInactivity = () => {
      const now = Date.now();
      const timeSinceLastAction = now - metrics.lastActionTime;

      if (timeSinceLastAction > 5 * 60 * 1000 && currentActivePeriod.current) {
        // End the current active period
        setMetrics(prev => ({
          ...prev,
          activePeriods: [
            ...prev.activePeriods,
            { start: currentActivePeriod.current!.start, end: now }
          ]
        }));
        currentActivePeriod.current = null;
      }
    };

    const interval = setInterval(checkInactivity, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [metrics.lastActionTime]);

  const trackTaskSwitch = () => {
    setMetrics(prev => ({
      ...prev,
      taskSwitchCount: prev.taskSwitchCount + 1,
    }));
  };

  const trackTaskCompletion = (estimatedMinutes: number, actualMinutes: number) => {
    const now = Date.now();
    let speed: 'faster_than_usual' | 'slower_than_usual' | 'usual' = 'usual';

    if (actualMinutes < estimatedMinutes * 0.7) {
      speed = 'faster_than_usual';
    } else if (actualMinutes > estimatedMinutes * 1.3) {
      speed = 'slower_than_usual';
    }

    setMetrics(prev => ({
      ...prev,
      taskCompletionSpeed: speed,
    }));

    lastTaskCompletionTime.current = now;
  };

  const resetMetrics = () => {
    setMetrics({
      taskSwitchCount: 0,
      idleTime: 0,
      lastActionTime: Date.now(),
      taskCompletionSpeed: 'usual',
      activePeriods: [],
    });
  };

  // Calculate derived metrics
  const getDerivedMetrics = () => {
    const now = Date.now();
    const currentIdleTime = now - metrics.lastActionTime;
    const totalActiveTime = metrics.activePeriods.reduce(
      (sum, period) => sum + (period.end - period.start),
      currentActivePeriod.current ? now - currentActivePeriod.current.start : 0
    );

    return {
      ...metrics,
      currentIdleTime: currentIdleTime > 5 * 60 * 1000 ? currentIdleTime : 0,
      totalActiveTime,
      taskSwitchingFreq: metrics.taskSwitchCount / (totalActiveTime / (1000 * 60 * 60)), // Per hour
    };
  };

  return {
    metrics: getDerivedMetrics(),
    trackTaskSwitch,
    trackTaskCompletion,
    resetMetrics,
  };
};

export default useBehaviorTracking;