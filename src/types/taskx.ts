export type Priority = 'low' | 'medium' | 'high';

export type Recurrence = 'none' | 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'custom';

export type ThemeMode = 'light' | 'dark' | 'system';

export type AccentColorId = 'cobalt' | 'obsidian' | 'emerald' | 'amber' | 'crimson' | 'violet';

export type DensityMode = 'comfortable' | 'compact';

export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'hi' | 'ja';

export type SwipeAction = 'complete' | 'snooze' | 'priority' | 'delete' | 'archive';

export type TabId = 'today' | 'upcoming' | 'calendar' | 'folders' | 'profile' | 'settings';

export type WidgetId = 'progressRing' | 'upcomingReminders' | 'streakCard' | 'quickCapture';

export type AppIconId = 'obsidian' | 'cobalt' | 'emerald' | 'sunset' | 'grid' | 'mono';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskItem {
  id: string;
  ownerId: string;
  title: string;
  notes: string;
  completed: boolean;
  completedAt: string;
  lastCompletedDate: string;
  dueDate: string; // YYYY-MM-DD or ""
  reminderTime: string; // HH:mm or ""
  recurrence: Recurrence;
  customDays: number[]; // 0=Sun..6=Sat
  priority: Priority;
  folderId: string;
  tags: string[]; // array of Tag IDs
  subtasks: Subtask[];
  calendarEventId: string;
  archived: boolean;
}

export interface FolderItem {
  id: string;
  ownerId: string;
  name: string;
  color: string;
  icon: string;
}

export interface TagItem {
  id: string;
  ownerId: string;
  name: string;
  color: string;
}

export interface ActivityLogItem {
  date: string; // YYYY-MM-DD
  ownerId: string;
  completedCount: number;
  highPriorityCount: number;
  xpEarned: number;
}

export interface TemplateTaskSpec {
  title: string;
  notes: string;
  priority: Priority;
  reminderTime: string;
  recurrence: Recurrence;
  folderId: string;
  tags: string[];
}

export interface TaskTemplate {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  tasks: TemplateTaskSpec[];
}

export interface UserSettings {
  themeMode: ThemeMode;
  accentColor: AccentColorId;
  density: DensityMode;
  language: LanguageCode;
  notificationsEnabled: boolean;
  highPriorityPush: boolean;
  soundEnabled: boolean;
  dailyDigestTime: string;
  swipeLeft: SwipeAction;
  swipeRight: SwipeAction;
  patternLockEnabled: boolean;
  patternHash: string;
  tabBarItems: TabId[];
  tabBarShowLabels: boolean;
  widgets: Record<WidgetId, boolean>;
  appIcon: AppIconId;
  aiEnabled: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
  totalCompleted: number;
  highPriorityCompleted: number;
  earlyBirdCompleted: number;
  lastCompletedDate: string;
  unlockedBadges: string[];
  settings: UserSettings;
}

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  category: 'streak' | 'volume' | 'mastery';
  requirementLabel: string;
  check: (profile: UserProfile) => boolean;
}
