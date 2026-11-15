import { useNavigation } from 'expo-router';
import { DrawerActions } from 'expo-router/react-navigation';
import { useTranslation } from 'react-i18next';
import { IconButton } from 'react-native-paper';

import { useAppTheme } from '@/theme/theme';

/** Header hamburger that opens the nearest parent drawer. */
export default function DrawerMenuButton() {
  const navigation = useNavigation();
  const theme = useAppTheme();
  const { t } = useTranslation();

  return (
    <IconButton
      accessibilityLabel={t('navigation.openMenu')}
      icon="menu"
      iconColor={theme.colors.onSurface}
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      size={24}
    />
  );
}
