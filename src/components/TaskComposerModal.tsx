import React, { useEffect, useState } from 'react';
import {
  Bell,
  Calendar,
  Flag,
  Folder as FolderIcon,
  Plus,
  Repeat,
  Sparkles,
  Tag as TagIcon,
  Trash2,
  X,
} from 'lucide-react';
import { getTodayDateStr } from '../constants/taskxData';
import {
  FolderItem,
  Priority,
  Recurrence,
  Subtask,
  TagItem,
  TaskItem,
} from '../types/taskx';

interface TaskComposerModalProps {
  open: boolean;
  editingTask: TaskItem | null;
  defaultDate?: string;
  defaultFolderId?: string;
  folders: FolderItem[];
  tags: TagItem[];
  aiEnabled: boolean;
  onClose: () => void;
  onSave: (payload: {
    title: string;
    notes: string;
    dueDate: string;
    reminderTime: string;
    recurrence: Recurrence;
    customDays: number[];
    priority: Priority;
    folderId: string;
    tags: string[];
    subtasks: Subtask[];
  }) => Promise<void>;
  onCreateTag?: (name: string, color: string) => Promise<TagItem>;
}

const WEEKDAYS = [
  { label: 'S', value: 0 },
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
];

export const TaskComposerModal: React.FC<TaskComposerModalProps> = ({
  open,
  editingTask,
  defaultDate,
  defaultFolderId,
  folders,
  tags,
  aiEnabled,
  onClose,
  onSave,
  onCreateTag,
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState(getTodayDateStr());
  const [reminderTime, setReminderTime] = useState('');
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  const [customDays, setCustomDays] = useState<number[]>([1, 3, 5]);
  const [priority, setPriority] = useState<Priority>('medium');
  const [folderId, setFolderId] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [smartInput, setSmartInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAiError('');
    setSmartInput('');
    if (editingTask) {
      setTitle(editingTask.title);
      setNotes(editingTask.notes);
      setDueDate(editingTask.dueDate);
      setReminderTime(editingTask.reminderTime);
      setRecurrence(editingTask.recurrence);
      setCustomDays(editingTask.customDays || []);
      setPriority(editingTask.priority);
      setFolderId(editingTask.folderId);
      setSelectedTags(editingTask.tags || []);
      setSubtasks(editingTask.subtasks || []);
    } else {
      setTitle('');
      setNotes('');
      setDueDate(defaultDate || getTodayDateStr());
      setReminderTime('');
      setRecurrence('none');
      setCustomDays([1, 3, 5]);
      setPriority('medium');
      setFolderId(defaultFolderId || folders[0]?.id || '');
      setSelectedTags([]);
      setSubtasks([]);
    }
  }, [open, editingTask, defaultDate, defaultFolderId, folders]);

  if (!open) return null;

  const handleSmartParse = async () => {
    const query = smartInput.trim() || title.trim();
    if (!query) return;
    setAiLoading(true);
    setAiError('');
    try {
      const res = await fetch('/api/ai/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: query,
          todayDate: getTodayDateStr(),
          folders: folders.map((f) => f.name),
          tags: tags.map((t) => t.name),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI parse failed');
      if (data.title) setTitle(data.title);
      if (data.notes) setNotes(data.notes);
      if (data.dueDate !== undefined) setDueDate(data.dueDate);
      if (data.reminderTime !== undefined) setReminderTime(data.reminderTime);
      if (data.recurrence) setRecurrence(data.recurrence);
      if (Array.isArray(data.customDays)) setCustomDays(data.customDays);
      if (data.priority) setPriority(data.priority);
      if (data.suggestedFolder) {
        const matchedFolder = folders.find(
          (f) => f.name.toLowerCase() === String(data.suggestedFolder).toLowerCase()
        );
        if (matchedFolder) setFolderId(matchedFolder.id);
      }
      if (Array.isArray(data.suggestedTags) && data.suggestedTags.length > 0) {
        const nextTagIds: string[] = [];
        for (const tagName of data.suggestedTags.slice(0, 3)) {
          const existing = tags.find(
            (t) => t.name.toLowerCase() === String(tagName).toLowerCase()
          );
          if (existing) {
            nextTagIds.push(existing.id);
          } else if (onCreateTag) {
            const created = await onCreateTag(String(tagName), '#2563eb');
            nextTagIds.push(created.id);
          }
        }
        setSelectedTags(Array.from(new Set(nextTagIds)));
      }
      setSmartInput('');
    } catch (err: any) {
      setAiError(err?.message || 'Unable to parse with AI.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateSubtasks = async () => {
    if (!title.trim()) return;
    setAiLoading(true);
    setAiError('');
    try {
      const res = await fetch('/api/ai/subtasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI breakdown failed');
      const items: Subtask[] = (data.subtasks || []).map((txt: string, idx: number) => ({
        id: `sub-${Date.now()}-${idx}`,
        title: txt,
        completed: false,
      }));
      setSubtasks((prev) => [...prev, ...items].slice(0, 20));
    } catch (err: any) {
      setAiError(err?.message || 'Unable to break down task.');
    } finally {
      setAiLoading(false);
    }
  };

  const addManualSubtask = () => {
    const t = newSubtask.trim();
    if (!t) return;
    setSubtasks((prev) => [
      ...prev,
      { id: `sub-${Date.now()}`, title: t.slice(0, 160), completed: false },
    ]);
    setNewSubtask('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        notes: notes.trim(),
        dueDate,
        reminderTime,
        recurrence,
        customDays,
        priority,
        folderId,
        tags: selectedTags,
        subtasks,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="composer-title"
    >
      <div className="w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#09090B] p-5 sm:p-6 shadow-2xl">
        <div className="sm:hidden w-10 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between gap-4">
          <h2
            id="composer-title"
            className="text-lg font-bold text-slate-900 dark:text-slate-100"
          >
            {editingTask ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {aiEnabled && !editingTask && (
          <div className="mt-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-black p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={smartInput}
                onChange={(e) => setSmartInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSmartParse();
                  }
                }}
                placeholder='Smart entry: "Gym every weekday at 07:00 high priority"'
                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSmartParse}
                disabled={aiLoading || (!smartInput.trim() && !title.trim())}
                className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--tx-accent)] text-[var(--tx-accent-fg)] hover:bg-[var(--tx-accent-hover)] disabled:opacity-45 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {aiLoading ? 'Parsing...' : 'AI Fill'}
              </button>
            </div>
            {aiError && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">{aiError}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              required
              autoFocus
              maxLength={240}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to get done?"
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black px-3.5 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-[var(--tx-accent)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1.5">
              Notes
            </label>
            <textarea
              rows={2}
              maxLength={2000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional context, checklist notes, or links..."
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-[var(--tx-accent)] focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black px-3 py-2 text-sm font-mono text-slate-900 dark:text-slate-100 focus:border-[var(--tx-accent)] focus:outline-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1.5">
                <Bell className="h-3.5 w-3.5" />
                Daily Reminder Time
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="flex-1 min-h-[42px] rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black px-3 py-2 text-sm font-mono text-slate-900 dark:text-slate-100 focus:border-[var(--tx-accent)] focus:outline-none"
                />
                {reminderTime && (
                  <button
                    type="button"
                    onClick={() => setReminderTime('')}
                    className="min-h-[42px] px-2.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-zinc-800 rounded-xl"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1.5">
              <Repeat className="h-3.5 w-3.5" />
              Recurring Schedule
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'none', label: 'One-time' },
                  { id: 'daily', label: 'Every Day' },
                  { id: 'weekdays', label: 'Weekdays' },
                  { id: 'weekends', label: 'Weekends' },
                  { id: 'weekly', label: 'Weekly' },
                  { id: 'custom', label: 'Custom Days' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRecurrence(opt.id)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    recurrence === opt.id
                      ? 'bg-[var(--tx-accent)] text-[var(--tx-accent-fg)]'
                      : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {recurrence === 'custom' && (
              <div className="mt-2.5 flex items-center gap-1.5">
                {WEEKDAYS.map((day) => {
                  const active = customDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() =>
                        setCustomDays((prev) =>
                          prev.includes(day.value)
                            ? prev.filter((d) => d !== day.value)
                            : [...prev, day.value]
                        )
                      }
                      className={`h-9 w-9 rounded-lg text-xs font-semibold transition-colors ${
                        active
                          ? 'bg-[var(--tx-accent)] text-[var(--tx-accent-fg)]'
                          : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1.5">
                <Flag className="h-3.5 w-3.5" />
                Priority
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-zinc-900">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`min-h-[34px] rounded-lg text-xs font-semibold capitalize transition-colors ${
                      priority === p
                        ? p === 'high'
                          ? 'bg-red-600 text-white'
                          : p === 'medium'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1.5">
                <FolderIcon className="h-3.5 w-3.5" />
                Folder
              </label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-[var(--tx-accent)] focus:outline-none"
              >
                <option value="">No Folder</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {tags.length > 0 && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1.5">
                <TagIcon className="h-3.5 w-3.5" />
                Tags
              </label>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => {
                  const active = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() =>
                        setSelectedTags((prev) =>
                          prev.includes(tag.id)
                            ? prev.filter((id) => id !== tag.id)
                            : [...prev, tag.id].slice(0, 10)
                        )
                      }
                      className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                        active
                          ? 'border-[var(--tx-accent)] bg-[var(--tx-accent-soft)] text-[var(--tx-accent)]'
                          : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                Subtasks ({subtasks.length})
              </label>
              {aiEnabled && title.trim() && (
                <button
                  type="button"
                  onClick={handleGenerateSubtasks}
                  disabled={aiLoading}
                  className="text-xs font-semibold text-[var(--tx-accent)] hover:underline flex items-center gap-1"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {aiLoading ? 'Generating...' : 'AI Breakdown'}
                </button>
              )}
            </div>

            {subtasks.length > 0 && (
              <ul className="mb-2 space-y-1.5">
                {subtasks.map((sub) => (
                  <li
                    key={sub.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-sm"
                  >
                    <span className="truncate text-slate-800 dark:text-slate-200">{sub.title}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSubtasks((prev) => prev.filter((s) => s.id !== sub.id))
                      }
                      className="text-slate-400 hover:text-red-500 p-1"
                      aria-label="Remove subtask"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addManualSubtask();
                  }
                }}
                placeholder="Add a step..."
                className="flex-1 min-h-[40px] rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:border-[var(--tx-accent)] focus:outline-none"
              />
              <button
                type="button"
                onClick={addManualSubtask}
                className="min-h-[40px] px-3 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-900 flex items-center gap-1 text-xs font-medium"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="min-h-[42px] px-5 py-2 rounded-xl bg-[var(--tx-accent)] hover:bg-[var(--tx-accent-hover)] text-[var(--tx-accent-fg)] text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : editingTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
