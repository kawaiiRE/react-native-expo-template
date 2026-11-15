import { router } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { RefreshControl, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import NoteListItem from '@/components/notes/NoteListItem';
import FormBanner from '@/components/ui/FormBanner';
import GuestBanner from '@/components/ui/GuestBanner';
import Screen from '@/components/ui/Screen';
import SectionCard from '@/components/ui/SectionCard';
import Skeleton from '@/components/ui/Skeleton';
import StateView from '@/components/ui/StateView';
import { routes } from '@/constants/routes';
import { useNotesSummary } from '@/hooks/useNotesSummary';
import { errorMessageKey } from '@/presenters/errors';
import { presentIdentity } from '@/presenters/identity';
import { greetingPeriod } from '@/presenters/user';
import { useSession } from '@/stores/AppEnvironmentContext';
import { makeStyles } from '@/theme/makeStyles';
import { useAppTheme } from '@/theme/theme';
import { sizes, spacing } from '@/theme/tokens';

import StatTile from './StatTile';

export default observer(function HomeScreen() {
  const session = useSession();
  const { t } = useTranslation();
  const theme = useAppTheme();
  const styles = useStyles();
  const { state, refreshing, refresh, retry } = useNotesSummary();
  const user = session.user;

  return (
    <Screen
      refreshControl={
        <RefreshControl
          colors={[theme.colors.primary]}
          onRefresh={() => void refresh()}
          progressBackgroundColor={theme.colors.elevation.level2}
          refreshing={refreshing}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.greeting}>
        {user ? (
          <Text
            accessibilityRole="header"
            style={styles.title}
            variant="headlineSmall"
          >
            {t(`home.greeting.${greetingPeriod(new Date())}`, {
              name: presentIdentity(user).firstName ?? t('guest.name'),
            })}
          </Text>
        ) : null}
        <Text style={styles.subtitle} variant="bodyMedium">
          {t('home.subtitle')}
        </Text>
      </View>

      <GuestBanner />
      {user && !user.verified && !user.isGuest ? (
        <FormBanner message={t('home.verifyBanner')} tone="info" />
      ) : null}

      {state.status === 'error' ? (
        <StateView
          actionIcon="refresh"
          actionLabel={t('common.retry')}
          icon="cloud-alert-outline"
          message={t(errorMessageKey(state.error))}
          onAction={() => void retry()}
          title={t('home.loadError')}
          tone="error"
        />
      ) : (
        <>
          <View style={styles.stats}>
            <StatTile
              icon="note-text-outline"
              label={t('home.stats.active')}
              loading={state.status === 'loading'}
              onPress={() => router.navigate(routes.notes)}
              tone="primary"
              value={state.status === 'ready' ? state.summary.activeCount : 0}
            />
            <StatTile
              icon="archive-outline"
              label={t('home.stats.archived')}
              loading={state.status === 'loading'}
              onPress={() => router.navigate(routes.archivedNotes)}
              tone="secondary"
              value={state.status === 'ready' ? state.summary.archivedCount : 0}
            />
          </View>

          <SectionCard
            action={
              state.status === 'ready' && state.summary.recent.length ? (
                <Button compact onPress={() => router.navigate(routes.notes)}>
                  {t('home.seeAll')}
                </Button>
              ) : null
            }
            flush
            title={t('home.recentTitle')}
          >
            {state.status === 'loading' ? (
              <View style={styles.skeletons}>
                {[0, 1, 2].map((key) => (
                  <View key={key} style={styles.skeletonRow}>
                    <Skeleton height={16} width="55%" />
                    <Skeleton height={12} width="85%" />
                  </View>
                ))}
              </View>
            ) : state.summary.recent.length ? (
              state.summary.recent.map((note) => (
                <NoteListItem
                  key={note.id}
                  note={note}
                  onPress={() => router.push(routes.note(note.id))}
                  variant="plain"
                />
              ))
            ) : (
              <StateView
                actionIcon="plus"
                actionLabel={t('home.newNote')}
                icon="feather"
                message={t('home.emptyBody')}
                onAction={() => router.push(routes.newNote)}
                title={t('home.emptyTitle')}
              />
            )}
          </SectionCard>

          {state.status === 'ready' && state.summary.recent.length ? (
            <Button
              contentStyle={styles.ctaContent}
              icon="plus"
              mode="contained-tonal"
              onPress={() => router.push(routes.newNote)}
            >
              {t('home.newNote')}
            </Button>
          ) : null}
        </>
      )}
    </Screen>
  );
});

const useStyles = makeStyles((theme) => ({
  greeting: {
    gap: spacing.xs,
  },
  title: {
    color: theme.colors.onBackground,
    fontFamily: theme.fontFamilies.semiBold,
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  skeletons: {
    gap: spacing.xl,
    padding: spacing.lg,
  },
  skeletonRow: {
    gap: spacing.sm,
  },
  ctaContent: {
    minHeight: sizes.touchTarget,
  },
}));
