import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import PressableScale from '@/components/ui/PressableScale';
import type { Note } from '@/models/note';
import { formatShortDate } from '@/presenters/format';
import { presentNoteListItem } from '@/presenters/notes';
import { makeStyles } from '@/theme/makeStyles';
import { useAppTheme } from '@/theme/theme';
import { radii, sizes, spacing } from '@/theme/tokens';

type NoteListItemProps = {
  note: Note;
  onPress: (note: Note) => void;
  /** `card` for the notes list, `plain` for rows inside a section card. */
  variant?: 'card' | 'plain';
};

function NoteListItem({ note, onPress, variant = 'card' }: NoteListItemProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const styles = useStyles();
  const model = presentNoteListItem(note);
  const title = model.title ?? t('notes.untitled');
  const date = formatShortDate(model.updatedAt, theme.language);

  return (
    <PressableScale
      accessibilityHint={t('notes.openNote')}
      accessibilityLabel={[
        title,
        date,
        model.archived ? t('notes.archivedBadge') : null,
      ]
        .filter(Boolean)
        .join(', ')}
      contentStyle={[
        styles.row,
        variant === 'card' ? styles.card : styles.plain,
      ]}
      onPress={() => onPress(note)}
    >
      <View style={styles.header}>
        <Text
          numberOfLines={2}
          style={[styles.title, !model.title && styles.untitled]}
          variant="titleMedium"
        >
          {title}
        </Text>
        <Text numberOfLines={1} style={styles.date} variant="labelMedium">
          {date}
        </Text>
      </View>
      <Text numberOfLines={2} style={styles.preview} variant="bodyMedium">
        {model.preview ?? t('notes.noBody')}
      </Text>
      {model.archived ? (
        <View style={styles.badge}>
          <Icon
            color={theme.colors.onSecondaryContainer}
            size={14}
            source="archive-outline"
          />
          <Text style={styles.badgeText} variant="labelSmall">
            {t('notes.archivedBadge')}
          </Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

export default memo(NoteListItem);

const useStyles = makeStyles((theme) => ({
  row: {
    gap: spacing.xs,
    minHeight: sizes.touchTarget + 24,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  card: {
    backgroundColor: theme.colors.elevation.level1,
    borderRadius: radii.lg,
  },
  plain: {
    backgroundColor: 'transparent',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
  },
  title: {
    color: theme.colors.onSurface,
    flex: 1,
    fontFamily: theme.fontFamilies.semiBold,
  },
  untitled: {
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  date: {
    color: theme.colors.onSurfaceVariant,
    flexShrink: 0,
    paddingTop: spacing.xxs,
  },
  preview: {
    color: theme.colors.onSurfaceVariant,
  },
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.secondaryContainer,
    borderRadius: radii.full,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  badgeText: {
    color: theme.colors.onSecondaryContainer,
  },
}));
