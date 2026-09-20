import { useCallback, useEffect, useState } from 'react';

import type { HealthViewModel } from '@/contracts/health';
import { readHealth } from '@/services/health/healthService';

export type HealthStatus =
  | { state: 'loading' }
  | { state: 'available'; data: HealthViewModel }
  | { state: 'unavailable'; message: string };

async function loadHealth(): Promise<HealthStatus> {
  const result = await readHealth();

  return result.success
    ? { state: 'available', data: result.data }
    : { state: 'unavailable', message: result.error.message };
}

export function useHealthStatus() {
  const [status, setStatus] = useState<HealthStatus>({ state: 'loading' });

  const refresh = useCallback(async () => {
    setStatus({ state: 'loading' });
    setStatus(await loadHealth());
  }, []);

  useEffect(() => {
    let isActive = true;

    void loadHealth().then((nextStatus) => {
      if (isActive) {
        setStatus(nextStatus);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  return { refresh, status };
}
