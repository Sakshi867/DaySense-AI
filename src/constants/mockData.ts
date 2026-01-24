export interface Task {
  id: string;
  title: string;
  description: string;
  energyCost: number; // 1-5
  category: 'deep-work' | 'communication' | 'admin' | 'creative' | 'wellness';
  estimatedMinutes: number;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  currentEnergy: number; // 1-5
  northStar: string;
  dailyCheckInCompleted: boolean;
  streakDays: number;
  totalTasksCompleted: number;
}

export const mockUser: UserProfile = {
  id: '1',
  name: 'Alex Chen',
  email: 'alex@daysense.ai',
  currentEnergy: 3,
  northStar: 'Launch the MVP by Friday',
  dailyCheckInCompleted: false,
  streakDays: 12,
  totalTasksCompleted: 47,
};

export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Deep Coding Session',
    description: 'Work on the authentication module for the new feature',
    energyCost: 5,
    category: 'deep-work',
    estimatedMinutes: 120,
    completed: false,
    priority: 'high',
  },
  {
    id: '2',
    title: 'Email Cleanup',
    description: 'Process inbox and respond to pending messages',
    energyCost: 2,
    category: 'communication',
    estimatedMinutes: 30,
    completed: false,
    priority: 'medium',
  },
  {
    id: '3',
    title: 'Team Standup',
    description: 'Daily sync with the engineering team',
    energyCost: 2,
    category: 'communication',
    estimatedMinutes: 15,
    completed: true,
    priority: 'high',
  },
  {
    id: '4',
    title: 'Design Review',
    description: 'Review mockups for the dashboard redesign',
    energyCost: 3,
    category: 'creative',
    estimatedMinutes: 45,
    completed: false,
    priority: 'medium',
  },
  {
    id: '5',
    title: 'Update Documentation',
    description: 'Document the new API endpoints',
    energyCost: 3,
    category: 'admin',
    estimatedMinutes: 60,
    completed: false,
    priority: 'low',
  },
  {
    id: '6',
    title: 'Meditation Break',
    description: '10-minute mindfulness session',
    energyCost: 1,
    category: 'wellness',
    estimatedMinutes: 10,
    completed: false,
    priority: 'medium',
  },
  {
    id: '7',
    title: 'Client Presentation Prep',
    description: 'Prepare slides for tomorrow\'s pitch',
    energyCost: 4,
    category: 'creative',
    estimatedMinutes: 90,
    completed: false,
    priority: 'high',
  },
  {
    id: '8',
    title: 'Code Review',
    description: 'Review PRs from team members',
    energyCost: 3,
    category: 'deep-work',
    estimatedMinutes: 45,
    completed: false,
    priority: 'medium',
  },
];

export const categoryIcons: Record<Task['category'], string> = {
  'deep-work': 'Brain',
  'communication': 'MessageCircle',
  'admin': 'FileText',
  'creative': 'Palette',
  'wellness': 'Heart',
};

export const categoryColors: Record<Task['category'], string> = {
  'deep-work': 'bg-violet-100 text-violet-700',
  'communication': 'bg-blue-100 text-blue-700',
  'admin': 'bg-slate-100 text-slate-700',
  'creative': 'bg-pink-100 text-pink-700',
  'wellness': 'bg-green-100 text-green-700',
};

export type EnergyState = 'recharge' | 'flow' | 'focus';

export const getEnergyState = (level: number): EnergyState => {
  if (level <= 2) return 'recharge';
  if (level === 3) return 'flow';
  return 'focus';
};

export const energyStateLabels: Record<EnergyState, string> = {
  recharge: 'Recharge Mode',
  flow: 'Flow State',
  focus: 'Deep Focus',
};

export const energyStateDescriptions: Record<EnergyState, string> = {
  recharge: 'Take it easy. Focus on low-energy tasks and self-care.',
  flow: 'Balanced energy. Perfect for varied tasks and collaboration.',
  focus: 'Peak performance. Tackle your most demanding work.',
};

export const aiInsights: Record<EnergyState, string[]> = {
  recharge: [
    "Energy is low. Skip the 'Deep Coding Session' and focus on 'Email Cleanup' for a micro-win.",
    "Consider starting with 'Meditation Break' to restore some cognitive energy.",
    "Your body is asking for rest. Low-energy admin tasks are your friends today.",
  ],
  flow: [
    "You're in a balanced state. 'Design Review' aligns well with your current energy.",
    "Great time for collaborative work. The 'Team Standup' won't drain you.",
    "Consider alternating between creative and administrative tasks.",
  ],
  focus: [
    "Peak energy detected! Now's the time for 'Deep Coding Session'.",
    "Your cognitive battery is full. Tackle 'Client Presentation Prep' while you're sharp.",
    "Channel this focus into your most challenging deliverable.",
  ],
};
