import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  FolderKanban,
  ListTodo,
  Lock,
  Moon,
  Plus,
  Repeat,
  Search,
  Settings,
  Sparkles,
  Sun,
  User as UserIcon,
  X,
} from 'lucide-react';
import { motion, MotionConfig } from 'motion/react';
import { AppIconHeadSync } from './components/BrandIcon';
import { CalendarView } from './components/CalendarView';
import { FoldersTagsView } from './components/FoldersTagsView';
import { PatternLockModal } from './components/PatternLockModal';
import { ProfileAnalyticsView } from './components/ProfileAnalyticsView';
import { SettingsView } from './components/SettingsView';
import { TaskComposerModal } from './components/TaskComposerModal';
import { TaskRow } from './components/TaskRow';
import {
  ACCENT_THEMES,
  BADGE_DEFINITIONS,
  getLevelFromXp,
  getTodayDateStr,
  getTodayTasks,
  isTaskDoneOnDate,
} from './constants/taskxData';
import { useTaskXStore } from './hooks/useTaskXStore';
import { useT } from './i18n/translations';
import {
  Priority,
  Recurrence,
  Subtask,
  SwipeAction,
  TabId,
  TaskItem,
} from './types/taskx';

type TaskFilter = 'all' | 'high' | 'recurring' | 'completed';

interface AiDayPlan {
  focusSummary: string;
  orderedTaskIds: string[];
  tips: string[];
}

function playSoftChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.23);
  } catch {
    // ignore audio autoplay restrictions
  }
}

export default function App() {
  const store = useTaskXStore();
  const { profile, tasks, folders, tags, activityLogs, templates } = store;
  const settings = profile.settings;
  const t = useT(settings.language);

  const [activeTab, setActiveTab] = useState<TabId>('today');
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickInput, setQuickInput] = useState('');
  const [quickAdding, setQuickAdding] = useState(false);

  const [composerOpen, setComposerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [composerDefaultDate, setComposerDefaultDate] = useState<string | undefined>(undefined);
  const [composerDefaultFolder, setComposerDefaultFolder] = useState<string | undefined>(undefined);

  const [locked, setLocked] = useState<boolean>(() =>
    Boolean(profile.settings.patternLockEnabled && profile.settings.patternHash)
  );
  const [patternSetupOpen, setPatternSetupOpen] = useState(false);

  const [toast, setToast] = useState<{ id: number; title: string; detail?: string } | null>(null);
  const [aiPlan, setAiPlan] = useState<AiDayPlan | null>(null);
  const [aiOptimizing, setAiOptimizing] = useState(false);

  const firedRemindersRef = useRef<Set<string>>(new Set());

  const showToast = useCallback((title: string, detail?: string) => {
    const id = Date.now();
    setToast({ id, title, detail });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 4500);
  }, []);

  // Apply Dark Mode & Theme Accent CSS variables dynamically
  useEffect(() => {
    const root = document.documentElement;
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark =
      settings.themeMode === 'dark' || (settings.themeMode === 'system' && prefersDark);

    root.classList.toggle('dark', isDark);

    const accent = ACCENT_THEMES[settings.accentColor] || ACCENT_THEMES.cobalt;
    root.style.setProperty('--tx-accent', accent.hex);
    root.style.setProperty('--tx-accent-hover', accent.hover);
    root.style.setProperty('--tx-accent-soft', isDark ? accent.softDark : accent.softLight);
    root.style.setProperty('--tx-accent-glass', isDark ? accent.glassDark : accent.glassLight);
    root.style.setProperty('--tx-accent-glass-hover', accent.glassHover);
    root.style.setProperty('--tx-accent-glow', accent.glow);
    root.style.setProperty('--tx-accent-fg', accent.fg);
  }, [settings.themeMode, settings.accentColor]);

  // Keyboard shortcut 'n' to open New Task quickly
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'n' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        setEditingTask(null);
        setComposerDefaultDate(undefined);
        setComposerDefaultFolder(undefined);
        setComposerOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const triggerPushNotification = useCallback(
    async (title: string, body: string, isHighPriority = false) => {
      if (settings.soundEnabled) playSoftChime();
      showToast(title, body);

      if (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted' &&
        (settings.notificationsEnabled || (isHighPriority && settings.highPriorityPush))
      ) {
        try {
          new Notification(title, { body });
        } catch {
          // ignore browser notification errors in restricted contexts
        }
      }
    },
    [settings.notificationsEnabled, settings.highPriorityPush, settings.soundEnabled, showToast]
  );

  // Recurring & daily reminder background scheduler
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const today = getTodayDateStr();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const dayOfWeek = now.getDay();

      for (const task of tasks) {
        if (task.archived || !task.reminderTime) continue;
        const doneToday =
          task.recurrence !== 'none' ? task.lastCompletedDate === today : task.completed;
        if (doneToday) continue;

        let dueToday = task.dueDate === today || !task.dueDate;
        if (task.recurrence === 'daily') dueToday = true;
        if (task.recurrence === 'weekdays') dueToday = dayOfWeek >= 1 && dayOfWeek <= 5;
        if (task.recurrence === 'weekends') dueToday = dayOfWeek === 0 || dayOfWeek === 6;
        if (task.recurrence === 'custom') dueToday = task.customDays.includes(dayOfWeek);

        if (dueToday && task.reminderTime === hhmm) {
          const key = `${task.id}-${today}-${hhmm}`;
          if (!firedRemindersRef.current.has(key)) {
            firedRemindersRef.current.add(key);
            triggerPushNotification(
              task.priority === 'high' ? `High-Priority Reminder: ${task.title}` : `Task X Reminder: ${task.title}`,
              task.notes || `Scheduled for ${hhmm}`,
              task.priority === 'high'
            );
          }
        }
      }
    };

    checkReminders();
    const timer = setInterval(checkReminders, 15000);
    return () => clearInterval(timer);
  }, [tasks, triggerPushNotification]);

  const today = getTodayDateStr();
  const levelInfo = getLevelFromXp(profile.xp);

  const isTaskDoneToday = useCallback(
    (task: TaskItem) => isTaskDoneOnDate(task, today),
    [today]
  );

  const todayTasks = useMemo(() => getTodayTasks(tasks, today), [tasks, today]);

  const upcomingTasks = useMemo(() => {
    return tasks
      .filter((t) => !t.archived && (t.dueDate > today || t.recurrence !== 'none'))
      .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
  }, [tasks, today]);

  const displayedTasks = useMemo(() => {
    const base = activeTab === 'upcoming' ? upcomingTasks : todayTasks;
    const filtered = base.filter((task) => {
      const done = isTaskDoneToday(task);
      if (taskFilter === 'high' && (task.priority !== 'high' || done)) return false;
      if (taskFilter === 'recurring' && task.recurrence === 'none') return false;
      if (taskFilter === 'completed' && !done) return false;
      if (taskFilter === 'all' && done) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!task.title.toLowerCase().includes(q) && !task.notes.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });

    // Apply AI optimized ordering if active
    if (aiPlan && aiPlan.orderedTaskIds.length > 0 && activeTab === 'today') {
      const orderMap = new Map(aiPlan.orderedTaskIds.map((id, i) => [id, i]));
      return [...filtered].sort((a, b) => {
        const ia = orderMap.has(a.id) ? orderMap.get(a.id)! : 999;
        const ib = orderMap.has(b.id) ? orderMap.get(b.id)! : 999;
        return ia - ib;
      });
    }

    // Default sort: high priority first, then reminderTime, then title
    const prioWeight: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
    return [...filtered].sort((a, b) => {
      const pw = prioWeight[a.priority] - prioWeight[b.priority];
      if (pw !== 0) return pw;
      return (a.reminderTime || '99:99').localeCompare(b.reminderTime || '99:99');
    });
  }, [activeTab, upcomingTasks, todayTasks, taskFilter, searchQuery, aiPlan, isTaskDoneToday]);

  const completedTodayCount = useMemo(
    () => todayTasks.filter((t) => isTaskDoneToday(t)).length,
    [todayTasks, isTaskDoneToday]
  );

  const upcomingRemindersToday = useMemo(() => {
    return todayTasks
      .filter((t) => t.reminderTime && !isTaskDoneToday(t))
      .sort((a, b) => a.reminderTime.localeCompare(b.reminderTime))
      .slice(0, 3);
  }, [todayTasks, isTaskDoneToday]);

  const handleToggleComplete = async (task: TaskItem) => {
    const res = await store.toggleTaskCompletion(task);
    if (settings.soundEnabled && res.xpDelta > 0) playSoftChime();
    if (res.newlyUnlockedBadges.length > 0) {
      const badge = BADGE_DEFINITIONS.find((b) => b.id === res.newlyUnlockedBadges[0]);
      showToast(
        `Badge Unlocked: ${badge?.title || 'Achievement'}`,
        `+${res.xpDelta} XP earned`
      );
    } else if (res.xpDelta > 0) {
      showToast(`Task completed (+${res.xpDelta} XP)`, task.title);
    }
  };

  const handleToggleSubtask = async (task: TaskItem, subtaskId: string) => {
    const updatedSubs: Subtask[] = task.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    await store.updateTask(task.id, { subtasks: updatedSubs });
  };

  const handleSwipeAction = async (task: TaskItem, action: SwipeAction) => {
    if (action === 'complete') {
      await handleToggleComplete(task);
    } else if (action === 'snooze') {
      await store.snoozeTaskOneDay(task);
      showToast('Snoozed +1 day', task.title);
    } else if (action === 'priority') {
      await store.cycleTaskPriority(task);
      showToast('Priority updated', task.title);
    } else if (action === 'archive') {
      await store.updateTask(task.id, { archived: true });
      showToast('Task archived', task.title);
    } else if (action === 'delete') {
      await store.deleteTask(task.id);
      showToast('Task deleted', task.title);
    }
  };

  const handleQuickAdd = async (e: React.FormEvent, useAi = false) => {
    e.preventDefault();
    const raw = quickInput.trim();
    if (!raw || quickAdding) return;
    setQuickAdding(true);
    try {
      if (useAi && settings.aiEnabled) {
        const res = await fetch('/api/ai/parse-task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: raw,
            todayDate: today,
            folders: folders.map((f) => f.name),
            tags: tags.map((tg) => tg.name),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'AI parse error');
        const matchedFolder = folders.find(
          (f) => f.name.toLowerCase() === String(data.suggestedFolder || '').toLowerCase()
        );
        const matchedTags = Array.isArray(data.suggestedTags)
          ? tags
              .filter((tg) =>
                data.suggestedTags.some(
                  (s: string) => s.toLowerCase() === tg.name.toLowerCase()
                )
              )
              .map((tg) => tg.id)
          : [];
        await store.addTask({
          title: data.title || raw,
          notes: data.notes || '',
          dueDate: data.dueDate ?? today,
          reminderTime: data.reminderTime ?? '',
          recurrence: (data.recurrence as Recurrence) || 'none',
          customDays: Array.isArray(data.customDays) ? data.customDays : [],
          priority: (data.priority as Priority) || 'medium',
          folderId: matchedFolder?.id || folders[0]?.id || '',
          tags: matchedTags,
        });
        showToast('Smart task scheduled', data.title || raw);
      } else {
        await store.addTask({
          title: raw,
          dueDate: today,
          priority: 'medium',
          folderId: folders[0]?.id || '',
        });
        showToast('Task added to Today', raw);
      }
      setQuickInput('');
    } catch (err: any) {
      showToast('Quick add failed', err?.message || 'Try again');
    } finally {
      setQuickAdding(false);
    }
  };

  const handleOptimizeDay = async () => {
    const activeToday = todayTasks.filter((tk) => !isTaskDoneToday(tk));
    if (activeToday.length === 0) {
      showToast('All caught up', 'Add active tasks to optimize your schedule.');
      return;
    }
    setAiOptimizing(true);
    try {
      const res = await fetch('/api/ai/optimize-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: activeToday, currentDate: today }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Optimization failed');
      setAiPlan(data);
      showToast('Schedule optimized', 'Tasks sorted by focus priority.');
    } catch (err: any) {
      showToast('AI Optimizer error', err?.message || 'Unable to optimize');
    } finally {
      setAiOptimizing(false);
    }
  };

  const tabMeta: Record<TabId, { label: string; icon: React.ReactNode }> = {
    today: { label: t.today, icon: <ListTodo className="h-4 w-4" /> },
    upcoming: { label: t.upcoming, icon: <Clock className="h-4 w-4" /> },
    calendar: { label: t.calendar, icon: <CalendarIcon className="h-4 w-4" /> },
    folders: { label: t.folders, icon: <FolderKanban className="h-4 w-4" /> },
    profile: { label: t.profile, icon: <UserIcon className="h-4 w-4" /> },
    settings: { label: t.settings, icon: <Settings className="h-4 w-4" /> },
  };

  const visibleNavTabs = settings.tabBarItems.length > 0 ? settings.tabBarItems : ['today', 'calendar', 'folders', 'profile'] as TabId[];

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#000000] text-slate-900 dark:text-slate-100 pb-36 xl:pb-28">
      <AppIconHeadSync
        iconId={settings.appIcon}
        themeColor={(ACCENT_THEMES[settings.accentColor] || ACCENT_THEMES.cobalt).hex}
      />
      {/* Top Bar: Brand — Primary Utility Actions */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 dark:border-zinc-800/80 bg-white/75 dark:bg-black/75 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className="flex items-center text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            <span>Task X</span>
          </button>

          {/* Zone 2: Active View Context */}
          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>{tabMeta[activeTab].label}</span>
          </div>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                store.updateSettings({
                  themeMode: settings.themeMode === 'dark' ? 'light' : 'dark',
                })
              }
              aria-label="Toggle dark mode"
              className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
            >
              {settings.themeMode === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {settings.patternLockEnabled && (
              <button
                type="button"
                onClick={() => setLocked(true)}
                aria-label="Lock Task X"
                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <Lock className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-zinc-900 flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <span className="font-mono tabular-nums text-[var(--tx-accent)]">
                Lv.{levelInfo.level}
              </span>
              <span className="hidden sm:inline truncate max-w-[110px]">
                {profile.displayName.split(' ')[0]}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Shell */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Left Folders Rail */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6 sticky top-20">
            {/* Folders Quick Jump */}
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] p-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  Folders
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('folders')}
                  className="text-xs font-medium text-[var(--tx-accent)] hover:underline"
                >
                  Manage
                </button>
              </div>
              <div className="space-y-1">
                {folders.map((folder) => {
                  const count = tasks.filter(
                    (tk) => !tk.archived && tk.folderId === folder.id && !isTaskDoneToday(tk)
                  ).length;
                  return (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => setActiveTab('folders')}
                      className="w-full min-h-[34px] px-2 rounded-lg flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-900"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: folder.color }}
                        />
                        <span className="truncate">{folder.name}</span>
                      </span>
                      <span className="font-mono tabular-nums text-slate-400">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Primary Content Viewport */}
          <div className="lg:col-span-9 min-w-0 space-y-6">
            {(activeTab === 'today' || activeTab === 'upcoming') && (
              <>
                {/* View Heading & AI Optimize Action */}
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {activeTab === 'today' ? t.today : t.upcoming}
                    </h1>
                    <p className="mt-1 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {today} · {completedTodayCount}/{todayTasks.length} completed today
                    </p>
                  </div>

                  {settings.aiEnabled && activeTab === 'today' && (
                    <button
                      type="button"
                      onClick={handleOptimizeDay}
                      disabled={aiOptimizing}
                      className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#09090B] hover:bg-slate-50 dark:hover:bg-zinc-900 text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Sparkles className="h-4 w-4 text-[var(--tx-accent)]" />
                      {aiOptimizing ? 'Optimizing...' : t.optimizeDay}
                    </button>
                  )}
                </div>

                {/* Upcoming Reminders Widget on Today */}
                {activeTab === 'today' && settings.widgets.upcomingReminders && (
                  <div className="rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] p-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                      <span>Next Reminders</span>
                      <Bell className="h-4 w-4 text-[var(--tx-accent)]" />
                    </div>
                    {upcomingRemindersToday.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-400">
                        No pending timed alerts today.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-1">
                        {upcomingRemindersToday.map((r) => (
                          <li
                            key={r.id}
                            className="flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="truncate text-slate-700 dark:text-slate-200">
                              {r.title}
                            </span>
                            <span className="font-mono tabular-nums text-slate-500 shrink-0">
                              {r.reminderTime}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* AI Day Focus Plan Banner */}
                {aiPlan && activeTab === 'today' && (
                  <div className="rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] p-4 sm:p-5 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[var(--tx-accent)]">
                        <Sparkles className="h-4 w-4" />
                        <span>AI Focus Strategy</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAiPlan(null)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                        aria-label="Dismiss AI focus plan"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      {aiPlan.focusSummary}
                    </p>
                    {aiPlan.tips.length > 0 && (
                      <ul className="text-xs text-slate-500 dark:text-zinc-400 space-y-1 pt-1">
                        {aiPlan.tips.map((tip, idx) => (
                          <li key={idx}>· {tip}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Minimal Inline Quick Task Entry Widget */}
                {settings.widgets.quickCapture && (
                  <form
                    onSubmit={(e) => handleQuickAdd(e, false)}
                    className="rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] p-2 sm:p-2.5 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      maxLength={240}
                      value={quickInput}
                      onChange={(e) => setQuickInput(e.target.value)}
                      placeholder={t.quickPlaceholder}
                      className="flex-1 min-h-[42px] bg-transparent px-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none"
                    />
                    {settings.aiEnabled && (
                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(e, true)}
                        disabled={!quickInput.trim() || quickAdding}
                        className="min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-900 disabled:opacity-40 flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-[var(--tx-accent)]" />
                        <span className="hidden sm:inline">{t.smartParse}</span>
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={!quickInput.trim() || quickAdding}
                      className="min-h-[38px] px-4 rounded-xl bg-[var(--tx-accent)] hover:bg-[var(--tx-accent-hover)] text-[var(--tx-accent-fg)] text-xs font-semibold disabled:opacity-40 whitespace-nowrap shrink-0 transition-colors"
                    >
                      {quickAdding ? 'Adding...' : t.addTask}
                    </button>
                  </form>
                )}

                {/* Filter & Search Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#09090B] border border-slate-200/70 dark:border-zinc-800/90">
                    {(
                      [
                        { id: 'all', label: t.allTasks },
                        { id: 'high', label: t.highPriority },
                        { id: 'recurring', label: t.recurring },
                        { id: 'completed', label: t.completed },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setTaskFilter(f.id)}
                        className={`min-h-[34px] px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                          taskFilter === f.id
                            ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative min-w-[200px] flex-1 sm:flex-initial sm:w-60">
                    <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter tasks..."
                      className="w-full min-h-[38px] pl-9 pr-3 rounded-xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] text-xs text-slate-900 dark:text-slate-100 focus:border-[var(--tx-accent)] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Task List */}
                {displayedTasks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 bg-white/60 dark:bg-[#09090B]/80 p-10 text-center">
                    <CheckCircle2 className="h-8 w-8 mx-auto text-slate-300 dark:text-zinc-700" />
                    <h3 className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {t.noTasksTitle}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                      {t.noTasksDesc}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {displayedTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        folders={folders}
                        tags={tags}
                        density={settings.density}
                        swipeLeft={settings.swipeLeft}
                        swipeRight={settings.swipeRight}
                        onToggleComplete={handleToggleComplete}
                        onToggleSubtask={handleToggleSubtask}
                        onEdit={(tk) => {
                          setEditingTask(tk);
                          setComposerOpen(true);
                        }}
                        onSwipeAction={handleSwipeAction}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'calendar' && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {t.calendar}
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Manage task deadlines and daily schedules on your calendar
                  </p>
                </div>
                <CalendarView
                  tasks={tasks}
                  folders={folders}
                  tags={tags}
                  density={settings.density}
                  swipeLeft={settings.swipeLeft}
                  swipeRight={settings.swipeRight}
                  onAddTaskForDate={(dateStr) => {
                    setEditingTask(null);
                    setComposerDefaultDate(dateStr);
                    setComposerDefaultFolder(undefined);
                    setComposerOpen(true);
                  }}
                  onToggleComplete={handleToggleComplete}
                  onToggleSubtask={handleToggleSubtask}
                  onEditTask={(tk) => {
                    setEditingTask(tk);
                    setComposerOpen(true);
                  }}
                  onSwipeAction={handleSwipeAction}
                />
              </div>
            )}

            {activeTab === 'folders' && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {t.folders}
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Organize long lists with categorization folders and customizable tags
                  </p>
                </div>
                <FoldersTagsView
                  tasks={tasks}
                  folders={folders}
                  tags={tags}
                  density={settings.density}
                  swipeLeft={settings.swipeLeft}
                  swipeRight={settings.swipeRight}
                  onAddFolder={store.addFolder}
                  onDeleteFolder={store.deleteFolder}
                  onAddTag={store.addTag}
                  onDeleteTag={store.deleteTag}
                  onAddTaskInFolder={(fId) => {
                    setEditingTask(null);
                    setComposerDefaultDate(today);
                    setComposerDefaultFolder(fId || undefined);
                    setComposerOpen(true);
                  }}
                  onToggleComplete={handleToggleComplete}
                  onToggleSubtask={handleToggleSubtask}
                  onEditTask={(tk) => {
                    setEditingTask(tk);
                    setComposerOpen(true);
                  }}
                  onSwipeAction={handleSwipeAction}
                />
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {t.profile}
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Activity tracking, visual progress reports, streaks, levels, and badges
                  </p>
                </div>
                <ProfileAnalyticsView
                  profile={profile}
                  tasks={tasks}
                  folders={folders}
                  activityLogs={activityLogs}
                  onUpdateProfile={async (name, photo) => {
                    await store.updateProfileInfo(name, photo);
                    showToast('Profile updated', name);
                  }}
                  onOpenSettings={() => setActiveTab('settings')}
                />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {t.settings}
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Customize Task X theme, notifications, templates, swipe gestures, lock, and AI
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className="min-h-[38px] px-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-900"
                  >
                    Back to Profile
                  </button>
                </div>

                <SettingsView
                  settings={settings}
                  folders={folders}
                  templates={templates}
                  onUpdateSettings={store.updateSettings}
                  onOpenPatternSetup={() => setPatternSetupOpen(true)}
                  onLockNow={() => setLocked(true)}
                  onSendTestNotification={async () => {
                    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
                      await Notification.requestPermission();
                    }
                    await triggerPushNotification(
                      'Task X High-Priority Alert',
                      'Push notifications are working for your daily recurring reminders.',
                      true
                    );
                    return 'Test notification dispatched.';
                  }}
                  onApplyTemplate={async (tpl) => {
                    await store.applyTemplate(tpl);
                    showToast('Template applied', `${tpl.tasks.length} task(s) added to Today`);
                  }}
                  onCreateTemplate={store.addTemplate}
                  onDeleteTemplate={store.deleteTemplate}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button (FAB) for instant task entry - Theme-Colored Frosted Glass */}
      <button
        type="button"
        onClick={() => {
          setEditingTask(null);
          setComposerDefaultDate(undefined);
          setComposerDefaultFolder(undefined);
          setComposerOpen(true);
        }}
        aria-label="Add new task"
        className="fixed bottom-24 xl:bottom-6 right-5 xl:right-8 z-50 h-14 w-14 rounded-full bg-[var(--tx-accent-glass)] hover:bg-[var(--tx-accent-glass-hover)] backdrop-blur-2xl backdrop-saturate-200 border border-white/45 dark:border-white/30 ring-1 ring-black/10 dark:ring-white/15 text-[var(--tx-accent-fg)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.48),0_14px_34px_-6px_var(--tx-accent-glow)] flex items-center justify-center active:scale-95 transition-all"
      >
        <Plus className="h-6 w-6 stroke-[2.25]" />
      </button>

      {/* Floating Liquid Glass Navigation Dock */}
      <div className="fixed bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-24px)] pointer-events-none">
        <nav
          aria-label="Primary dock navigation"
          className="pointer-events-auto relative flex items-center gap-1 p-1.5 rounded-[24px] bg-white/35 dark:bg-zinc-950/45 backdrop-blur-2xl backdrop-saturate-200 border border-white/75 dark:border-white/15 ring-1 ring-slate-900/5 dark:ring-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_18px_42px_-10px_rgba(15,23,42,0.22)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),0_20px_50px_-8px_rgba(0,0,0,0.9)] overflow-x-auto no-scrollbar"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-3 top-0 h-1/2 rounded-t-[20px] bg-gradient-to-b from-white/40 to-transparent dark:from-white/10 dark:to-transparent"
          />
          {visibleNavTabs.map((tabId) => {
            const active = activeTab === tabId;
            return (
              <button
                key={tabId}
                type="button"
                onClick={() => setActiveTab(tabId)}
                title={tabMeta[tabId].label}
                aria-current={active ? 'page' : undefined}
                className={`relative min-h-[44px] px-3 sm:px-3.5 py-1.5 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'text-[var(--tx-accent)] dark:text-white font-semibold'
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-white/35 dark:hover:bg-white/10 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="taskx-dock-slider"
                    transition={{ type: 'spring', stiffness: 460, damping: 34, mass: 0.75 }}
                    className="absolute inset-0 rounded-2xl bg-white/75 dark:bg-white/18 backdrop-blur-md border border-white/80 dark:border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_4px_12px_rgba(15,23,42,0.08)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_4px_14px_rgba(0,0,0,0.45)]"
                  />
                )}
                <span className="relative z-10 shrink-0">{tabMeta[tabId].icon}</span>
                {settings.tabBarShowLabels && (
                  <span className="relative z-10 text-[10px] sm:text-xs tracking-tight leading-none">
                    {tabMeta[tabId].label}
                  </span>
                )}
              </button>
            );
          })}

          {!visibleNavTabs.includes('settings') && (
            <>
              <div className="relative z-10 h-6 w-px bg-slate-900/15 dark:bg-white/15 mx-0.5 shrink-0" aria-hidden="true" />
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                title={t.settings}
                aria-label={t.settings}
                aria-current={activeTab === 'settings' ? 'page' : undefined}
                className={`relative min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'settings'
                    ? 'text-[var(--tx-accent)] dark:text-white font-semibold'
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-white/35 dark:hover:bg-white/10 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {activeTab === 'settings' && (
                  <motion.span
                    layoutId="taskx-dock-slider"
                    transition={{ type: 'spring', stiffness: 460, damping: 34, mass: 0.75 }}
                    className="absolute inset-0 rounded-2xl bg-white/75 dark:bg-white/18 backdrop-blur-md border border-white/80 dark:border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_4px_12px_rgba(15,23,42,0.08)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_4px_14px_rgba(0,0,0,0.45)]"
                  />
                )}
                <span className="relative z-10 shrink-0">{tabMeta.settings.icon}</span>
                {settings.tabBarShowLabels && (
                  <span className="relative z-10 text-[10px] sm:text-xs tracking-tight leading-none hidden sm:inline">
                    {t.settings}
                  </span>
                )}
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Task Composer Modal */}
      <TaskComposerModal
        open={composerOpen}
        editingTask={editingTask}
        defaultDate={composerDefaultDate}
        defaultFolderId={composerDefaultFolder}
        folders={folders}
        tags={tags}
        aiEnabled={settings.aiEnabled}
        onClose={() => {
          setComposerOpen(false);
          setEditingTask(null);
        }}
        onCreateTag={store.addTag}
        onSave={async (payload) => {
          if (editingTask) {
            await store.updateTask(editingTask.id, payload);
            showToast('Task updated', payload.title);
          } else {
            await store.addTask(payload);
            if (payload.priority === 'high' && settings.highPriorityPush) {
              triggerPushNotification(
                `High-Priority Task Added: ${payload.title}`,
                payload.reminderTime
                  ? `Reminder set for ${payload.reminderTime}`
                  : 'Pinned to top of your focus queue',
                true
              );
            } else {
              showToast('Task created', payload.title);
            }
          }
        }}
      />

      {/* Pattern Lock Unlock & Setup Modals */}
      <PatternLockModal
        open={locked && settings.patternLockEnabled && Boolean(settings.patternHash)}
        mode="unlock"
        expectedPattern={settings.patternHash}
        onSuccess={() => setLocked(false)}
      />

      <PatternLockModal
        open={patternSetupOpen}
        mode="setup"
        onCancel={() => setPatternSetupOpen(false)}
        onSuccess={async (pattern) => {
          await store.updateSettings({
            patternLockEnabled: true,
            patternHash: pattern,
          });
          setPatternSetupOpen(false);
          showToast('Pattern Lock enabled', 'Your pattern has been saved.');
        }}
      />

      {/* Non-intrusive Toast Notification */}
      {toast && (
        <div
          role="status"
          className="fixed top-16 right-4 sm:right-6 z-40 max-w-xs w-full rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#09090B] px-4 py-3 shadow-lg flex items-start justify-between gap-3"
        >
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Repeat className="h-3.5 w-3.5 text-[var(--tx-accent)] shrink-0" />
              <span className="truncate">{toast.title}</span>
            </p>
            {toast.detail && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                {toast.detail}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
    </MotionConfig>
  );
}
