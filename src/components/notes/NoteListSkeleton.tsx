import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import Skeleton from '@/components/ui/Skeleton';
import { makeStyles } from '@/theme/makeStyles';
import { radii, spacing } from '@/theme/tokens';

const ROWS = [0, 1, 2, 3, 4];

export default function NoteListSkeleton() {
  const { t } = useTranslation();
  const styles = useStyles();

  return (
    <View
      accessibilityLabel={t('a11y.loading')}
      accessibilityRole="progressbar"
      style={styles.list}
    >
      {ROWS.map((row) => (
        <View key={row} style={styles.card}>
          <Skeleton height={18} width={row % 2 ? '45%' : '62%'} />
          <Skeleton height={14} width="92%" />
          <Skeleton height={14} width="70%" />
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  list: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.elevation.level1,
    borderRadius: radii.lg,
    gap: spacing.sm,
    padding: spacing.lg,
  },
}));
