export type LaunchTaskStatus = 'todo' | 'done';

export type LaunchTask = {
  id: string;
  title: string;
  status: LaunchTaskStatus;
  createdAt: string;
  dueAt: string | null;
};
