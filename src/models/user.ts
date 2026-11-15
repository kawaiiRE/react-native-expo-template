import { z } from 'zod';

import { SUPPORTED_LANGUAGES } from '@/i18n/languages';

/** Application user, identical for every backend. */
export const userSchema = z.object({
  id: z.string().min(1),
  email: z.string().min(1),
  name: z.string(),
  verified: z.boolean(),
  locale: z.enum(SUPPORTED_LANGUAGES).nullable(),
  isGuest: z.boolean(),
  createdAt: z.string().min(1),
});

export type User = z.infer<typeof userSchema>;
export type UserLocale = User['locale'];

export type UpdateProfileInput = {
  name?: string;
  locale?: Exclude<UserLocale, null>;
};

export type ChangePasswordInput = {
  currentPassword: string;
  password: string;
};

export type DeleteAccountInput = {
  /** Required by backends that re-authenticate destructive actions. */
  password?: string;
};
