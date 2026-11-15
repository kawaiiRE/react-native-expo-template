import { useTranslation } from 'react-i18next';
import { Avatar } from 'react-native-paper';

import type { User } from '@/models/user';
import { getDisplayName, getInitials } from '@/presenters/user';
import { makeStyles } from '@/theme/makeStyles';
import { useAppTheme } from '@/theme/theme';
import { sizes } from '@/theme/tokens';

type UserAvatarProps = {
  user: Pick<User, 'name' | 'email'>;
  size?: number;
};

export default function UserAvatar({
  size = sizes.avatarMd,
  user,
}: UserAvatarProps) {
  const theme = useAppTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const initials = getInitials(user.name, user.email);
  const label = t('a11y.avatar', { name: getDisplayName(user) });

  if (!initials) {
    return (
      <Avatar.Icon
        accessibilityLabel={label}
        color={theme.colors.onPrimaryContainer}
        icon="account"
        size={size}
        style={styles.avatar}
      />
    );
  }

  return (
    <Avatar.Text
      accessibilityLabel={label}
      color={theme.colors.onPrimaryContainer}
      label={initials}
      labelStyle={{
        fontFamily: theme.fontFamilies.semiBold,
        fontSize: Math.round(size * 0.38),
      }}
      size={size}
      style={styles.avatar}
    />
  );
}

const useStyles = makeStyles((theme) => ({
  avatar: {
    backgroundColor: theme.colors.primaryContainer,
    flexShrink: 0,
  },
}));
