import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addDaysToDateStr,
  BADGE_DEFINITIONS,
  createGuestProfile,
  DEFAULT_SETTINGS,
  getLevelFromXp,
  getStarterFolders,
  getStarterTags,
  getStarterTasks,
  getStarterTemplates,
  getTodayDateStr,
} from '../constants/taskxData';
import {
  ActivityLogItem,
  FolderItem,
  Priority,
  Recurrence,
  Subtask,
  TagItem,
  TaskItem,
  TaskTemplate,
  UserProfile,
  UserSettings,
} from '../types/taskx';

const LOCAL_STORAGE_KEY = 'taskx_workspace_v1';

interface LocalWorkspace {
  profile: UserProfile;
  tasks: TaskItem[];
  folders: FolderItem[];
  tags: TagItem[];
  activityLogs: ActivityLogItem[];
  templates: TaskTemplate[];
}

function createCleanId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${rand}`.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 120);
}

function loadLocalWorkspace(): LocalWorkspace {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        profile: {
          ...createGuestProfile(),
          ...(parsed.profile || {}),
          settings: { ...DEFAULT_SETTINGS, ...(parsed.profile?.settings || {}) },
        },
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : getStarterTasks('local-user'),
        folders: Array.isArray(parsed.folders) ? parsed.folders : getStarterFolders('local-user'),
        tags: Array.isArray(parsed.tags) ? parsed.tags : getStarterTags('local-user'),
        activityLogs: Array.isArray(parsed.activityLogs) ? parsed.activityLogs : [],
        templates: Array.isArray(parsed.templates)
          ? parsed.templates
          : getStarterTemplates('local-user'),
      };
    }
  } catch {
    // ignore corrupted local storage
  }
  return {
    profile: createGuestProfile(),
    tasks: getStarterTasks('local-user'),
    folders: getStarterFolders('local-user'),
    tags: getStarterTags('local-user'),
    activityLogs: [],
    templates: getStarterTemplates('local-user'),
  };
}

function computeNextRecurrenceDate(
  currentDateStr: string,
  recurrence: Recurrence,
  customDays: number[]
): string {
  const base = currentDateStr || getTodayDateStr();
  if (recurrence === 'daily') {
    return addDaysToDateStr(base, 1);
  }
  if (recurrence === 'weekly') {
    return addDaysToDateStr(base, 7);
  }
  if (recurrence === 'weekdays') {
    let next = addDaysToDateStr(base, 1);
    for (let i = 0; i < 7; i++) {
      const [y, m, d] = next.split('-').map(Number);
      const day = new Date(y, m - 1, d).getDay();
      if (day >= 1 && day <= 5) return next;
      next = addDaysToDateStr(next, 1);
    }
    return next;
  }
  if (recurrence === 'weekends') {
    let next = addDaysToDateStr(base, 1);
    for (let i = 0; i < 7; i++) {
      const [y, m, d] = next.split('-').map(Number);
      const day = new Date(y, m - 1, d).getDay();
      if (day === 0 || day === 6) return next;
      next = addDaysToDateStr(next, 1);
    }
    return next;
  }
  if (recurrence === 'custom' && customDays.length > 0) {
    let next = addDaysToDateStr(base, 1);
    for (let i = 0; i < 8; i++) {
      const [y, m, d] = next.split('-').map(Number);
      const day = new Date(y, m - 1, d).getDay();
      if (customDays.includes(day)) return next;
      next = addDaysToDateStr(next, 1);
    }
    return next;
  }
  return base;
}

export function useTaskXStore() {
  const initialLocal = useMemo(() => loadLocalWorkspace(), []);

  const [profile, setProfile] = useState<UserProfile>(initialLocal.profile);
  const [tasks, setTasks] = useState<TaskItem[]>(initialLocal.tasks);
  const [folders, setFolders] = useState<FolderItem[]>(initialLocal.folders);
  const [tags, setTags] = useState<TagItem[]>(initialLocal.tags);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(initialLocal.activityLogs);
  const [templates, setTemplates] = useState<TaskTemplate[]>(initialLocal.templates);

  const localRef = useRef<LocalWorkspace>(initialLocal);
  localRef.current = { profile, tasks, folders, tags, activityLogs, templates };

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localRef.current));
    } catch {
      // ignore storage quota errors
    }
  }, [profile, tasks, folders, tags, activityLogs, templates]);

  const updateSettings = useCallback(
    async (partial: Partial<UserSettings>) => {
      setProfile((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...partial },
      }));
    },
    []
  );

  const updateProfileInfo = useCallback(async (displayName: string, photoURL: string) => {
    const cleanName = displayName.trim().slice(0, 120) || 'Task X User';
    const cleanPhoto = photoURL.trim().slice(0, 65000);
    setProfile((prev) => ({
      ...prev,
      displayName: cleanName,
      photoURL: cleanPhoto,
    }));
  }, []);

  const addTask = useCallback(
    async (input: {
      title: string;
      notes?: string;
      dueDate?: string;
      reminderTime?: string;
      recurrence?: Recurrence;
      customDays?: number[];
      priority?: Priority;
      folderId?: string;
      tags?: string[];
      subtasks?: Subtask[];
    }): Promise<TaskItem> => {
      const newTask: TaskItem = {
        id: createCleanId('task'),
        ownerId: 'local-user',
        title: input.title.trim().slice(0, 240) || 'Untitled task',
        notes: (input.notes || '').slice(0, 2000),
        completed: false,
        completedAt: '',
        lastCompletedDate: '',
        dueDate: input.dueDate ?? getTodayDateStr(),
        reminderTime: input.reminderTime ?? '',
        recurrence: input.recurrence ?? 'none',
        customDays: input.customDays ?? [],
        priority: input.priority ?? 'medium',
        folderId: input.folderId ?? (folders[0]?.id || 'folder-work'),
        tags: (input.tags ?? []).slice(0, 10),
        subtasks: (input.subtasks ?? []).slice(0, 20),
        calendarEventId: '',
        archived: false,
      };

      setTasks((prev) => [newTask, ...prev]);
      return newTask;
    },
    [folders]
  );

  const updateTask = useCallback(async (taskId: string, partial: Partial<TaskItem>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...partial } : t)));
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const toggleTaskCompletion = useCallback(
    async (task: TaskItem): Promise<{ newlyUnlockedBadges: string[]; xpDelta: number }> => {
      const today = getTodayDateStr();
      const now = new Date();
      const isRecurring = task.recurrence !== 'none';
      const wasCompletedToday = isRecurring ? task.lastCompletedDate === today : task.completed;
      const markingComplete = !wasCompletedToday;

      let nextDueDate = task.dueDate;
      let nextCompleted = markingComplete;
      const nextCompletedAt = markingComplete ? now.toISOString() : '';
      const nextLastCompletedDate = markingComplete ? today : '';

      if (isRecurring && markingComplete) {
        nextDueDate = computeNextRecurrenceDate(today, task.recurrence, task.customDays);
        nextCompleted = false;
      }

      const taskPatch: Partial<TaskItem> = {
        completed: nextCompleted,
        completedAt: nextCompletedAt,
        lastCompletedDate: nextLastCompletedDate,
        dueDate: nextDueDate,
      };

      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...taskPatch } : t)));

      const xpReward = task.priority === 'high' ? 40 : task.priority === 'medium' ? 25 : 15;
      const xpDelta = markingComplete ? xpReward : -xpReward;
      const isEarlyBird = markingComplete && now.getHours() < 9;

      const prevProfile = localRef.current.profile;
      const yesterday = addDaysToDateStr(today, -1);

      let nextStreak = prevProfile.streak;
      if (markingComplete) {
        if (prevProfile.lastCompletedDate === today) {
          nextStreak = Math.max(1, prevProfile.streak);
        } else if (prevProfile.lastCompletedDate === yesterday) {
          nextStreak = prevProfile.streak + 1;
        } else {
          nextStreak = 1;
        }
      }

      const nextXp = Math.max(0, prevProfile.xp + xpDelta);
      const { level: nextLevel } = getLevelFromXp(nextXp);
      const nextTotalCompleted = Math.max(
        0,
        prevProfile.totalCompleted + (markingComplete ? 1 : -1)
      );
      const nextHighPriorityCompleted = Math.max(
        0,
        prevProfile.highPriorityCompleted +
          (task.priority === 'high' ? (markingComplete ? 1 : -1) : 0)
      );
      const nextEarlyBird = Math.max(
        0,
        prevProfile.earlyBirdCompleted + (isEarlyBird ? 1 : 0)
      );
      const nextLongestStreak = Math.max(prevProfile.longestStreak, nextStreak);

      const candidateProfile: UserProfile = {
        ...prevProfile,
        xp: nextXp,
        level: nextLevel,
        streak: nextStreak,
        longestStreak: nextLongestStreak,
        totalCompleted: nextTotalCompleted,
        highPriorityCompleted: nextHighPriorityCompleted,
        earlyBirdCompleted: nextEarlyBird,
        lastCompletedDate: markingComplete ? today : prevProfile.lastCompletedDate,
      };

      const newlyUnlockedBadges: string[] = [];
      const mergedBadges = new Set(prevProfile.unlockedBadges);
      for (const badge of BADGE_DEFINITIONS) {
        if (!mergedBadges.has(badge.id) && badge.check(candidateProfile)) {
          mergedBadges.add(badge.id);
          newlyUnlockedBadges.push(badge.id);
        }
      }
      candidateProfile.unlockedBadges = Array.from(mergedBadges).slice(0, 30);

      setProfile(candidateProfile);

      const existingLog = localRef.current.activityLogs.find((l) => l.date === today);
      const updatedLog: ActivityLogItem = {
        date: today,
        ownerId: 'local-user',
        completedCount: Math.max(
          0,
          (existingLog?.completedCount || 0) + (markingComplete ? 1 : -1)
        ),
        highPriorityCount: Math.max(
          0,
          (existingLog?.highPriorityCount || 0) +
            (task.priority === 'high' ? (markingComplete ? 1 : -1) : 0)
        ),
        xpEarned: Math.max(0, (existingLog?.xpEarned || 0) + xpDelta),
      };

      setActivityLogs((prev) => {
        const exists = prev.some((l) => l.date === today);
        return exists
          ? prev.map((l) => (l.date === today ? updatedLog : l))
          : [...prev, updatedLog];
      });

      return { newlyUnlockedBadges, xpDelta };
    },
    []
  );

  const snoozeTaskOneDay = useCallback(
    async (task: TaskItem) => {
      const base = task.dueDate || getTodayDateStr();
      const nextDate = addDaysToDateStr(base, 1);
      await updateTask(task.id, { dueDate: nextDate });
    },
    [updateTask]
  );

  const cycleTaskPriority = useCallback(
    async (task: TaskItem) => {
      const next: Priority =
        task.priority === 'low' ? 'medium' : task.priority === 'medium' ? 'high' : 'low';
      await updateTask(task.id, { priority: next });
    },
    [updateTask]
  );

  const addFolder = useCallback(async (name: string, color: string, icon = 'folder') => {
    const newFolder: FolderItem = {
      id: createCleanId('folder'),
      ownerId: 'local-user',
      name: name.trim().slice(0, 60) || 'New Folder',
      color: color.slice(0, 32),
      icon: icon.slice(0, 32),
    };
    setFolders((prev) => [...prev, newFolder]);
    return newFolder;
  }, []);

  const updateFolder = useCallback(async (folderId: string, patch: Partial<FolderItem>) => {
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, ...patch } : f)));
  }, []);

  const deleteFolder = useCallback(
    async (folderId: string) => {
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      const affected = localRef.current.tasks.filter((t) => t.folderId === folderId);
      for (const t of affected) {
        await updateTask(t.id, { folderId: '' });
      }
    },
    [updateTask]
  );

  const addTag = useCallback(async (name: string, color: string) => {
    const newTag: TagItem = {
      id: createCleanId('tag'),
      ownerId: 'local-user',
      name: name.trim().slice(0, 40) || 'Tag',
      color: color.slice(0, 32),
    };
    setTags((prev) => [...prev, newTag]);
    return newTag;
  }, []);

  const deleteTag = useCallback(
    async (tagId: string) => {
      setTags((prev) => prev.filter((t) => t.id !== tagId));
      const affected = localRef.current.tasks.filter((t) => t.tags.includes(tagId));
      for (const t of affected) {
        await updateTask(t.id, { tags: t.tags.filter((id) => id !== tagId) });
      }
    },
    [updateTask]
  );

  const addTemplate = useCallback(async (tpl: Omit<TaskTemplate, 'id' | 'ownerId'>) => {
    const newTpl: TaskTemplate = {
      id: createCleanId('tpl'),
      ownerId: 'local-user',
      name: tpl.name.trim().slice(0, 80) || 'Custom Template',
      description: tpl.description.slice(0, 240),
      tasks: tpl.tasks.slice(0, 15),
    };
    setTemplates((prev) => [...prev, newTpl]);
    return newTpl;
  }, []);

  const deleteTemplate = useCallback(async (templateId: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
  }, []);

  const applyTemplate = useCallback(
    async (template: TaskTemplate) => {
      const today = getTodayDateStr();
      for (const spec of template.tasks) {
        await addTask({
          title: spec.title,
          notes: spec.notes,
          priority: spec.priority,
          reminderTime: spec.reminderTime,
          recurrence: spec.recurrence,
          folderId: spec.folderId,
          tags: spec.tags,
          dueDate: today,
        });
      }
    },
    [addTask]
  );

  return {
    profile,
    tasks,
    folders,
    tags,
    activityLogs,
    templates,
    updateSettings,
    updateProfileInfo,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    snoozeTaskOneDay,
    cycleTaskPriority,
    addFolder,
    updateFolder,
    deleteFolder,
    addTag,
    deleteTag,
    addTemplate,
    deleteTemplate,
    applyTemplate,
  };
}
