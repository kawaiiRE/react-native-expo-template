import type { Note } from '@/models/note';

const PREVIEW_MAX = 160;

export type NoteListItemModel = {
  id: string;
  title: string | null;
  preview: string | null;
  archived: boolean;
  updatedAt: string;
};

export function presentNoteListItem(note: Note): NoteListItemModel {
  const title = note.title.trim().replace(/\s+/g, ' ');
  const preview = note.body.trim().replace(/\s+/g, ' ').slice(0, PREVIEW_MAX);

  return {
    id: note.id,
    title: title || null,
    preview: preview || null,
    archived: note.archived,
    updatedAt: note.updatedAt,
  };
}
