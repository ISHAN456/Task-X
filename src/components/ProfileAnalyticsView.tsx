import React, { useMemo, useRef, useState } from 'react';
import {
  Award,
  Camera,
  CheckCircle2,
  Edit3,
  Flame,
  RotateCcw,
  Settings,
  TrendingUp,
  X,
} from 'lucide-react';
import defaultAvatarImg from '../assets/images/avatar_taskx_default_1794718623773.jpg';
import {
  addDaysToDateStr,
  BADGE_DEFINITIONS,
  getLevelFromXp,
  getTodayDateStr,
  getTodayTasks,
  isTaskDoneOnDate,
} from '../constants/taskxData';
import {
  ActivityLogItem,
  FolderItem,
  TaskItem,
  UserProfile,
} from '../types/taskx';
import { BadgeMedal } from './BadgeMedal';

interface ProfileAnalyticsViewProps {
  profile: UserProfile;
  tasks: TaskItem[];
  folders: FolderItem[];
  activityLogs: ActivityLogItem[];
  onUpdateProfile: (displayName: string, photoURL: string) => Promise<void>;
  onOpenSettings: () => void;
}

function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format.'));
      img.onload = () => {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas unavailable.'));
          return;
        }
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const ProfileAnalyticsView: React.FC<ProfileAnalyticsViewProps> = ({
  profile,
  tasks,
  folders,
  activityLogs,
  onUpdateProfile,
  onOpenSettings,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [draftName, setDraftName] = useState(profile.displayName);
  const [draftPhoto, setDraftPhoto] = useState(profile.photoURL);
  const [savingProfile, setSavingProfile] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const levelInfo = getLevelFromXp(profile.xp);
  const today = getTodayDateStr();

  const todayTasks = useMemo(() => getTodayTasks(tasks, today), [tasks, today]);
  const completedTodayCount = useMemo(
    () => todayTasks.filter((t) => isTaskDoneOnDate(t, today)).length,
    [todayTasks, today]
  );
  const todayCompletionPct =
    todayTasks.length === 0 ? 0 : Math.round((completedTodayCount / todayTasks.length) * 100);

  const activeBadgeIds = useMemo(
    () => new Set(BADGE_DEFINITIONS.map((b) => b.id)),
    []
  );
  const unlockedVisibleCount = useMemo(
    () => profile.unlockedBadges.filter((id) => activeBadgeIds.has(id)).length,
    [profile.unlockedBadges, activeBadgeIds]
  );

  const last14Days = useMemo(() => {
    const map = new Map(activityLogs.map((l) => [l.date, l]));
    const items = [];
    for (let i = 13; i >= 0; i--) {
      const dateStr = addDaysToDateStr(today, -i);
      const log = map.get(dateStr);
      items.push({
        date: dateStr,
        label: dateStr.slice(5),
        count: log?.completedCount || 0,
        xp: log?.xpEarned || 0,
      });
    }
    return items;
  }, [activityLogs, today]);

  const max14Count = Math.max(4, ...last14Days.map((d) => d.count));

  const heatmap70 = useMemo(() => {
    const map = new Map(activityLogs.map((l) => [l.date, l.completedCount]));
    const days = [];
    for (let i = 69; i >= 0; i--) {
      const d = addDaysToDateStr(today, -i);
      days.push({ date: d, count: map.get(d) || 0 });
    }
    return days;
  }, [activityLogs, today]);

  const folderStats = useMemo(() => {
    const total = Math.max(1, tasks.length);
    return folders.map((f) => {
      const fTasks = tasks.filter((t) => t.folderId === f.id);
      const done = fTasks.filter(
        (t) => t.completed || t.lastCompletedDate === today
      ).length;
      return {
        ...f,
        total: fTasks.length,
        done,
        share: Math.round((fTasks.length / total) * 100),
      };
    });
  }, [folders, tasks, today]);

  const avatarSrc =
    !imgFailed && (profile.photoURL || defaultAvatarImg)
      ? profile.photoURL || defaultAvatarImg
      : '';

  const ringCircumference = 2 * Math.PI * 38;
  const ringOffset =
    ringCircumference - (levelInfo.progressPercent / 100) * ringCircumference;

  const openEditor = () => {
    setDraftName(profile.displayName);
    setDraftPhoto(profile.photoURL);
    setPhotoError('');
    setEditOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError('');
    try {
      const compressed = await compressImageToDataUrl(file);
      setDraftPhoto(compressed);
    } catch (err: any) {
      setPhotoError(err?.message || 'Unable to process image.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftName.trim() || savingProfile) return;
    setSavingProfile(true);
    try {
      setImgFailed(false);
      await onUpdateProfile(draftName.trim(), draftPhoto.trim());
      setEditOpen(false);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Identity & Cloud Sync Hero */}
      <section className="rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 flex items-center justify-center">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 88 88" aria-hidden="true">
                <circle
                  cx="44"
                  cy="44"
                  r="38"
                  fill="none"
                  stroke="currentColor"
                  className="text-slate-100 dark:text-zinc-800"
                  strokeWidth="5"
                />
                <circle
                  cx="44"
                  cy="44"
                  r="38"
                  fill="none"
                  stroke="var(--tx-accent)"
                  strokeWidth="5"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  strokeLinecap="round"
                />
              </svg>
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={profile.displayName}
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="absolute h-16 w-16 rounded-full object-cover border border-slate-200 dark:border-zinc-700"
                />
              ) : (
                <div className="absolute h-16 w-16 rounded-full bg-[var(--tx-accent)] text-[var(--tx-accent-fg)] flex items-center justify-center text-xl font-bold">
                  {profile.displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
                  {profile.displayName}
                </h2>
                <span className="text-xs font-mono tabular-nums font-semibold text-[var(--tx-accent)]">
                  Level {levelInfo.level} · {levelInfo.title}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
                Local workspace · Saved offline on this device
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums text-slate-600 dark:text-zinc-300">
                <span>
                  {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP
                </span>
                <span aria-hidden="true">·</span>
                <span>{profile.xp} Total XP</span>
                <span aria-hidden="true">·</span>
                <span>
                  {unlockedVisibleCount}/{BADGE_DEFINITIONS.length} Badges
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={openEditor}
              className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-zinc-900 flex items-center gap-2 whitespace-nowrap"
            >
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-zinc-900 flex items-center gap-2 whitespace-nowrap"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
          </div>
        </div>
      </section>

      {/* Edit Profile Modal */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#09090B] p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h3
                id="edit-profile-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                Edit Profile
              </h3>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Close edit profile"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={draftPhoto || defaultAvatarImg}
                  alt="Avatar preview"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = defaultAvatarImg;
                  }}
                  className="h-16 w-16 rounded-full object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
                />
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[38px] px-3.5 rounded-xl bg-[var(--tx-accent)] hover:bg-[var(--tx-accent-hover)] text-[var(--tx-accent-fg)] text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Upload Photo
                  </button>
                  {draftPhoto && (
                    <button
                      type="button"
                      onClick={() => setDraftPhoto('')}
                      className="min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 flex items-center gap-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Default
                    </button>
                  )}
                </div>
              </div>
              {photoError && (
                <p className="text-xs text-red-600 dark:text-red-400">{photoError}</p>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Your name"
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-black px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:border-[var(--tx-accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1.5">
                  Or Profile Image URL
                </label>
                <input
                  type="url"
                  maxLength={500}
                  value={draftPhoto.startsWith('data:') ? '' : draftPhoto}
                  onChange={(e) => setDraftPhoto(e.target.value)}
                  placeholder={
                    draftPhoto.startsWith('data:')
                      ? 'Uploaded image ready (or paste https:// URL)'
                      : 'https://example.com/avatar.jpg'
                  }
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-black px-3.5 text-xs text-slate-900 dark:text-slate-100 focus:border-[var(--tx-accent)] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="min-h-[40px] px-4 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile || !draftName.trim()}
                  className="min-h-[40px] px-5 rounded-xl bg-[var(--tx-accent)] hover:bg-[var(--tx-accent-hover)] text-[var(--tx-accent-fg)] text-xs font-semibold disabled:opacity-45"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4-Column KPI Strip: Daily Progress, Day Streak, Tasks Completed, Level Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Daily Progress</p>
            <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {todayCompletionPct}%
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              {completedTodayCount}/{todayTasks.length} done · {todayTasks.length - completedTodayCount} left
            </p>
          </div>
          <svg className="h-14 w-14 -rotate-90 shrink-0" viewBox="0 0 56 56" aria-hidden="true">
            <circle
              cx="28"
              cy="28"
              r="22"
              fill="none"
              stroke="currentColor"
              className="text-slate-100 dark:text-zinc-800"
              strokeWidth="5"
            />
            <circle
              cx="28"
              cy="28"
              r="22"
              fill="none"
              stroke="var(--tx-accent)"
              strokeWidth="5"
              strokeDasharray={2 * Math.PI * 22}
              strokeDashoffset={
                2 * Math.PI * 22 - (todayCompletionPct / 100) * (2 * Math.PI * 22)
              }
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
            <span>Day Streak</span>
            <Flame className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {profile.streak} {profile.streak === 1 ? 'day' : 'days'}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Best: {profile.longestStreak} days
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
            <span>Tasks Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {profile.totalCompleted}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            {profile.highPriorityCompleted} high-priority
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
            <span>Level Progress</span>
            <TrendingUp className="h-4 w-4 text-[var(--tx-accent)]" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {levelInfo.progressPercent}%
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            {levelInfo.nextLevelXp - levelInfo.currentLevelXp} XP to Lv.{levelInfo.level + 1}
          </p>
        </div>
      </div>

      {/* Visual Progress Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                14-Day Completion Velocity
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Daily tasks finished over the last two weeks
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-zinc-400">
              {last14Days.reduce((acc, d) => acc + d.count, 0)} tasks
            </span>
          </div>

          <div className="h-44 flex items-end gap-1.5 sm:gap-2 pt-4">
            {last14Days.map((day) => {
              const heightPct = Math.max(6, Math.round((day.count / max14Count) * 100));
              const isToday = day.date === today;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-mono tabular-nums text-slate-400">
                    {day.count > 0 ? day.count : ''}
                  </span>
                  <div className="w-full h-28 flex items-end">
                    <div
                      title={`${day.date}: ${day.count} completed (${day.xp} XP)`}
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-md transition-all ${
                        day.count === 0
                          ? 'bg-slate-100 dark:bg-zinc-900'
                          : isToday
                            ? 'bg-[var(--tx-accent)]'
                            : 'bg-[var(--tx-accent)]/70'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] font-mono tabular-nums text-slate-400 truncate w-full text-center">
                    {day.label.slice(3)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] p-5 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              70-Day Consistency Grid
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3">
              Each cell reflects daily completed tasks
            </p>
            <div className="grid grid-cols-14 gap-1.5">
              {heatmap70.map((cell) => {
                const level =
                  cell.count === 0
                    ? 'bg-slate-100 dark:bg-zinc-900'
                    : cell.count === 1
                      ? 'bg-emerald-200 dark:bg-emerald-900/60'
                      : cell.count <= 3
                        ? 'bg-emerald-400 dark:bg-emerald-700'
                        : 'bg-emerald-600 dark:bg-emerald-500';
                return (
                  <div
                    key={cell.date}
                    title={`${cell.date}: ${cell.count} tasks`}
                    className={`aspect-square rounded-[4px] ${level}`}
                  />
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-600 dark:text-zinc-300">
              Folder Distribution
            </h4>
            {folderStats.map((f) => (
              <div key={f.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-zinc-300">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: f.color }}
                    />
                    {f.name}
                  </span>
                  <span className="font-mono tabular-nums text-slate-500">
                    {f.done}/{f.total}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-zinc-900 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${f.total === 0 ? 0 : Math.round((f.done / f.total) * 100)}%`,
                      backgroundColor: f.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Levels & Badges Gallery */}
      <section className="rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Award className="h-5 w-5 text-[var(--tx-accent)]" />
              Achievement Badges
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Earned automatically from daily completion streaks and priority milestones
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums font-semibold text-slate-600 dark:text-zinc-300">
            {unlockedVisibleCount} / {BADGE_DEFINITIONS.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {BADGE_DEFINITIONS.map((badge) => {
            const unlocked = profile.unlockedBadges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`rounded-xl border p-4 flex items-start gap-3.5 transition-colors ${
                  unlocked
                    ? 'border-[var(--tx-accent)]/40 bg-[var(--tx-accent-soft)]'
                    : 'border-slate-200 dark:border-zinc-800 opacity-75'
                }`}
              >
                <BadgeMedal badgeId={badge.id} unlocked={unlocked} size={60} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold capitalize text-slate-500 dark:text-zinc-400">
                      {badge.category}
                    </span>
                    <span
                      className={`text-[11px] font-mono font-semibold ${
                        unlocked ? 'text-[var(--tx-accent)]' : 'text-slate-400 dark:text-zinc-500'
                      }`}
                    >
                      {unlocked ? 'Unlocked' : 'Locked'}
                    </span>
                  </div>
                  <h4 className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {badge.title}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
                    {badge.description}
                  </p>
                  <p className="mt-2 text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                    Goal: {badge.requirementLabel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
