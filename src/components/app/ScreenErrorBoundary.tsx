import type { ErrorBoundaryProps } from 'expo-router';
import { useTranslation } from 'react-i18next';

import Screen from '@/components/ui/Screen';
import StateView from '@/components/ui/StateView';

/** Route-level boundary rendered inside the themed providers. */
export default function ScreenErrorBoundary({ retry }: ErrorBoundaryProps) {
  const { t } = useTranslation();

  return (
    <Screen centered safeBottom safeTop>
      <StateView
        actionIcon="refresh"
        actionLabel={t('errorBoundary.retry')}
        icon="alert-octagon-outline"
        message={t('errorBoundary.body')}
        onAction={() => void retry()}
        title={t('errorBoundary.title')}
        tone="error"
      />
    </Screen>
  );
}
