import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import Screen from '@/components/ui/Screen';
import Skeleton from '@/components/ui/Skeleton';
import StateView from '@/components/ui/StateView';
import type { NoteState } from '@/hooks/useNote';
import { errorMessageKey } from '@/presenters/errors';
import { spacing } from '@/theme/tokens';

type NoteLoadStateProps = {
  state: Exclude<NoteState, { status: 'ready' }>;
  onRetry: () => void;
};

/** Loading skeleton, missing-note and error states for a single note. */
export default function NoteLoadState({ onRetry, state }: NoteLoadStateProps) {
  const { t } = useTranslation();

  if (state.status === 'loading') {
    return (
      <Screen safeBottom>
        <View
          accessibilityLabel={t('a11y.loading')}
          style={{ gap: spacing.md }}
        >
          <Skeleton height={32} width="70%" />
          <Skeleton height={14} width="40%" />
          <Skeleton height={16} />
          <Skeleton height={16} />
          <Skeleton height={16} width="80%" />
        </View>
      </Screen>
    );
  }

  const missing =
    state.status === 'deleted' || state.error.code === 'NOT_FOUND';

  return (
    <Screen centered safeBottom>
      <StateView
        actionIcon={missing ? undefined : 'refresh'}
        actionLabel={missing ? undefined : t('common.retry')}
        icon={missing ? 'note-remove-outline' : 'cloud-alert-outline'}
        message={
          missing || state.status !== 'error'
            ? undefined
            : t(errorMessageKey(state.error))
        }
        onAction={missing ? undefined : onRetry}
        title={missing ? t('notes.notFound') : t('notes.loadError')}
        tone={missing ? 'neutral' : 'error'}
      />
    </Screen>
  );
}
