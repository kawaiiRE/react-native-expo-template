import type { Href } from 'expo-router';

export const routes = {
  welcome: '/welcome',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  verifyEmail: (email?: string): Href =>
    email ? { pathname: '/verify-email', params: { email } } : '/verify-email',

  home: '/',
  notes: '/notes',
  archivedNotes: { pathname: '/notes', params: { filter: 'archived' } },
  settings: '/settings',
  newNote: '/notes/new',
  note: (id: string): Href => ({ pathname: '/notes/[id]', params: { id } }),
  editNote: (id: string): Href => ({
    pathname: '/notes/[id]/edit',
    params: { id },
  }),
  profile: '/settings/profile',
  language: '/settings/language',
  changePassword: '/settings/password',
  deleteAccount: '/settings/delete-account',
  about: '/about',
  upgrade: '/upgrade',
} as const satisfies Record<string, Href | ((...args: never[]) => Href)>;

export const NOTES_FILTER_PARAM = 'filter';
export type NotesFilterParam = 'active' | 'archived';
