import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useSession } from '@/stores/AppEnvironmentContext';

/** Revalidates the session whenever the app returns to the foreground. */
export function useSessionLifecycle() {
  const session = useSession();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void session.revalidate();
    });

    return () => subscription.remove();
  }, [session]);
}
