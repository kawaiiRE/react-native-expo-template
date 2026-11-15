import { useCallback, useEffect, useRef, useState } from 'react';

import type { HealthReport } from '@/models/auth';
import type { AppError, AppResult } from '@/models/errors';
import { useServices } from '@/stores/AppEnvironmentContext';

export type HealthStatus =
  | { state: 'loading' }
  | { state: 'available'; data: HealthReport }
  | { state: 'unavailable'; data: HealthReport | null; error: AppError | null };

function toStatus(result: AppResult<HealthReport>): HealthStatus {
  if (!result.ok) {
    return { state: 'unavailable', data: null, error: result.error };
  }
  if (!result.data.available) {
    return { state: 'unavailable', data: result.data, error: null };
  }
  return { state: 'available', data: result.data };
}

export function useHealthStatus() {
  const { health } = useServices();
  const [status, setStatus] = useState<HealthStatus>({ state: 'loading' });
  const controllerRef = useRef<AbortController | null>(null);

  const check = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    return health.check(controller.signal).then((result) => {
      if (!controller.signal.aborted) setStatus(toStatus(result));
    });
  }, [health]);

  const refresh = useCallback(() => {
    setStatus({ state: 'loading' });
    return check();
  }, [check]);

  useEffect(() => {
    void check();
    return () => controllerRef.current?.abort();
  }, [check]);

  return { refresh, status };
}
