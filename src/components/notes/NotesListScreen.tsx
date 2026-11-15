import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  FAB,
  Searchbar,
  Text,
} from 'react-native-paper';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { useSnackbar } from '@/components/feedback/SnackbarProvider';
import OfflineBanner from '@/components/ui/OfflineBanner';
import SegmentedControl from '@/components/ui/SegmentedControl';
import StateView from '@/components/ui/StateView';
import {
  NOTES_FILTER_PARAM,
  routes,
  type NotesFilterParam,
} from '@/constants/routes';
import { NOTES_SEARCH_MAX, type Note } from '@/models/note';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useNotesList } from '@/hooks/useNotesList';
import { errorMessageKey } from '@/presenters/errors';
import { haptics } from '@/services/platform/haptics';
import { makeStyles } from '@/theme/makeStyles';
import { useAppTheme } from '@/theme/theme';
import { layout, sizes, spacing } from '@/theme/tokens';

import NoteListItem from './NoteListItem';
import NoteListSkeleton from './NoteListSkeleton';

const ROW_LAYOUT = LinearTransition.duration(200);

function keyExtractor(note: Note) {
  return note.id;
}

export default function NotesListScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const styles = useStyles();
  const snackbar = useSnackbar();
  const params = useLocalSearchParams<{ [NOTES_FILTER_PARAM]?: string }>();
  const filter: NotesFilterParam =
    params[NOTES_FILTER_PARAM] === 'archived' ? 'archived' : 'active';
  const archived = filter === 'archived';
  const [query, setQuery] = useState('');
  const search = useDebouncedValue(query.trim(), 350);
  const { state, hasMore, refresh, retry, loadMore, retryLoadMore } =
    useNotesList({
      archived,
      search,
    });

  const openNote = useCallback(
    (note: Note) => router.push(routes.note(note.id)),
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: Note }) => (
      <NoteListItem note={item} onPress={openNote} />
    ),
    [openNote],
  );

  async function handleRefresh() {
    const error = await refresh();
    if (error) {
      snackbar.show({ message: t(errorMessageKey(error)), tone: 'error' });
    }
  }

  function changeFilter(value: NotesFilterParam) {
    haptics.selection();
    router.setParams({ [NOTES_FILTER_PARAM]: value });
  }

  function renderEmpty() {
    if (state.status === 'loading') return <NoteListSkeleton />;

    if (state.status === 'error' && state.error) {
      return (
        <StateView
          actionIcon="refresh"
          actionLabel={t('common.retry')}
          icon="cloud-alert-outline"
          message={t(errorMessageKey(state.error))}
          onAction={() => void retry()}
          title={t('notes.loadError')}
          tone="error"
        />
      );
    }

    if (search) {
      return (
        <StateView
          icon="text-search"
          message={t('notes.emptySearchBody', { query: search })}
          title={t('notes.emptySearchTitle')}
        />
      );
    }

    return archived ? (
      <StateView
        icon="archive-outline"
        message={t('notes.emptyArchivedBody')}
        title={t('notes.emptyArchivedTitle')}
      />
    ) : (
      <StateView
        actionIcon="plus"
        actionLabel={t('notes.newNote')}
        icon="feather"
        message={t('notes.emptyBody')}
        onAction={() => router.push(routes.newNote)}
        title={t('notes.emptyTitle')}
      />
    );
  }

  function renderFooter() {
    if (state.loadingMore) {
      return (
        <ActivityIndicator
          accessibilityLabel={t('a11y.loading')}
          style={styles.footerSpinner}
        />
      );
    }

    if (state.loadMoreError) {
      return (
        <View style={styles.footerError}>
          <Text style={styles.footerErrorText} variant="bodyMedium">
            {t('notes.loadMoreError')}
          </Text>
          <Button icon="refresh" mode="text" onPress={retryLoadMore}>
            {t('common.retry')}
          </Button>
        </View>
      );
    }

    return null;
  }

  return (
    <View style={styles.root}>
      <OfflineBanner />
      <View style={styles.controls}>
        <Searchbar
          accessibilityLabel={t('notes.searchPlaceholder')}
          autoCapitalize="none"
          autoCorrect={false}
          clearAccessibilityLabel={t('notes.clearSearch')}
          inputStyle={styles.searchInput}
          maxLength={NOTES_SEARCH_MAX}
          mode="bar"
          onChangeText={setQuery}
          placeholder={t('notes.searchPlaceholder')}
          returnKeyType="search"
          style={styles.search}
          value={query}
        />
        <SegmentedControl
          options={[
            {
              value: 'active',
              label: t('notes.filters.active'),
              icon: 'note-text-outline',
              style: styles.segment,
            },
            {
              value: 'archived',
              label: t('notes.filters.archived'),
              icon: 'archive-outline',
              style: styles.segment,
            },
          ]}
          onValueChange={changeFilter}
          value={filter}
        />
        {state.status === 'ready' && state.items.length ? (
          <Text
            accessibilityLiveRegion="polite"
            style={styles.count}
            variant="labelLarge"
          >
            {t('notes.count', { count: state.totalItems })}
          </Text>
        ) : null}
      </View>

      <Animated.FlatList
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={renderEmpty()}
        ListFooterComponent={renderFooter()}
        contentContainerStyle={styles.listContent}
        data={state.status === 'ready' ? state.items : []}
        itemLayoutAnimation={ROW_LAYOUT}
        keyExtractor={keyExtractor}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            colors={[theme.colors.primary]}
            enabled={state.status === 'ready'}
            onRefresh={() => void handleRefresh()}
            progressBackgroundColor={theme.colors.elevation.level2}
            refreshing={state.refreshing}
            tintColor={theme.colors.primary}
          />
        }
        renderItem={renderItem}
      />

      <FAB
        accessibilityLabel={t('notes.newNote')}
        icon="plus"
        label={t('notes.newNote')}
        onPress={() => router.push(routes.newNote)}
        style={styles.fab}
        variant="primary"
      />
    </View>
  );
}

function Separator() {
  return <View style={separatorStyle} />;
}

const separatorStyle = { height: spacing.sm };

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  controls: {
    alignSelf: 'center',
    gap: spacing.md,
    maxWidth: sizes.contentMaxWidth,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
    width: '100%',
  },
  search: {
    backgroundColor: theme.colors.elevation.level2,
  },
  searchInput: {
    fontFamily: theme.fontFamilies.regular,
  },
  segment: {
    minHeight: sizes.touchTarget,
    justifyContent: 'center',
  },
  count: {
    color: theme.colors.onSurfaceVariant,
    paddingHorizontal: spacing.xs,
  },
  listContent: {
    alignSelf: 'center',
    flexGrow: 1,
    maxWidth: sizes.contentMaxWidth,
    paddingBottom: layout.fabClearance,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    width: '100%',
  },
  footerSpinner: {
    paddingVertical: spacing.xl,
  },
  footerError: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  footerErrorText: {
    color: theme.colors.onSurfaceVariant,
  },
  fab: {
    bottom: spacing.lg,
    end: spacing.lg,
    position: 'absolute',
  },
}));
