import { List } from 'react-native-paper';

import { makeStyles } from '@/theme/makeStyles';
import { sizes, spacing } from '@/theme/tokens';

type SettingsRowProps = {
  title: string;
  description?: string;
  icon: string;
  color?: string;
  onPress: () => void;
  /** Drop horizontal padding when the row sits inside a padded card. */
  flush?: boolean;
};

const CHEVRON = { source: 'chevron-right', direction: 'auto' } as const;

export default function SettingsRow({
  color,
  description,
  flush = false,
  icon,
  onPress,
  title,
}: SettingsRowProps) {
  const styles = useStyles();

  return (
    <List.Item
      accessibilityRole="button"
      description={description}
      descriptionNumberOfLines={2}
      left={(props) => (
        <List.Icon {...props} color={color ?? props.color} icon={icon} />
      )}
      onPress={onPress}
      right={(props) => <List.Icon {...props} icon={CHEVRON} />}
      style={[styles.row, flush && styles.flush]}
      title={title}
      titleNumberOfLines={2}
      titleStyle={color ? { color } : undefined}
    />
  );
}

const useStyles = makeStyles(() => ({
  row: {
    justifyContent: 'center',
    minHeight: sizes.touchTarget + spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  flush: {
    paddingHorizontal: 0,
    paddingStart: 0,
  },
}));
