import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import Screen from '@/components/ui/Screen';
import StateView from '@/components/ui/StateView';
import { routes } from '@/constants/routes';

export default function NotFoundScreen() {
  const { t } = useTranslation();

  return (
    <Screen centered safeBottom>
      <StateView
        actionIcon="home-outline"
        actionLabel={t('notFound.home')}
        icon="map-marker-question-outline"
        message={t('notFound.body')}
        onAction={() => router.replace(routes.home)}
        title={t('notFound.title')}
      />
    </Screen>
  );
}
