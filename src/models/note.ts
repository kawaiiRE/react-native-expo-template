/** Limits accepted by every supported backend (the stricter of the two wins). */
export const NOTE_TITLE_MAX = 160;
export const NOTE_BODY_MAX = 20_000;
export const NOTES_PAGE_SIZE = 20;
export const NOTES_SEARCH_MAX = 100;

export type Note = {
  id: string;
  title: string;
  body: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Page<T> = {
  items: T[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
};

export type NotesQuery = {
  page: number;
  perPage?: number;
  search?: string;
  archived: boolean;
};

export type CreateNoteInput = { title: string; body: string };
export type UpdateNoteInput = Partial<CreateNoteInput> & { archived?: boolean };
