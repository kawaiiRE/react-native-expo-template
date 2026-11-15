import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { useSnackbar } from '@/components/feedback/SnackbarProvider';
import type { Note } from '@/models/note';
import { errorMessageKey } from '@/presenters/errors';
import { useServices } from '@/stores/AppEnvironmentContext';

/** Archive, restore and delete with confirmation, feedback and haptics. */
export function useNoteActions() {
  const { notes } = useServices();
  const { t } = useTranslation();
  const confirm = useConfirm();
  const snackbar = useSnackbar();

  const setArchived = useCallback(
    async (note: Note, archived: boolean) => {
      const result = await notes.update(note.id, { archived });

      if (!result.ok) {
        snackbar.show({
          message: t(errorMessageKey(result.error)),
          tone: 'error',
          haptic: true,
        });
        return false;
      }

      snackbar.show({
        message: archived
          ? t('notes.archivedToast')
          : t('notes.unarchivedToast'),
        tone: 'success',
        haptic: true,
        actionLabel: t('common.undo'),
        onAction: () => void notes.update(note.id, { archived: !archived }),
      });
      return true;
    },
    [notes, snackbar, t],
  );

  const remove = useCallback(
    async (note: Note) => {
      const confirmed = await confirm({
        title: t('notes.confirmDelete.title'),
        message: t('notes.confirmDelete.body'),
        confirmLabel: t('notes.confirmDelete.confirm'),
        destructive: true,
      });

      if (!confirmed) return false;

      const result = await notes.remove(note.id);

      if (!result.ok) {
        snackbar.show({
          message: t(errorMessageKey(result.error)),
          tone: 'error',
          haptic: true,
        });
        return false;
      }

      snackbar.show({
        message: t('notes.deleted'),
        tone: 'success',
        haptic: true,
      });
      return true;
    },
    [confirm, notes, snackbar, t],
  );

  return { setArchived, remove };
}
