import type { Note, Page } from '@/models/note';
import type { AppError } from '@/models/errors';
import type { NoteChange } from '@/services/notes/notesService';

export type NotesListFilter = { archived: boolean; search: string };

export type NotesListState = {
  status: 'loading' | 'ready' | 'error';
  items: Note[];
  page: number;
  totalPages: number;
  totalItems: number;
  error: AppError | null;
  refreshing: boolean;
  loadingMore: boolean;
  loadMoreError: AppError | null;
};

export const initialNotesListState: NotesListState = {
  status: 'loading',
  items: [],
  page: 0,
  totalPages: 0,
  totalItems: 0,
  error: null,
  refreshing: false,
  loadingMore: false,
  loadMoreError: null,
};

function mergeUnique(existing: Note[], incoming: Note[]) {
  const seen = new Set(existing.map((note) => note.id));
  return [...existing, ...incoming.filter((note) => !seen.has(note.id))];
}

export function applyPage(
  state: NotesListState,
  page: Page<Note>,
  append: boolean,
): NotesListState {
  return {
    ...state,
    status: 'ready',
    items: append ? mergeUnique(state.items, page.items) : page.items,
    page: page.page,
    totalPages: page.totalPages,
    totalItems: page.totalItems,
    error: null,
    refreshing: false,
    loadingMore: false,
    loadMoreError: null,
  };
}

export function hasMorePages(state: NotesListState) {
  return state.status === 'ready' && state.page < state.totalPages;
}

/** Keeps a loaded list consistent with a mutation made elsewhere in the app. */
export function applyNoteChange(
  state: NotesListState,
  change: NoteChange,
  filter: NotesListFilter,
): NotesListState {
  if (state.status !== 'ready') return state;

  if (change.type === 'deleted') {
    if (!state.items.some((note) => note.id === change.id)) return state;
    return {
      ...state,
      items: state.items.filter((note) => note.id !== change.id),
      totalItems: Math.max(0, state.totalItems - 1),
    };
  }

  if (change.type === 'created') {
    if (filter.archived !== change.note.archived || filter.search.trim()) {
      return state;
    }
    return {
      ...state,
      items: [
        change.note,
        ...state.items.filter((n) => n.id !== change.note.id),
      ],
      totalItems: state.totalItems + 1,
    };
  }

  const exists = state.items.some((note) => note.id === change.note.id);

  if (change.note.archived !== filter.archived) {
    return exists
      ? {
          ...state,
          items: state.items.filter((note) => note.id !== change.note.id),
          totalItems: Math.max(0, state.totalItems - 1),
        }
      : state;
  }

  if (exists) {
    return {
      ...state,
      items: [
        change.note,
        ...state.items.filter((note) => note.id !== change.note.id),
      ],
    };
  }

  return filter.search.trim()
    ? state
    : {
        ...state,
        items: [change.note, ...state.items],
        totalItems: state.totalItems + 1,
      };
}
