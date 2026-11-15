import { useCallback, useEffect, useRef, useState } from 'react';

import type { Note } from '@/models/note';
import type { AppError } from '@/models/errors';
import { useServices } from '@/stores/AppEnvironmentContext';

const RECENT_COUNT = 4;

export type NotesSummary = {
  activeCount: number;
  archivedCount: number;
  recent: Note[];
};

export type NotesSummaryState =
  | { status: 'loading' }
  | { status: 'ready'; summary: NotesSummary }
  | { status: 'error'; error: AppError };

export function useNotesSummary() {
  const { notes } = useServices();
  const [state, setState] = useState<NotesSummaryState>({ status: 'loading' });
  const [refreshing, setRefreshing] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const fetchSummary = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    return Promise.all([
      notes.list(
        { page: 1, perPage: RECENT_COUNT, archived: false },
        controller.signal,
      ),
      notes.list({ page: 1, perPage: 1, archived: true }, controller.signal),
    ]).then(([active, archived]) => {
      if (controller.signal.aborted) return;
      setRefreshing(false);

      if (!active.ok) {
        // Keep showing loaded data when a background refresh fails.
        setState((current) =>
          current.status === 'ready'
            ? current
            : { status: 'error', error: active.error },
        );
        return;
      }

      setState({
        status: 'ready',
        summary: {
          activeCount: active.data.totalItems,
          archivedCount: archived.ok ? archived.data.totalItems : 0,
          recent: active.data.items,
        },
      });
    });
  }, [notes]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    return fetchSummary();
  }, [fetchSummary]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    return fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    void fetchSummary();
    return () => controllerRef.current?.abort();
  }, [fetchSummary]);

  useEffect(
    () => notes.subscribe(() => void fetchSummary()),
    [fetchSummary, notes],
  );

  return { state, refreshing, refresh, retry };
}
