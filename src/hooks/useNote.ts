import { useCallback, useEffect, useRef, useState } from 'react';

import type { Note } from '@/models/note';
import type { AppError } from '@/models/errors';
import { useServices } from '@/stores/AppEnvironmentContext';

export type NoteState =
  | { status: 'loading' }
  | { status: 'ready'; note: Note }
  | { status: 'deleted' }
  | { status: 'error'; error: AppError };

export function useNote(id: string | undefined) {
  const { notes } = useServices();
  const [state, setState] = useState<NoteState>({ status: 'loading' });
  const controllerRef = useRef<AbortController | null>(null);

  const fetchNote = useCallback(() => {
    if (!id) return Promise.resolve();
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    return notes.get(id, controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      setState(
        result.ok
          ? { status: 'ready', note: result.data }
          : { status: 'error', error: result.error },
      );
    });
  }, [id, notes]);

  const reload = useCallback(() => {
    setState({ status: 'loading' });
    return fetchNote();
  }, [fetchNote]);

  useEffect(() => {
    void fetchNote();
    return () => controllerRef.current?.abort();
  }, [fetchNote]);

  useEffect(
    () =>
      notes.subscribe((change) => {
        if (change.type === 'deleted' && change.id === id) {
          setState({ status: 'deleted' });
        } else if (change.type === 'updated' && change.note.id === id) {
          setState({ status: 'ready', note: change.note });
        }
      }),
    [id, notes],
  );

  return { state, reload };
}
