import React, { useMemo, useState } from 'react';
import { Folder, Hash, Plus, Search, Trash2 } from 'lucide-react';
import {
  DensityMode,
  FolderItem,
  SwipeAction,
  TagItem,
  TaskItem,
} from '../types/taskx';
import { TaskRow } from './TaskRow';

interface FoldersTagsViewProps {
  tasks: TaskItem[];
  folders: FolderItem[];
  tags: TagItem[];
  density: DensityMode;
  swipeLeft: SwipeAction;
  swipeRight: SwipeAction;
  onAddFolder: (name: string, color: string) => Promise<unknown>;
  onDeleteFolder: (folderId: string) => void;
  onAddTag: (name: string, color: string) => Promise<unknown>;
  onDeleteTag: (tagId: string) => void;
  onAddTaskInFolder: (folderId: string) => void;
  onToggleComplete: (task: TaskItem) => void;
  onToggleSubtask: (task: TaskItem, subtaskId: string) => void;
  onEditTask: (task: TaskItem) => void;
  onSwipeAction: (task: TaskItem, action: SwipeAction) => void;
}

const PALETTE = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0f172a'];

export const FoldersTagsView: React.FC<FoldersTagsViewProps> = ({
  tasks,
  folders,
  tags,
  density,
  swipeLeft,
  swipeRight,
  onAddFolder,
  onDeleteFolder,
  onAddTag,
  onDeleteTag,
  onAddTaskInFolder,
  onToggleComplete,
  onToggleSubtask,
  onEditTask,
  onSwipeAction,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [selectedTagId, setSelectedTagId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(PALETTE[0]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(PALETTE[1]);

  const activeTasks = useMemo(() => tasks.filter((t) => !t.archived), [tasks]);

  const filteredTasks = useMemo(() => {
    return activeTasks.filter((t) => {
      if (selectedFolderId !== 'all' && t.folderId !== selectedFolderId) return false;
      if (selectedTagId !== 'all' && !t.tags.includes(selectedTagId)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !t.title.toLowerCase().includes(q) &&
          !t.notes.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [activeTasks, selectedFolderId, selectedTagId, searchQuery]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await onAddFolder(newFolderName.trim(), newFolderColor);
    setNewFolderName('');
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    await onAddTag(newTagName.trim(), newTagColor);
    setNewTagName('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Organizer Rail: Folders + Tags */}
      <div className="lg:col-span-4 space-y-6">
        {/* Folders Manager */}
        <section className="rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Folder className="h-4 w-4 text-[var(--tx-accent)]" />
              Folders
            </h2>
            <span className="text-xs font-mono tabular-nums text-slate-400">{folders.length}</span>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setSelectedFolderId('all')}
              className={`w-full min-h-[40px] px-3 rounded-xl flex items-center justify-between text-sm transition-colors ${
                selectedFolderId === 'all'
                  ? 'bg-[var(--tx-accent-soft)] text-[var(--tx-accent)] font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-900'
              }`}
            >
              <span>All Folders</span>
              <span className="text-xs font-mono tabular-nums">{activeTasks.length}</span>
            </button>

            {folders.map((folder) => {
              const count = activeTasks.filter((t) => t.folderId === folder.id).length;
              const isSelected = selectedFolderId === folder.id;
              return (
                <div
                  key={folder.id}
                  className={`group flex items-center justify-between rounded-xl pr-1 transition-colors ${
                    isSelected
                      ? 'bg-[var(--tx-accent-soft)]'
                      : 'hover:bg-slate-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={`flex-1 min-h-[40px] px-3 flex items-center justify-between text-sm text-left ${
                      isSelected
                        ? 'text-[var(--tx-accent)] font-semibold'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: folder.color }}
                      />
                      <span className="truncate">{folder.name}</span>
                    </span>
                    <span className="text-xs font-mono tabular-nums text-slate-400 ml-2">
                      {count}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedFolderId === folder.id) setSelectedFolderId('all');
                      onDeleteFolder(folder.id);
                    }}
                    aria-label={`Delete folder ${folder.name}`}
                    className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleCreateFolder} className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2.5">
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={60}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="New folder name..."
                className="flex-1 min-h-[38px] rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black px-3 text-xs text-slate-900 dark:text-slate-100 focus:border-[var(--tx-accent)] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newFolderName.trim()}
                className="min-h-[38px] px-3 rounded-xl bg-[var(--tx-accent)] text-[var(--tx-accent-fg)] text-xs font-semibold disabled:opacity-40 flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewFolderColor(c)}
                  aria-label={`Select color ${c}`}
                  className={`h-5 w-5 rounded-full transition-transform ${
                    newFolderColor === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </form>
        </section>

        {/* Customizable Tags Manager */}
        <section className="rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Hash className="h-4 w-4 text-[var(--tx-accent)]" />
              Customizable Tags
            </h2>
            <span className="text-xs font-mono tabular-nums text-slate-400">{tags.length}</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedTagId('all')}
              className={`min-h-[34px] px-3 rounded-lg text-xs font-medium border transition-colors ${
                selectedTagId === 'all'
                  ? 'border-[var(--tx-accent)] bg-[var(--tx-accent-soft)] text-[var(--tx-accent)]'
                  : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              All Tags
            </button>
            {tags.map((tag) => {
              const active = selectedTagId === tag.id;
              return (
                <div
                  key={tag.id}
                  className={`inline-flex items-center rounded-lg border text-xs font-medium transition-colors ${
                    active
                      ? 'border-[var(--tx-accent)] bg-[var(--tx-accent-soft)] text-[var(--tx-accent)]'
                      : 'border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedTagId(active ? 'all' : tag.id)}
                    className="min-h-[32px] pl-2.5 pr-1.5 flex items-center gap-1.5"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    #{tag.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedTagId === tag.id) setSelectedTagId('all');
                      onDeleteTag(tag.id);
                    }}
                    aria-label={`Delete tag ${tag.name}`}
                    className="pr-2 pl-1 py-1 text-slate-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleCreateTag} className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2.5">
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={40}
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="New tag label..."
                className="flex-1 min-h-[38px] rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black px-3 text-xs text-slate-900 dark:text-slate-100 focus:border-[var(--tx-accent)] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newTagName.trim()}
                className="min-h-[38px] px-3 rounded-xl bg-[var(--tx-accent)] text-[var(--tx-accent-fg)] text-xs font-semibold disabled:opacity-40 flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewTagColor(c)}
                  aria-label={`Select tag color ${c}`}
                  className={`h-5 w-5 rounded-full transition-transform ${
                    newTagColor === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </form>
        </section>
      </div>

      {/* Right Filtered Task List */}
      <div className="lg:col-span-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by keyword..."
              className="w-full min-h-[42px] pl-10 pr-4 rounded-xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-[#09090B] text-sm text-slate-900 dark:text-slate-100 focus:border-[var(--tx-accent)] focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              onAddTaskInFolder(selectedFolderId === 'all' ? '' : selectedFolderId)
            }
            className="min-h-[42px] px-4 rounded-xl bg-[var(--tx-accent)] hover:bg-[var(--tx-accent-hover)] text-[var(--tx-accent-fg)] text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add Here
          </button>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-[#09090B]/80 p-10 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No tasks match this folder or tag filter.
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Try clearing your filter or add a new task directly into this folder.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((t) => (
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
  );
};
