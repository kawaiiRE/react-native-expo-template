import type { User } from '@/models/user';

import { getDisplayName } from './user';

export type UserIdentity = {
  /** `null` for guests; the UI shows its localized guest label instead. */
  name: string | null;
  firstName: string | null;
  email: string | null;
};

/** What the UI may show about a user. Guest placeholder emails are never displayed. */
export function presentIdentity(
  user: Pick<User, 'name' | 'email' | 'isGuest'>,
): UserIdentity {
  if (user.isGuest) return { name: null, firstName: null, email: null };
  const name = getDisplayName(user);
  return { name, firstName: name.split(' ')[0], email: user.email };
}
