import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Chip, IconButton, Menu, Text } from 'react-native-paper';

import Screen from '@/components/ui/Screen';
import { routes } from '@/constants/routes';
import type { Note } from '@/models/note';
import { useNote } from '@/hooks/useNote';
import { useNoteActions } from '@/hooks/useNoteActions';
import { formatDateTime } from '@/presenters/format';
import { makeStyles } from '@/theme/makeStyles';
import { useAppTheme } from '@/theme/theme';
import { spacing } from '@/theme/tokens';

import NoteLoadState from './NoteLoadState';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, reload } = useNote(id);

  if (state.status !== 'ready') {
    return <NoteLoadState onRetry={() => void reload()} state={state} />;
  }

  return <NoteDetail note={state.note} />;
}

function NoteDetail({ note }: { note: Note }) {
  const navigation = useNavigation();
  const theme = useAppTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const { remove, setArchived } = useNoteActions();
  const [menuOpen, setMenuOpen] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <IconButton
            accessibilityLabel={t('common.edit')}
            icon="pencil-outline"
            iconColor={theme.colors.onSurface}
            onPress={() => router.push(routes.editNote(note.id))}
          />
          <Menu
            anchor={
              <IconButton
                accessibilityLabel={t('notes.moreActions')}
                icon="dots-vertical"
                iconColor={theme.colors.onSurface}
                onPress={() => setMenuOpen(true)}
              />
            }
            anchorPosition="bottom"
            onDismiss={() => setMenuOpen(false)}
            visible={menuOpen}
          >
            <Menu.Item
              leadingIcon={
                note.archived ? 'archive-arrow-up-outline' : 'archive-outline'
              }
              onPress={() => {
                setMenuOpen(false);
                void setArchived(note, !note.archived);
              }}
              title={note.archived ? t('notes.unarchive') : t('notes.archive')}
            />
            <Menu.Item
              leadingIcon="delete-outline"
              onPress={() => {
                setMenuOpen(false);
                void remove(note).then((deleted) => {
                  if (deleted) router.back();
                });
              }}
              title={t('common.delete')}
              titleStyle={{ color: theme.colors.error }}
            />
          </Menu>
        </View>
      ),
    });
  }, [menuOpen, navigation, note, remove, setArchived, styles, t, theme]);

  return (
    <Screen gap={spacing.lg} safeBottom>
      <View style={styles.heading}>
        <Text
          accessibilityRole="header"
          selectable
          style={[styles.title, !note.title.trim() && styles.untitled]}
          variant="headlineSmall"
        >
          {note.title.trim() || t('notes.untitled')}
        </Text>
        <View style={styles.meta}>
          {note.archived ? (
            <Chip
              compact
              icon="archive-outline"
              mode="flat"
              style={styles.chip}
            >
              {t('notes.archivedBadge')}
            </Chip>
          ) : null}
          <Text style={styles.metaText} variant="labelMedium">
            {t('notes.meta.updated', {
              date: formatDateTime(note.updatedAt, theme.language),
            })}
          </Text>
          <Text style={styles.metaText} variant="labelMedium">
            {t('notes.meta.created', {
              date: formatDateTime(note.createdAt, theme.language),
            })}
          </Text>
        </View>
      </View>
      <Text
        selectable
        style={[styles.body, !note.body.trim() && styles.untitled]}
        variant="bodyLarge"
      >
        {note.body.trim() ? note.body : t('notes.noBody')}
      </Text>
    </Screen>
  );
}

const useStyles = makeStyles((theme) => ({
  headerActions: {
    flexDirection: 'row',
  },
  heading: {
    gap: spacing.sm,
  },
  title: {
    color: theme.colors.onBackground,
    fontFamily: theme.fontFamilies.semiBold,
  },
  untitled: {
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  meta: {
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: theme.colors.secondaryContainer,
    marginBottom: spacing.xs,
  },
  metaText: {
    color: theme.colors.onSurfaceVariant,
  },
  body: {
    color: theme.colors.onSurface,
  },
}));
