import type { User } from '@/models/user';

const NAME_SUFFIXES = new Set([
  'jr',
  'jr.',
  'sr',
  'sr.',
  'ii',
  'iii',
  'iv',
  'v',
]);

let letterPattern: RegExp | null;
try {
  letterPattern = new RegExp(String.raw`^[\p{L}\p{N}]`, 'u');
} catch {
  letterPattern = null;
}

type Segmenter = { segment(input: string): Iterable<{ segment: string }> };
type SegmenterConstructor = new (
  locale?: string,
  options?: { granularity: 'grapheme' },
) => Segmenter;

const SegmenterImpl = (Intl as unknown as { Segmenter?: SegmenterConstructor })
  .Segmenter;
const graphemeSegmenter = SegmenterImpl
  ? new SegmenterImpl(undefined, { granularity: 'grapheme' })
  : null;

export function firstGrapheme(value: string): string {
  if (!value) return '';

  if (graphemeSegmenter) {
    for (const { segment } of graphemeSegmenter.segment(value)) {
      return segment;
    }
    return '';
  }

  return Array.from(value)[0] ?? '';
}

function startsWithLetter(word: string) {
  const first = firstGrapheme(word);

  if (letterPattern) return letterPattern.test(first);
  return first.toLowerCase() !== first.toUpperCase() || /[0-9]/.test(first);
}

/**
 * Up to two initials from the first and last meaningful words. Emoji, symbols,
 * and generational suffixes are skipped; returns `null` when nothing usable
 * remains so the caller can render an icon instead.
 */
export function getInitials(name: string | null | undefined, email?: string) {
  const words = (name ?? '')
    .trim()
    .split(/\s+/)
    .filter((word) => word && startsWithLetter(word))
    .filter(
      (word, index, all) =>
        all.length === 1 ||
        index === 0 ||
        !NAME_SUFFIXES.has(word.toLowerCase()),
    );

  if (words.length === 0) {
    const local = email?.split('@')[0] ?? '';
    return startsWithLetter(local)
      ? firstGrapheme(local).toLocaleUpperCase()
      : null;
  }

  const first = firstGrapheme(words[0]);
  const last = words.length > 1 ? firstGrapheme(words[words.length - 1]) : '';
  return `${first}${last}`.toLocaleUpperCase();
}

export function getDisplayName(user: Pick<User, 'name' | 'email'>) {
  const name = user.name.trim().replace(/\s+/g, ' ');
  if (name) return name;
  return user.email.split('@')[0] || user.email;
}

export type GreetingPeriod = 'morning' | 'afternoon' | 'evening';

export function greetingPeriod(date: Date): GreetingPeriod {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}
