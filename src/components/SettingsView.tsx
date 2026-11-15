import React, { useState } from 'react';
import {
  AppWindow,
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Bell,
  FileText,
  Globe,
  LayoutGrid,
  Lock,
  Moon,
  Palette,
  Plus,
  Sparkles,
  Sun,
  Trash2,
} from 'lucide-react';
import { ACCENT_THEMES, APP_ICON_STYLES } from '../constants/taskxData';
import { LANGUAGE_LABELS } from '../i18n/translations';
import {
  AccentColorId,
  AppIconId,
  FolderItem,
  LanguageCode,
  Priority,
  Recurrence,
  SwipeAction,
  TabId,
  TaskTemplate,
  UserSettings,
  WidgetId,
} from '../types/taskx';
import { BrandIcon } from './BrandIcon';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsViewProps {
  settings: UserSettings;
  folders: FolderItem[];
  templates: TaskTemplate[];
  onUpdateSettings: (partial: Partial<UserSettings>) => Promise<void>;
  onOpenPatternSetup: () => void;
  onLockNow: () => void;
  onSendTestNotification: () => Promise<string>;
  onApplyTemplate: (tpl: TaskTemplate) => Promise<void>;
  onCreateTemplate: (tpl: Omit<TaskTemplate, 'id' | 'ownerId'>) => Promise<unknown>;
  onDeleteTemplate: (id: string) => Promise<void>;
}

const TAB_LABELS: Record<TabId, string> = {
  today: 'Today',
  upcoming: 'Upcoming',
  calendar: 'Calendar',
  folders: 'Folders & Tags',
  profile: 'Profile',
  settings: 'Settings',
};

const TODAY_WIDGET_OPTIONS: Array<{ id: WidgetId; title: string; desc: string }> = [
  {
    id: 'upcomingReminders',
    title: 'Upcoming Reminders',
    desc: 'Highlights next scheduled timed alerts for today.',
  },
  {
    id: 'quickCapture',
    title: 'Inline Quick Capture',
    desc: 'Minimal top bar for instant single-line task entry.',
  },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  folders,
  templates,
  onUpdateSettings,
  onOpenPatternSetup,
  onLockNow,
  onSendTestNotification,
  onApplyTemplate,
  onCreateTemplate,
  onDeleteTemplate,
}) => {
  const [notifFeedback, setNotifFeedback] = useState('');
  const [tplStatus, setTplStatus] = useState('');
  const [tplName, setTplName] = useState('');
  const [tplTaskTitle, setTplTaskTitle] = useState('');
  const [tplPriority, setTplPriority] = useState<Priority>('medium');
  const [tplTime, setTplTime] = useState('09:00');
  const [tplRecurrence, setTplRecurrence] = useState<Recurrence>('daily');

  const handleToggleNotification = async () => {
    if (!settings.notificationsEnabled && typeof Notification !== 'undefined') {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        await onUpdateSettings({ notificationsEnabled: true });
        setNotifFeedback('Browser push notifications enabled.');
      } else {
        setNotifFeedback('Permission denied in browser settings. In-app alerts remain active.');
        await onUpdateSettings({ notificationsEnabled: true });
      }
    } else {
      await onUpdateSettings({ notificationsEnabled: !settings.notificationsEnabled });
      setNotifFeedback('');
    }
  };

  const handleMoveTab = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= settings.tabBarItems.length) return;
    const copy = [...settings.tabBarItems];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    onUpdateSettings({ tabBarItems: copy });
  };

  const handleToggleTab = (tabId: TabId) => {
    const exists = settings.tabBarItems.includes(tabId);
    if (exists && settings.tabBarItems.length <= 2) return; // keep at least 2 tabs
    const next = exists
      ? settings.tabBarItems.filter((t) => t !== tabId)
      : [...settings.tabBarItems, tabId];
    onUpdateSettings({ tabBarItems: next });
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplName.trim() || !tplTaskTitle.trim()) return;
    await onCreateTemplate({
      name: tplName.trim(),
      description: `Custom routine (${tplRecurrence} at ${tplTime || 'anytime'})`,
      tasks: [
        {
          title: tplTaskTitle.trim(),
          notes: '',
          priority: tplPriority,
          reminderTime: tplTime,
          recurrence: tplRecurrence,
          folderId: folders[0]?.id || '',
          tags: [],
        },
      ],
    });
    setTplName('');
    setTplTaskTitle('');
    setTplStatus('Template saved.');
    setTimeout(() => setTplStatus(''), 2500);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* 1. Theme Customization & Dark Mode */}
      <section className="rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <Palette className="h-5 w-5 text-[var(--tx-accent)]" />
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Appearance & Theme Customization
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Personalize dark mode, accent color, and list density
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Theme Mode
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-zinc-900">
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onUpdateSettings({ themeMode: mode })}
                  className={`min-h-[38px] rounded-lg text-xs font-semibold capitalize flex items-center justify-center gap-1.5 transition-colors ${
                    settings.themeMode === mode
                      ? 'bg-white dark:bg-black text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  {mode === 'light' && <Sun className="h-3.5 w-3.5" />}
                  {mode === 'dark' && <Moon className="h-3.5 w-3.5" />}
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Layout Density
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-zinc-900">
              {(['comfortable', 'compact'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onUpdateSettings({ density: d })}
                  className={`min-h-[38px] rounded-lg text-xs font-semibold capitalize transition-colors ${
                    settings.density === d
                      ? 'bg-white dark:bg-black text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
            Accent Color
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ACCENT_THEMES) as AccentColorId[]).map((id) => {
              const t = ACCENT_THEMES[id];
              const active = settings.accentColor === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onUpdateSettings({ accentColor: id })}
                  className={`min-h-[38px] px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors ${
                    active
                      ? 'border-[var(--tx-accent)] bg-[var(--tx-accent-soft)] text-[var(--tx-accent)]'
                      : 'border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: t.hex }}
                  />
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. Language & Notifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <Globe className="h-5 w-5 text-[var(--tx-accent)]" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Language</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Interface language for Task X
              </p>
            </div>
          </div>
          <select
            value={settings.language}
            onChange={(e) => onUpdateSettings({ language: e.target.value as LanguageCode })}
            className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:border-[var(--tx-accent)] focus:outline-none"
          >
            {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map((code) => (
              <option key={code} value={code}>
                {LANGUAGE_LABELS[code]}
              </option>
            ))}
          </select>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] p-5 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Bell className="h-5 w-5 text-[var(--tx-accent)]" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Notifications
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Push alerts for daily & high-priority tasks
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleNotification}
              className={`min-h-[34px] px-3 rounded-lg text-xs font-semibold transition-colors ${
                settings.notificationsEnabled
                  ? 'bg-[var(--tx-accent)] text-[var(--tx-accent-fg)]'
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-300'
              }`}
            >
              {settings.notificationsEnabled ? 'On' : 'Off'}
            </button>
          </div>

          <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 py-1">
            <span>Instant push for high-priority items</span>
            <input
              type="checkbox"
              checked={settings.highPriorityPush}
              onChange={(e) => onUpdateSettings({ highPriorityPush: e.target.checked })}
              className="h-4 w-4 accent-[var(--tx-accent)]"
            />
          </label>

          <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 py-1">
            <span>Subtle completion sound cue</span>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
              className="h-4 w-4 accent-[var(--tx-accent)]"
            />
          </label>

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-xs text-slate-600 dark:text-zinc-400">Daily digest</span>
            <input
              type="time"
              value={settings.dailyDigestTime}
              onChange={(e) => onUpdateSettings({ dailyDigestTime: e.target.value })}
              className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black px-2.5 py-1 text-xs font-mono text-slate-900 dark:text-slate-100"
            />
          </div>

          <button
            type="button"
            onClick={async () => {
              const msg = await onSendTestNotification();
              setNotifFeedback(msg);
            }}
            className="w-full min-h-[38px] rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-900"
          >
            Send Test Push Notification
          </button>
          {notifFeedback && (
            <p className="text-xs text-[var(--tx-accent)]">{notifFeedback}</p>
          )}
        </section>
      </div>

      {/* 3. Swipe Actions & Pattern Lock */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <ArrowLeftRight className="h-5 w-5 text-[var(--tx-accent)]" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Swipe Actions
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Drag any task row left or right to trigger action
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">
                Swipe Right
              </label>
              <select
                value={settings.swipeRight}
                onChange={(e) =>
                  onUpdateSettings({ swipeRight: e.target.value as SwipeAction })
                }
                className="w-full min-h-[40px] rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black px-3 text-sm text-slate-900 dark:text-slate-100"
              >
                <option value="complete">Complete Task</option>
                <option value="snooze">Snooze +1 Day</option>
                <option value="priority">Cycle Priority</option>
                <option value="archive">Archive</option>
                <option value="delete">Delete</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">
                Swipe Left
              </label>
              <select
                value={settings.swipeLeft}
                onChange={(e) =>
                  onUpdateSettings({ swipeLeft: e.target.value as SwipeAction })
                }
                className="w-full min-h-[40px] rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black px-3 text-sm text-slate-900 dark:text-slate-100"
              >
                <option value="delete">Delete</option>
                <option value="archive">Archive</option>
                <option value="snooze">Snooze +1 Day</option>
                <option value="priority">Cycle Priority</option>
                <option value="complete">Complete Task</option>
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Lock className="h-5 w-5 text-[var(--tx-accent)]" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Pattern Lock
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Protect Task X with a 3×3 draw pattern
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!settings.patternLockEnabled) {
                  onOpenPatternSetup();
                } else {
                  onUpdateSettings({ patternLockEnabled: false, patternHash: '' });
                }
              }}
              className={`min-h-[34px] px-3 rounded-lg text-xs font-semibold ${
                settings.patternLockEnabled
                  ? 'bg-[var(--tx-accent)] text-[var(--tx-accent-fg)]'
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-300'
              }`}
            >
              {settings.patternLockEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenPatternSetup}
              className="min-h-[40px] px-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-900"
            >
              {settings.patternLockEnabled ? 'Change Pattern' : 'Set New Pattern'}
            </button>

            {settings.patternLockEnabled && (
              <button
                type="button"
                onClick={onLockNow}
                className="min-h-[40px] px-3.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold"
              >
                Lock App Now
              </button>
            )}
          </div>
        </section>
      </div>

      {/* 4. Tab Bar Customization & Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <LayoutGrid className="h-5 w-5 text-[var(--tx-accent)]" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Tab Bar Customization
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Show, hide, and reorder navigation tabs
                </p>
              </div>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={settings.tabBarShowLabels}
                onChange={(e) => onUpdateSettings({ tabBarShowLabels: e.target.checked })}
                className="h-4 w-4 accent-[var(--tx-accent)]"
              />
              Labels
            </label>
          </div>

          <div className="space-y-1.5">
            {settings.tabBarItems.map((tabId, idx) => (
              <div
                key={tabId}
                className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-zinc-800 px-3 py-2 text-xs"
              >
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {TAB_LABELS[tabId]}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveTab(idx, -1)}
                    disabled={idx === 0}
                    aria-label="Move tab up"
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-900 disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveTab(idx, 1)}
                    disabled={idx === settings.tabBarItems.length - 1}
                    aria-label="Move tab down"
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-900 disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleTab(tabId)}
                    className="ml-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-300"
                  >
                    Hide
                  </button>
                </div>
              </div>
            ))}

            {(Object.keys(TAB_LABELS) as TabId[])
              .filter((id) => !settings.tabBarItems.includes(id))
              .map((tabId) => (
                <div
                  key={tabId}
                  className="flex items-center justify-between rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 px-3 py-2 text-xs opacity-70"
                >
                  <span>{TAB_LABELS[tabId]}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleTab(tabId)}
                    className="px-2 py-1 rounded-md bg-[var(--tx-accent-soft)] text-[var(--tx-accent)] font-semibold"
                  >
                    Show
                  </button>
                </div>
              ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] p-5 space-y-3.5">
          <div className="flex items-center gap-2.5">
            <AppWindow className="h-5 w-5 text-[var(--tx-accent)]" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Widgets</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Toggle dashboard widgets on your Today screen
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {TODAY_WIDGET_OPTIONS.map((widget) => {
              const enabled = Boolean(settings.widgets[widget.id]);
              return (
                <label
                  key={widget.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 dark:border-zinc-800 p-3 cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {widget.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      {widget.desc}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) =>
                      onUpdateSettings({
                        widgets: { ...settings.widgets, [widget.id]: e.target.checked },
                      })
                    }
                    className="mt-0.5 h-4 w-4 accent-[var(--tx-accent)]"
                  />
                </label>
              );
            })}
          </div>
        </section>
      </div>

      {/* 5. App Icons & AI Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] p-5 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">App Icons</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Sets your mobile &amp; tablet home screen icon and browser tab icon
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {(Object.keys(APP_ICON_STYLES) as AppIconId[]).map((iconId) => {
              const active = settings.appIcon === iconId;
              return (
                <button
                  key={iconId}
                  type="button"
                  onClick={() => onUpdateSettings({ appIcon: iconId })}
                  className={`rounded-xl border p-2.5 flex flex-col items-center gap-2 transition-colors ${
                    active
                      ? 'border-[var(--tx-accent)] bg-[var(--tx-accent-soft)]'
                      : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <BrandIcon iconId={iconId} size={36} />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-full">
                    {APP_ICON_STYLES[iconId].name}
                  </span>
                </button>
              );
            })}
          </div>

          <PWAInstallButton selectedIcon={settings.appIcon} />
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-[var(--tx-accent)]" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  AI Features
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Smart natural-language entry, subtask breakdown & day optimizer
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ aiEnabled: !settings.aiEnabled })}
              className={`min-h-[34px] px-3 rounded-lg text-xs font-semibold ${
                settings.aiEnabled
                  ? 'bg-[var(--tx-accent)] text-[var(--tx-accent-fg)]'
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-300'
              }`}
            >
              {settings.aiEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <ul className="space-y-2 text-xs text-slate-600 dark:text-zinc-400">
            <li>· AI Fill parses natural language dates, daily reminder times, and priorities.</li>
            <li>· AI Breakdown splits complex tasks into 3–5 actionable checklist steps.</li>
            <li>· Optimize Day prioritizes your active schedule into a focused plan.</li>
          </ul>
        </section>
      </div>

      {/* 6. Templates Manager */}
      <section className="rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-[var(--tx-accent)]" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Task Templates
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Save recurring routines and insert them into Today in one click
              </p>
            </div>
          </div>
          {tplStatus && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {tplStatus}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="rounded-xl border border-slate-200 dark:border-zinc-800 p-4 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {tpl.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => onDeleteTemplate(tpl.id)}
                    aria-label={`Delete template ${tpl.name}`}
                    className="p-1 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  {tpl.description}
                </p>
                <p className="mt-2 text-[11px] font-mono text-slate-400">
                  {tpl.tasks.length} task(s): {tpl.tasks.map((t) => t.title).join(', ')}
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await onApplyTemplate(tpl);
                  setTplStatus(`Applied "${tpl.name}" to Today.`);
                  setTimeout(() => setTplStatus(''), 2500);
                }}
                className="min-h-[36px] px-3 rounded-lg bg-[var(--tx-accent-soft)] text-[var(--tx-accent)] hover:bg-[var(--tx-accent)] hover:text-[var(--tx-accent-fg)] text-xs font-semibold transition-colors"
              >
                Apply Template to Today
              </button>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSaveTemplate}
          className="pt-4 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
        >
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Template Name
            </label>
            <input
              type="text"
              maxLength={80}
              value={tplName}
              onChange={(e) => setTplName(e.target.value)}
              placeholder="e.g. Evening Shutdown"
              className="w-full min-h-[38px] rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black px-3 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Starter Task Title
            </label>
            <input
              type="text"
              maxLength={140}
              value={tplTaskTitle}
              onChange={(e) => setTplTaskTitle(e.target.value)}
              placeholder="e.g. Clear inbox & log tomorrow's focus"
              className="w-full min-h-[38px] rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black px-3 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Time</label>
            <input
              type="time"
              value={tplTime}
              onChange={(e) => setTplTime(e.target.value)}
              className="w-full min-h-[38px] rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black px-2.5 text-xs font-mono text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="sm:col-span-3 flex gap-2">
            <select
              value={tplPriority}
              onChange={(e) => setTplPriority(e.target.value as Priority)}
              className="flex-1 min-h-[38px] rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black px-2.5 text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <select
              value={tplRecurrence}
              onChange={(e) => setTplRecurrence(e.target.value as Recurrence)}
              className="flex-1 min-h-[38px] rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black px-2.5 text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="daily">Daily</option>
              <option value="weekdays">Weekdays</option>
              <option value="weekly">Weekly</option>
              <option value="none">Once</option>
            </select>
            <button
              type="submit"
              disabled={!tplName.trim() || !tplTaskTitle.trim()}
              className="min-h-[38px] px-3 rounded-xl bg-[var(--tx-accent)] text-[var(--tx-accent-fg)] text-xs font-semibold disabled:opacity-40 flex items-center gap-1 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Save
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
