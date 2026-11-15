import React, { useRef, useState } from 'react';
import {
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Edit3,
  Repeat,
  Trash2,
} from 'lucide-react';
import { getTodayDateStr } from '../constants/taskxData';
import {
  DensityMode,
  FolderItem,
  SwipeAction,
  TagItem,
  TaskItem,
} from '../types/taskx';

interface TaskRowProps {
  task: TaskItem;
  folders: FolderItem[];
  tags: TagItem[];
  density: DensityMode;
  swipeLeft: SwipeAction;
  swipeRight: SwipeAction;
  onToggleComplete: (task: TaskItem) => void;
  onToggleSubtask: (task: TaskItem, subtaskId: string) => void;
  onEdit: (task: TaskItem) => void;
  onSwipeAction: (task: TaskItem, action: SwipeAction) => void;
}

const SWIPE_LABELS: Record<SwipeAction, string> = {
  complete: 'Complete',
  snooze: 'Snooze +1d',
  priority: 'Priority',
  delete: 'Delete',
  archive: 'Archive',
};

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  folders,
  tags,
  density,
  swipeLeft,
  swipeRight,
  onToggleComplete,
  onToggleSubtask,
  onEdit,
  onSwipeAction,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const startXRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const today = getTodayDateStr();
  const isCompletedToday =
    task.recurrence !== 'none' ? task.lastCompletedDate === today : task.completed;

  const folder = folders.find((f) => f.id === task.folderId);
  const resolvedTags = tags.filter((t) => task.tags.includes(t.id));

  const isOverdue = Boolean(task.dueDate && task.dueDate < today && !isCompletedToday);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    startXRef.current = e.clientX;
    isDraggingRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startXRef.current === null) return;
    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > 8) {
      isDraggingRef.current = true;
      setDragOffset(Math.max(-110, Math.min(110, dx)));
    }
  };

  const handlePointerEnd = () => {
    if (startXRef.current === null) return;
    if (dragOffset >= 72) {
      onSwipeAction(task, swipeRight);
    } else if (dragOffset <= -72) {
      onSwipeAction(task, swipeLeft);
    }
    startXRef.current = null;
    isDraggingRef.current = false;
    setDragOffset(0);
  };

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-zinc-800/90 bg-white dark:bg-[#09090B]">
      {/* Swipe reveal backdrop */}
      {dragOffset !== 0 && (
        <div
          className={`absolute inset-0 flex items-center justify-between px-5 text-xs font-semibold ${
            dragOffset > 0
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          <span>{dragOffset > 0 ? SWIPE_LABELS[swipeRight] : ''}</span>
          <span>{dragOffset < 0 ? SWIPE_LABELS[swipeLeft] : ''}</span>
        </div>
      )}

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        style={{
          transform: dragOffset ? `translateX(${dragOffset}px)` : undefined,
          transition: dragOffset === 0 ? 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
        }}
        className={`relative z-10 bg-white dark:bg-[#09090B] flex items-start gap-3 ${
          density === 'compact' ? 'px-3.5 py-2.5' : 'px-4 py-3.5'
        } hover:bg-slate-50/70 dark:hover:bg-zinc-900/70 transition-colors`}
      >
        <button
          type="button"
          onClick={() => onToggleComplete(task)}
          aria-label={isCompletedToday ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
          className={`mt-0.5 min-h-[24px] min-w-[24px] h-6 w-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
            isCompletedToday
              ? 'bg-[var(--tx-accent)] border-[var(--tx-accent)] text-[var(--tx-accent-fg)]'
              : task.priority === 'high'
                ? 'border-red-500/80 hover:bg-red-50 dark:hover:bg-red-950/30'
                : task.priority === 'medium'
                  ? 'border-amber-500/70 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                  : 'border-slate-300 dark:border-slate-600 hover:border-[var(--tx-accent)]'
          }`}
        >
          {isCompletedToday && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => (task.subtasks.length > 0 || task.notes ? setExpanded((v) => !v) : onEdit(task))}
              className="text-left flex-1 min-w-0 group"
            >
              <span
                className={`block text-[15px] font-medium leading-snug break-words ${
                  isCompletedToday
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {task.title}
              </span>
            </button>

            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => onEdit(task)}
                aria-label={`Edit ${task.title}`}
                className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onSwipeAction(task, 'delete')}
                aria-label={`Delete ${task.title}`}
                className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Clean unboxed metadata row with typographic separators */}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
            {task.priority === 'high' && (
              <>
                <span className="font-semibold text-red-600 dark:text-red-400">High Priority</span>
                <span aria-hidden="true">·</span>
              </>
            )}

            {task.dueDate && (
              <span
                className={`font-mono tabular-nums ${
                  isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''
                }`}
              >
                {task.dueDate === today ? 'Today' : task.dueDate}
              </span>
            )}

            {task.reminderTime && (
              <>
                {task.dueDate && <span aria-hidden="true">·</span>}
                <span className="inline-flex items-center gap-1 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                  <Bell className="h-3 w-3" />
                  {task.reminderTime}
                </span>
              </>
            )}

            {task.recurrence !== 'none' && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 capitalize text-[var(--tx-accent)]">
                  <Repeat className="h-3 w-3" />
                  {task.recurrence}
                </span>
              </>
            )}

            {folder && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full inline-block"
                    style={{ backgroundColor: folder.color }}
                  />
                  {folder.name}
                </span>
              </>
            )}

            {resolvedTags.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-slate-500 dark:text-slate-400">
                  {resolvedTags.map((t) => `#${t.name}`).join('  ')}
                </span>
              </>
            )}

            {task.subtasks.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="inline-flex items-center gap-0.5 font-mono tabular-nums hover:text-slate-900 dark:hover:text-slate-100"
                >
                  {expanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                  {completedSubtasks}/{task.subtasks.length} steps
                </button>
              </>
            )}
          </div>

          {expanded && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-zinc-800 space-y-2">
              {task.notes && (
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                  {task.notes}
                </p>
              )}
              {task.subtasks.length > 0 && (
                <ul className="space-y-1">
                  {task.subtasks.map((sub) => (
                    <li key={sub.id}>
                      <button
                        type="button"
                        onClick={() => onToggleSubtask(task, sub.id)}
                        className="flex items-center gap-2 py-1 text-xs text-left w-full hover:text-slate-900 dark:hover:text-white"
                      >
                        <span
                          className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                            sub.completed
                              ? 'bg-[var(--tx-accent)] border-[var(--tx-accent)] text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {sub.completed && <Check className="h-2.5 w-2.5" />}
                        </span>
                        <span
                          className={
                            sub.completed
                              ? 'line-through text-slate-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }
                        >
                          {sub.title}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
