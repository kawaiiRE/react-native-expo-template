import { describe, expect, it } from 'vitest';

import type { Note } from '@/models/note';

import {
  applyNoteChange,
  applyPage,
  hasMorePages,
  initialNotesListState,
  type NotesListState,
} from './notesListState';

function note(id: string, archived = false): Note {
  return {
    id,
    title: `Note ${id}`,
    body: '',
    archived,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  };
}

function ready(
  items: Note[],
  totalItems = items.length,
  totalPages = 1,
): NotesListState {
  return applyPage(
    initialNotesListState,
    { items, page: 1, perPage: 20, totalItems, totalPages },
    false,
  );
}

const activeFilter = { archived: false, search: '' };

describe('notes list state', () => {
  it('appends pages without duplicating rows', () => {
    const first = ready([note('a'), note('b')], 3, 2);
    expect(hasMorePages(first)).toBe(true);

    const second = applyPage(
      first,
      {
        items: [note('b'), note('c')],
        page: 2,
        perPage: 2,
        totalItems: 3,
        totalPages: 2,
      },
      true,
    );
    expect(second.items.map((n) => n.id)).toEqual(['a', 'b', 'c']);
    expect(hasMorePages(second)).toBe(false);
  });

  it('prepends created notes only when they match the filter', () => {
    const state = ready([note('a')]);
    expect(
      applyNoteChange(
        state,
        { type: 'created', note: note('new') },
        activeFilter,
      ).items[0].id,
    ).toBe('new');
    expect(
      applyNoteChange(
        state,
        { type: 'created', note: note('new') },
        { archived: false, search: 'x' },
      ),
    ).toBe(state);
  });

  it('removes archived notes from the active list and updates in place otherwise', () => {
    const state = ready([note('a'), note('b')]);
    const archived = applyNoteChange(
      state,
      { type: 'updated', note: note('b', true) },
      activeFilter,
    );
    expect(archived.items.map((n) => n.id)).toEqual(['a']);
    expect(archived.totalItems).toBe(1);

    const edited = applyNoteChange(
      state,
      { type: 'updated', note: { ...note('b'), title: 'Edited' } },
      activeFilter,
    );
    expect(edited.items[0]).toMatchObject({ id: 'b', title: 'Edited' });
  });

  it('removes deleted notes and ignores unknown ids', () => {
    const state = ready([note('a')]);
    expect(
      applyNoteChange(state, { type: 'deleted', id: 'a' }, activeFilter).items,
    ).toEqual([]);
    expect(
      applyNoteChange(state, { type: 'deleted', id: 'zzz' }, activeFilter),
    ).toBe(state);
  });

  it('ignores changes while loading', () => {
    expect(
      applyNoteChange(
        initialNotesListState,
        { type: 'deleted', id: 'a' },
        activeFilter,
      ),
    ).toBe(initialNotesListState);
  });
});
