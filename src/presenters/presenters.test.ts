import { describe, expect, it } from 'vitest';

import type { Note } from '@/models/note';

import { formatNumber, formatShortDate, parseDate } from './format';
import { presentIdentity } from './identity';
import { presentNoteListItem } from './notes';
import { getDisplayName, getInitials, greetingPeriod } from './user';

/** Realistic worst-case data the UI must survive (see docs/testing.md). */
const worstCaseNames: [string, string | null][] = [
  ['Aleksandra Wiśniewska-Kowalczyk', 'AW'],
  ['Christopher Alexander Montgomery III', 'CM'],
  ['Jo', 'J'],
  ['dana', 'D'],
  ['Ólafur Darri Ólafsson', 'ÓÓ'],
  ['王秀英', '王'],
  ['نور الهدى عبد الرحمن', 'نا'],
  ['María José de la Cruz y Fernández', 'MF'],
  ['🦊 Fox', 'F'],
  ['👩🏽‍💻 Priya', 'P'],
  ['  Sam   Lee ', 'SL'],
  ['🎉', null],
];

describe('getInitials', () => {
  it.each(worstCaseNames)('%s -> %s', (name, expected) => {
    expect(getInitials(name)).toBe(expected);
  });

  it('falls back to the email local part, then to nothing', () => {
    expect(
      getInitials(
        '',
        'bartholomew.fitzgerald@northwind-industries-holdings.example.com',
      ),
    ).toBe('B');
    expect(getInitials('   ', '+billing@example.com')).toBeNull();
    expect(getInitials(null)).toBeNull();
  });
});

describe('getDisplayName', () => {
  it('collapses whitespace and falls back to the email local part', () => {
    expect(
      getDisplayName({ name: '  Sam   Lee ', email: 'sam@example.com' }),
    ).toBe('Sam Lee');
    expect(getDisplayName({ name: '', email: 'a@b.co' })).toBe('a');
  });
});

describe('greetingPeriod', () => {
  it('splits the day into three periods', () => {
    expect(greetingPeriod(new Date(2026, 0, 1, 6))).toBe('morning');
    expect(greetingPeriod(new Date(2026, 0, 1, 13))).toBe('afternoon');
    expect(greetingPeriod(new Date(2026, 0, 1, 23))).toBe('evening');
    expect(greetingPeriod(new Date(2026, 0, 1, 2))).toBe('evening');
  });
});

describe('presentNoteListItem', () => {
  const base: Note = {
    id: 'n1',
    title: '',
    body: '',
    archived: false,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01 10:00:00.000Z',
  };

  it('returns nulls for blank titles and bodies so the UI can show fallbacks', () => {
    expect(
      presentNoteListItem({ ...base, title: '   ', body: '\n\n' }),
    ).toMatchObject({
      title: null,
      preview: null,
    });
  });

  it('flattens whitespace and bounds the preview length', () => {
    const model = presentNoteListItem({
      ...base,
      title: 'Line one\nLine two',
      body: 'x '.repeat(2000),
    });
    expect(model.title).toBe('Line one Line two');
    expect(model.preview?.length).toBeLessThanOrEqual(160);
  });

  it('keeps markup-looking text as literal strings', () => {
    expect(
      presentNoteListItem({ ...base, title: '<script>alert(1)</script> &amp;' })
        .title,
    ).toBe('<script>alert(1)</script> &amp;');
  });
});

describe('format helpers', () => {
  it('parses PocketBase-style and ISO dates, rejecting garbage', () => {
    expect(parseDate('2026-10-01 10:00:00.000Z')?.toISOString()).toBe(
      '2026-10-01T10:00:00.000Z',
    );
    expect(parseDate('not a date')).toBeNull();
    expect(formatShortDate('not a date', 'en')).toBe('');
  });

  it('formats numbers with the active locale and guards non-finite values', () => {
    expect(formatNumber(1284, 'en')).toBe('1,284');
    expect(formatNumber(Number.NaN, 'en')).toBe('');
    expect(formatNumber(1284, 'ar')).not.toBe('1284');
  });
});

describe('presentIdentity', () => {
  it('hides guest placeholder identities', () => {
    expect(
      presentIdentity({
        name: 'Anonymous',
        email: 'temp-123@guest.invalid',
        isGuest: true,
      }),
    ).toEqual({ name: null, firstName: null, email: null });
  });

  it('derives the display and first name for accounts', () => {
    expect(
      presentIdentity({
        name: '  Sam   Lee ',
        email: 'sam@example.com',
        isGuest: false,
      }),
    ).toEqual({ name: 'Sam Lee', firstName: 'Sam', email: 'sam@example.com' });
  });
});
