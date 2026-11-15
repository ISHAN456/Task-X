import {
  AccentColorId,
  AppIconId,
  BadgeDefinition,
  FolderItem,
  TagItem,
  TaskItem,
  TaskTemplate,
  UserProfile,
  UserSettings,
} from '../types/taskx';

export const ACCENT_THEMES: Record<
  AccentColorId,
  {
    name: string;
    hex: string;
    hover: string;
    softLight: string;
    softDark: string;
    glassLight: string;
    glassDark: string;
    glassHover: string;
    glow: string;
    fg: string;
  }
> = {
  cobalt: {
    name: 'Cobalt',
    hex: '#2563eb',
    hover: '#1d4ed8',
    softLight: 'rgba(37, 99, 235, 0.1)',
    softDark: 'rgba(59, 130, 246, 0.18)',
    glassLight: 'rgba(37, 99, 235, 0.78)',
    glassDark: 'rgba(37, 99, 235, 0.72)',
    glassHover: 'rgba(29, 78, 216, 0.9)',
    glow: 'rgba(37, 99, 235, 0.42)',
    fg: '#ffffff',
  },
  obsidian: {
    name: 'Obsidian',
    hex: '#0f172a',
    hover: '#1e293b',
    softLight: 'rgba(15, 23, 42, 0.08)',
    softDark: 'rgba(226, 232, 240, 0.14)',
    glassLight: 'rgba(15, 23, 42, 0.78)',
    glassDark: 'rgba(39, 39, 42, 0.78)',
    glassHover: 'rgba(30, 41, 59, 0.92)',
    glow: 'rgba(15, 23, 42, 0.38)',
    fg: '#ffffff',
  },
  emerald: {
    name: 'Emerald',
    hex: '#059669',
    hover: '#047857',
    softLight: 'rgba(5, 150, 105, 0.1)',
    softDark: 'rgba(16, 185, 129, 0.18)',
    glassLight: 'rgba(5, 150, 105, 0.78)',
    glassDark: 'rgba(5, 150, 105, 0.72)',
    glassHover: 'rgba(4, 120, 87, 0.9)',
    glow: 'rgba(5, 150, 105, 0.4)',
    fg: '#ffffff',
  },
  amber: {
    name: 'Amber',
    hex: '#d97706',
    hover: '#b45309',
    softLight: 'rgba(217, 119, 6, 0.1)',
    softDark: 'rgba(245, 158, 11, 0.18)',
    glassLight: 'rgba(217, 119, 6, 0.8)',
    glassDark: 'rgba(217, 119, 6, 0.74)',
    glassHover: 'rgba(180, 83, 9, 0.92)',
    glow: 'rgba(217, 119, 6, 0.42)',
    fg: '#ffffff',
  },
  crimson: {
    name: 'Crimson',
    hex: '#dc2626',
    hover: '#b91c1c',
    softLight: 'rgba(220, 38, 38, 0.1)',
    softDark: 'rgba(248, 113, 113, 0.18)',
    glassLight: 'rgba(220, 38, 38, 0.78)',
    glassDark: 'rgba(220, 38, 38, 0.72)',
    glassHover: 'rgba(185, 28, 28, 0.9)',
    glow: 'rgba(220, 38, 38, 0.42)',
    fg: '#ffffff',
  },
  violet: {
    name: 'Iris',
    hex: '#6d28d9',
    hover: '#5b21b6',
    softLight: 'rgba(109, 40, 217, 0.1)',
    softDark: 'rgba(139, 92, 246, 0.18)',
    glassLight: 'rgba(109, 40, 217, 0.78)',
    glassDark: 'rgba(109, 40, 217, 0.72)',
    glassHover: 'rgba(91, 33, 182, 0.9)',
    glow: 'rgba(109, 40, 217, 0.42)',
    fg: '#ffffff',
  },
};

export const APP_ICON_STYLES: Record<
  AppIconId,
  { name: string; bg: string; fg: string; accent: string }
> = {
  obsidian: { name: 'Chronos Ring', bg: '#0b0f19', fg: '#f8fafc', accent: '#38bdf8' },
  cobalt: { name: 'Prism Stack', bg: '#1d4ed8', fg: '#ffffff', accent: '#93c5fd' },
  emerald: { name: 'Bauhaus Ribbon', bg: '#065f46', fg: '#ffffff', accent: '#6ee7b7' },
  sunset: { name: 'Solar Horizon', bg: '#c2410c', fg: '#fff7ed', accent: '#fbbf24' },
  grid: { name: 'Swiss Grid', bg: '#1e293b', fg: '#f8fafc', accent: '#fbbf24' },
  mono: { name: 'Blueprint Folio', bg: '#f8fafc', fg: '#0f172a', accent: '#dc2626' },
};

export const DEFAULT_SETTINGS: UserSettings = {
  themeMode: 'light',
  accentColor: 'cobalt',
  density: 'comfortable',
  language: 'en',
  notificationsEnabled: false,
  highPriorityPush: true,
  soundEnabled: true,
  dailyDigestTime: '08:30',
  swipeLeft: 'delete',
  swipeRight: 'complete',
  patternLockEnabled: false,
  patternHash: '',
  tabBarItems: ['today', 'upcoming', 'calendar', 'folders', 'profile'],
  tabBarShowLabels: true,
  widgets: {
    progressRing: true,
    upcomingReminders: true,
    streakCard: true,
    quickCapture: true,
  },
  appIcon: 'obsidian',
  aiEnabled: true,
};

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first_step',
    title: 'First Step',
    description: 'Complete your very first task in Task X.',
    category: 'volume',
    requirementLabel: '1 task completed',
    check: (p) => p.totalCompleted >= 1,
  },
  {
    id: 'momentum_7',
    title: 'Weekly Momentum',
    description: 'Complete tasks 7 days in a row without breaking rhythm.',
    category: 'streak',
    requirementLabel: '7-day streak',
    check: (p) => p.longestStreak >= 7,
  },
  {
    id: 'iron_will_30',
    title: 'Iron Will',
    description: 'Sustain an unbroken 30-day daily habit streak.',
    category: 'streak',
    requirementLabel: '30-day streak',
    check: (p) => p.longestStreak >= 30,
  },
  {
    id: 'priority_crusher',
    title: 'Priority Crusher',
    description: 'Finish 10 high-priority deadlines on schedule.',
    category: 'mastery',
    requirementLabel: '10 high-priority tasks',
    check: (p) => p.highPriorityCompleted >= 10,
  },
  {
    id: 'architect_50',
    title: 'Flow Architect',
    description: 'Reach 50 total completed tasks across folders.',
    category: 'volume',
    requirementLabel: '50 tasks completed',
    check: (p) => p.totalCompleted >= 50,
  },
  {
    id: 'centurion_100',
    title: 'Centurion',
    description: 'Achieve 100 total completed tasks.',
    category: 'volume',
    requirementLabel: '100 tasks completed',
    check: (p) => p.totalCompleted >= 100,
  },
];

export function getLevelFromXp(xp: number): {
  level: number;
  title: string;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
} {
  // Progressive XP curve: level n requires 100 * n * (n - 1) / 2 total XP? Let's make it snappy: 120 XP per level scaling slightly
  let level = 1;
  let threshold = 0;
  let step = 100;
  while (xp >= threshold + step && level < 100) {
    threshold += step;
    level += 1;
    step = Math.round(100 + (level - 1) * 35);
  }
  const currentLevelXp = xp - threshold;
  const nextLevelXp = step;
  const progressPercent = Math.min(100, Math.round((currentLevelXp / nextLevelXp) * 100));

  const titles = [
    'Starter',
    'Planner',
    'Tracker',
    'Organizer',
    'Pacesetter',
    'Strategist',
    'Specialist',
    'Navigator',
    'Architect',
    'Grandmaster',
  ];
  const title = titles[Math.min(titles.length - 1, Math.floor((level - 1) / 2))];
  return { level, title, currentLevelXp, nextLevelXp, progressPercent };
}

export function getTodayDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysToDateStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export function isTaskDoneOnDate(task: TaskItem, dateStr: string): boolean {
  return task.recurrence !== 'none' ? task.lastCompletedDate === dateStr : task.completed;
}

export function getTodayTasks(tasks: TaskItem[], today: string): TaskItem[] {
  const dayOfWeek = new Date().getDay();
  return tasks.filter((task) => {
    if (task.archived) return false;
    if (task.recurrence === 'daily') return true;
    if (task.recurrence === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
    if (task.recurrence === 'weekends') return dayOfWeek === 0 || dayOfWeek === 6;
    if (task.recurrence === 'custom') return task.customDays.includes(dayOfWeek);
    if (!task.dueDate) return true;
    return task.dueDate <= today;
  });
}

export function getStarterFolders(ownerId: string): FolderItem[] {
  return [
    { id: 'folder-work', ownerId, name: 'Work', color: '#2563eb', icon: 'briefcase' },
    { id: 'folder-personal', ownerId, name: 'Personal', color: '#059669', icon: 'home' },
    { id: 'folder-health', ownerId, name: 'Health', color: '#d97706', icon: 'heart' },
    { id: 'folder-learning', ownerId, name: 'Learning', color: '#7c3aed', icon: 'book' },
  ];
}

export function getStarterTags(ownerId: string): TagItem[] {
  return [
    { id: 'tag-deepwork', ownerId, name: 'Deep Work', color: '#2563eb' },
    { id: 'tag-quickwin', ownerId, name: 'Quick Win', color: '#059669' },
    { id: 'tag-urgent', ownerId, name: 'Urgent', color: '#dc2626' },
    { id: 'tag-habit', ownerId, name: 'Daily Habit', color: '#d97706' },
  ];
}

export function getStarterTasks(ownerId: string): TaskItem[] {
  const today = getTodayDateStr();
  const tomorrow = addDaysToDateStr(today, 1);
  return [
    {
      id: 'task-starter-1',
      ownerId,
      title: 'Review top 3 priorities for today',
      notes: 'Clear distractions and lock in your main deliverable before checking messages.',
      completed: false,
      completedAt: '',
      lastCompletedDate: '',
      dueDate: today,
      reminderTime: '08:30',
      recurrence: 'daily',
      customDays: [],
      priority: 'high',
      folderId: 'folder-work',
      tags: ['tag-deepwork', 'tag-habit'],
      subtasks: [
        { id: 'sub-1', title: 'Check calendar deadlines', completed: false },
        { id: 'sub-2', title: 'Block 90m focus window', completed: false },
      ],
      calendarEventId: '',
      archived: false,
    },
    {
      id: 'task-starter-2',
      ownerId,
      title: 'Evening walk & hydration check',
      notes: '20-minute outdoor reset after wrapping up work.',
      completed: false,
      completedAt: '',
      lastCompletedDate: '',
      dueDate: today,
      reminderTime: '18:00',
      recurrence: 'daily',
      customDays: [],
      priority: 'medium',
      folderId: 'folder-health',
      tags: ['tag-habit'],
      subtasks: [],
      calendarEventId: '',
      archived: false,
    },
    {
      id: 'task-starter-3',
      ownerId,
      title: 'Prepare project sprint brief',
      notes: 'Draft milestones and align deadlines with calendar.',
      completed: false,
      completedAt: '',
      lastCompletedDate: '',
      dueDate: tomorrow,
      reminderTime: '10:00',
      recurrence: 'none',
      customDays: [],
      priority: 'high',
      folderId: 'folder-work',
      tags: ['tag-urgent', 'tag-deepwork'],
      subtasks: [],
      calendarEventId: '',
      archived: false,
    },
  ];
}

export function getStarterTemplates(ownerId: string): TaskTemplate[] {
  return [
    {
      id: 'tpl-morning-focus',
      ownerId,
      name: 'Morning Deep Work Routine',
      description: 'Daily high-focus starter block with hydration and planning.',
      tasks: [
        {
          title: 'Plan top 3 daily outcomes',
          notes: 'Keep list concise and realistic.',
          priority: 'high',
          reminderTime: '08:00',
          recurrence: 'daily',
          folderId: 'folder-work',
          tags: ['tag-deepwork'],
        },
        {
          title: '90-minute uninterrupted sprint',
          notes: 'Silence non-urgent notifications.',
          priority: 'high',
          reminderTime: '09:00',
          recurrence: 'weekdays',
          folderId: 'folder-work',
          tags: ['tag-deepwork'],
        },
      ],
    },
    {
      id: 'tpl-weekly-reset',
      ownerId,
      name: 'Weekly Review & Reset',
      description: 'Clean inbox, review deadlines, and prep next week.',
      tasks: [
        {
          title: 'Audit upcoming calendar deadlines',
          notes: 'Sync high-priority items to calendar.',
          priority: 'medium',
          reminderTime: '16:00',
          recurrence: 'weekly',
          folderId: 'folder-work',
          tags: ['tag-quickwin'],
        },
        {
          title: 'Clear completed & stale tasks',
          notes: 'Archive finished work and refine tags.',
          priority: 'low',
          reminderTime: '16:30',
          recurrence: 'weekly',
          folderId: 'folder-personal',
          tags: ['tag-quickwin'],
        },
      ],
    },
  ];
}

export function createGuestProfile(): UserProfile {
  return {
    uid: 'local-user',
    displayName: 'Task X User',
    email: '',
    photoURL: '',
    xp: 40,
    level: 1,
    streak: 1,
    longestStreak: 1,
    totalCompleted: 0,
    highPriorityCompleted: 0,
    earlyBirdCompleted: 0,
    lastCompletedDate: '',
    unlockedBadges: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}
