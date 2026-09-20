import { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';
import { makeAutoObservable, runInAction } from 'mobx';
import { z } from 'zod';

import { readJson, writeJson } from '@/services/storage/localStorage';
import type { LaunchTask } from '@/types/domain';

const ROOT_STORE_KEY = 'expo-template:root-store';

const defaultTasks: LaunchTask[] = [
  {
    id: 'starter-navigation',
    title: 'Rename routes around the real app flow',
    status: 'todo',
    createdAt: '2026-01-01T00:00:00.000Z',
    dueAt: null,
  },
  {
    id: 'starter-services',
    title: 'Connect the first API or local data source',
    status: 'todo',
    createdAt: '2026-01-01T00:00:00.000Z',
    dueAt: null,
  },
  {
    id: 'starter-polish',
    title: 'Replace starter copy with app-specific UI',
    status: 'todo',
    createdAt: '2026-01-01T00:00:00.000Z',
    dueAt: null,
  },
];

const launchTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(160),
  status: z.enum(['todo', 'done']),
  createdAt: z.iso.datetime(),
  dueAt: z.iso.datetime().nullable(),
});

const rootStoreSnapshotSchema = z.object({
  tasks: z.array(launchTaskSchema).max(500),
});

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export class RootStore {
  tasks: LaunchTask[] = [...defaultTasks];

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get completedTaskCount() {
    return this.tasks.filter((task) => task.status === 'done').length;
  }

  get activeTaskCount() {
    return this.tasks.length - this.completedTaskCount;
  }

  get completionPercent() {
    if (!this.tasks.length) {
      return 0;
    }

    return (this.completedTaskCount / this.tasks.length) * 100;
  }

  get nextTasks() {
    return this.tasks.filter((task) => task.status === 'todo').slice(0, 3);
  }

  async hydrate() {
    const parsedSnapshot = rootStoreSnapshotSchema.safeParse(
      await readJson(ROOT_STORE_KEY),
    );

    runInAction(() => {
      if (parsedSnapshot.success) {
        this.tasks = parsedSnapshot.data.tasks;
      }
    });
  }

  addTask(title: string, dueAt: string | null = null) {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    this.tasks = [
      {
        id: createId(),
        title: trimmedTitle,
        status: 'todo',
        createdAt: new Date().toISOString(),
        dueAt,
      },
      ...this.tasks,
    ];
    void this.persist();
  }

  toggleTask(taskId: string) {
    this.tasks = this.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status: task.status === 'done' ? 'todo' : 'done',
          }
        : task,
    );
    void this.persist();
  }

  removeTask(taskId: string) {
    this.tasks = this.tasks.filter((task) => task.id !== taskId);
    void this.persist();
  }

  resetStarterData() {
    this.tasks = [...defaultTasks];
    void this.persist();
  }

  private async persist() {
    await writeJson(ROOT_STORE_KEY, { tasks: this.tasks });
  }
}

const RootStoreContext = createContext<RootStore | null>(null);

export function RootStoreProvider({
  children,
  store,
}: PropsWithChildren<{ store: RootStore }>) {
  return (
    <RootStoreContext.Provider value={store}>
      {children}
    </RootStoreContext.Provider>
  );
}

export function useRootStore() {
  const store = useContext(RootStoreContext);

  if (!store) {
    throw new Error('useRootStore must be used inside RootStoreProvider.');
  }

  return store;
}
