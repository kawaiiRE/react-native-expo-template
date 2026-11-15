import { intlLocaleFor, type AppLanguage } from '@/i18n/languages';

export function parseDate(value: string): Date | null {
  const date = new Date(value.replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value: string, language: AppLanguage) {
  const date = parseDate(value);
  if (!date) return '';

  try {
    return new Intl.DateTimeFormat(intlLocaleFor(language), {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 16).replace('T', ' ');
  }
}

export function formatShortDate(
  value: string,
  language: AppLanguage,
  now = new Date(),
) {
  const date = parseDate(value);
  if (!date) return '';

  const sameDay = date.toDateString() === now.toDateString();
  const sameYear = date.getFullYear() === now.getFullYear();
  const options: Intl.DateTimeFormatOptions = sameDay
    ? { hour: 'numeric', minute: '2-digit' }
    : sameYear
      ? { month: 'short', day: 'numeric' }
      : { year: 'numeric', month: 'short', day: 'numeric' };

  try {
    return new Intl.DateTimeFormat(intlLocaleFor(language), options).format(
      date,
    );
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function formatNumber(value: number, language: AppLanguage) {
  if (!Number.isFinite(value)) return '';

  try {
    return new Intl.NumberFormat(intlLocaleFor(language)).format(value);
  } catch {
    return String(value);
  }
}
