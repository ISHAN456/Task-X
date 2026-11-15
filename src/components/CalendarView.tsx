import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { getTodayDateStr } from '../constants/taskxData';
import {
  DensityMode,
  FolderItem,
  SwipeAction,
  TagItem,
  TaskItem,
} from '../types/taskx';
import { TaskRow } from './TaskRow';

interface CalendarViewProps {
  tasks: TaskItem[];
  folders: FolderItem[];
  tags: TagItem[];
  density: DensityMode;
  swipeLeft: SwipeAction;
  swipeRight: SwipeAction;
  onAddTaskForDate: (dateStr: string) => void;
  onToggleComplete: (task: TaskItem) => void;
  onToggleSubtask: (task: TaskItem, subtaskId: string) => void;
  onEditTask: (task: TaskItem) => void;
  onSwipeAction: (task: TaskItem, action: SwipeAction) => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  folders,
  tags,
  density,
  swipeLeft,
  swipeRight,
  onAddTaskForDate,
  onToggleComplete,
  onToggleSubtask,
  onEditTask,
  onSwipeAction,
}) => {
  const todayStr = getTodayDateStr();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewMonth, setViewMonth] = useState(() => {
    const [y, m] = todayStr.split('-').map(Number);
    return { year: y, month: m - 1 };
  });

  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewMonth.year, viewMonth.month, 1).getDay();
    const daysInMonth = new Date(viewMonth.year, viewMonth.month + 1, 0).getDate();
    const cells: Array<{ dateStr: string | null; dayNum: number | null }> = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push({ dateStr: null, dayNum: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(viewMonth.month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      cells.push({ dateStr: `${viewMonth.year}-${mStr}-${dStr}`, dayNum: d });
    }
    return cells;
  }, [viewMonth]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, TaskItem[]> = {};
    for (const t of tasks) {
      if (t.archived) continue;
      if (t.dueDate) {
        if (!map[t.dueDate]) map[t.dueDate] = [];
        map[t.dueDate].push(t);
      }
    }
    return map;
  }, [tasks]);

  const selectedDayTasks = tasksByDate[selectedDate] || [];

  const shiftMonth = (delta: number) => {
    setViewMonth((prev) => {
      const next = new Date(prev.year, prev.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Month Calendar Grid */}
      <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {MONTH_NAMES[viewMonth.month]} {viewMonth.year}
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const [y, m] = todayStr.split('-').map(Number);
                setViewMonth({ year: y, month: m - 1 });
                setSelectedDate(todayStr);
              }}
              className="min-h-[36px] px-3 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-900"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-900"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-900"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400 pb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((cell, idx) => {
            if (!cell.dateStr || !cell.dayNum) {
              return <div key={`empty-${idx}`} className="h-14 sm:h-16" />;
            }
            const dayTasks = tasksByDate[cell.dateStr] || [];
            const isSelected = cell.dateStr === selectedDate;
            const isToday = cell.dateStr === todayStr;
            const hasHighPriority = dayTasks.some((t) => t.priority === 'high' && !t.completed);

            return (
              <button
                key={cell.dateStr}
                type="button"
                onClick={() => setSelectedDate(cell.dateStr!)}
                className={`h-14 sm:h-16 rounded-xl p-1.5 flex flex-col items-center justify-between border transition-colors ${
                  isSelected
                    ? 'border-[var(--tx-accent)] bg-[var(--tx-accent-soft)]'
                    : isToday
                      ? 'border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/70'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-zinc-900/50'
                }`}
              >
                <span
                  className={`text-xs font-mono tabular-nums font-semibold ${
                    isSelected || isToday
                      ? 'text-[var(--tx-accent)]'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {cell.dayNum}
                </span>

                <div className="flex items-center gap-1">
                  {dayTasks.length > 0 && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        hasHighPriority ? 'bg-red-500' : 'bg-[var(--tx-accent)]'
                      }`}
                    />
                  )}
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-mono tabular-nums text-slate-400">
                      {dayTasks.length}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda */}
      <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Selected Deadline Date</p>
            <h3 className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {selectedDate === todayStr ? `Today · ${selectedDate}` : selectedDate}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onAddTaskForDate(selectedDate)}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[var(--tx-accent)] text-[var(--tx-accent-fg)] text-xs font-semibold hover:bg-[var(--tx-accent-hover)] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add Deadline
          </button>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
            Task X Deadlines ({selectedDayTasks.length})
          </h4>
          {selectedDayTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 p-6 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No tasks scheduled for {selectedDate}.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDayTasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  folders={folders}
                  tags={tags}
                  density={density}
                  swipeLeft={swipeLeft}
                  swipeRight={swipeRight}
                  onToggleComplete={onToggleComplete}
                  onToggleSubtask={onToggleSubtask}
                  onEdit={onEditTask}
                  onSwipeAction={onSwipeAction}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
