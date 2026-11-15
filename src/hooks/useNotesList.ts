import { useCallback, useEffect, useRef, useState } from 'react';

import type { AppError } from '@/models/errors';
import { useServices } from '@/stores/AppEnvironmentContext';

import {
  applyNoteChange,
  applyPage,
  hasMorePages,
  initialNotesListState,
  type NotesListFilter,
  type NotesListState,
} from './notesListState';

/** Paginated notes for one filter, kept in sync with mutations elsewhere. */
export function useNotesList(filter: NotesListFilter) {
  const { notes } = useServices();
  const { archived, search } = filter;
  const queryKey = `${archived}|${search}`;
  const [state, setState] = useState<NotesListState>(initialNotesListState);
  const [stateKey, setStateKey] = useState(queryKey);
  const stateRef = useRef(state);
  const controllerRef = useRef<AbortController | null>(null);

  // Reset synchronously while rendering when the query changes, so stale rows
  // from the previous filter never flash.
  if (stateKey !== queryKey) {
    setStateKey(queryKey);
    setState(initialNotesListState);
  }

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const runQuery = useCallback(
    (page: number, append: boolean): Promise<AppError | null> => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      return notes
        .list({ page, search, archived }, controller.signal)
        .then((result) => {
          if (controller.signal.aborted) return null;

          if (!result.ok) {
            setState((current) => {
              if (append) {
                return {
                  ...current,
                  loadingMore: false,
                  loadMoreError: result.error,
                };
              }
              if (current.status === 'ready') {
                return { ...current, refreshing: false };
              }
              return {
                ...current,
                status: 'error',
                error: result.error,
                refreshing: false,
              };
            });
            return result.error;
          }

          setState((current) => applyPage(current, result.data, append));
          return null;
        });
    },
    [notes, search, archived],
  );

  useEffect(() => {
    void runQuery(1, false);
    return () => controllerRef.current?.abort();
  }, [runQuery]);

  useEffect(
    () =>
      notes.subscribe((change) => {
        setState((current) =>
          applyNoteChange(current, change, { archived, search }),
        );
      }),
    [notes, archived, search],
  );

  const refresh = useCallback(() => {
    setState((current) => ({ ...current, refreshing: true }));
    return runQuery(1, false);
  }, [runQuery]);

  const retry = useCallback(() => {
    setState(initialNotesListState);
    return runQuery(1, false);
  }, [runQuery]);

  const requestNextPage = useCallback(() => {
    const current = stateRef.current;
    if (current.loadingMore || current.refreshing || !hasMorePages(current)) {
      return;
    }
    setState((latest) => ({
      ...latest,
      loadingMore: true,
      loadMoreError: null,
    }));
    void runQuery(current.page + 1, true);
  }, [runQuery]);

  const loadMore = useCallback(() => {
    // After a failed page the user retries explicitly instead of looping.
    if (stateRef.current.loadMoreError) return;
    requestNextPage();
  }, [requestNextPage]);

  return {
    state,
    hasMore: hasMorePages(state),
    refresh,
    retry,
    loadMore,
    retryLoadMore: requestNextPage,
  };
}
