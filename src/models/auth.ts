import type { AppLanguage } from '@/i18n/languages';

import type { User } from './user';

export type ServerFeatures = {
  registration: boolean;
  emailVerification: boolean;
  guest: boolean;
  /** Hours before an idle guest account and its data are deleted. */
  guestTtlHours: number;
};

export const DEFAULT_GUEST_TTL_HOURS = 24;

export type SignInInput = { email: string; password: string };
/** Language the backend uses for the account's emails and default names. */
export type LocaleInput = { locale?: AppLanguage };
export type RegisterInput = {
  name: string;
  email: string;
  password: string;
} & LocaleInput;
export type EmailInput = { email: string };
export type ResetPasswordInput = { token: string; password: string };

export type RegisterOutcome =
  | { status: 'authenticated'; user: User }
  | { status: 'verification_required'; email: string };

export type VerifyEmailOutcome = {
  /** Set when the backend signs the user in as part of verification. */
  user: User | null;
};

export type HealthReport = {
  available: boolean;
  service: string | null;
  apiVersion: number | null;
  checkedAt: string;
};
