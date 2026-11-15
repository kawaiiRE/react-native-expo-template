import { reaction } from 'mobx';
import { useEffect } from 'react';

import {
  usePreferences,
  useServices,
  useSession,
} from '@/stores/AppEnvironmentContext';

/**
 * Keeps the account locale equal to the app language so the backend can
 * localize emails. Best effort: failures retry on the next change.
 */
export function useProfileLocaleSync() {
  const session = useSession();
  const preferences = usePreferences();
  const { account } = useServices();

  useEffect(
    () =>
      reaction(
        () => ({
          userId: session.user?.id ?? null,
          stored: session.user?.locale ?? null,
          wanted: preferences.effectiveLanguage,
        }),
        ({ userId, stored, wanted }) => {
          if (!userId || stored === wanted) return;
          void account.updateProfile({ locale: wanted }).then((result) => {
            if (result.ok) void session.updateUser(result.data);
          });
        },
        {
          fireImmediately: true,
          equals: (a, b) =>
            a.userId === b.userId &&
            a.stored === b.stored &&
            a.wanted === b.wanted,
        },
      ),
    [account, preferences, session],
  );
}
