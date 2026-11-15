import { Drawer } from 'expo-router/drawer';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { useWindowClass } from '@/hooks/useWindowClass';
import { isRtlLayout } from '@/services/platform/layoutDirection';
import { useAppTheme } from '@/theme/theme';
import { sizes } from '@/theme/tokens';

import AppDrawerContent from './AppDrawerContent';
import DrawerMenuButton from './DrawerMenuButton';

/**
 * Primary navigation. A modal drawer (edge swipe or menu button) on phones,
 * a permanent side drawer on expanded windows. React Navigation places it on
 * the leading edge from the direction supplied by `ThemedProviders`.
 */
export default function DrawerNavigator() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const permanent = useWindowClass() === 'expanded';
  // On the web a permanent drawer is placed by DOM order, which the RTL
  // document direction already mirrors; `left` keeps it on the leading edge.
  const mirroredByDocument =
    permanent && Platform.OS === 'web' && isRtlLayout(theme.language);

  return (
    <Drawer
      drawerContent={(props) => (
        <AppDrawerContent {...props} permanent={permanent} />
      )}
      screenOptions={{
        ...(mirroredByDocument ? { drawerPosition: 'left' as const } : {}),
        drawerStyle: {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
          width: sizes.drawerWidth,
        },
        drawerType: permanent ? 'permanent' : 'front',
        headerLeft: permanent ? () => null : () => <DrawerMenuButton />,
        // React Navigation adds a trailing toggle for right-side drawers (RTL).
        headerRight: () => null,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          color: theme.colors.onSurface,
          fontFamily: theme.fontFamilies.semiBold,
        },
        overlayColor: theme.colors.backdrop,
        sceneStyle: { backgroundColor: theme.colors.background },
        swipeEdgeWidth: sizes.touchTarget,
        swipeEnabled: !permanent,
      }}
    >
      <Drawer.Screen name="index" options={{ title: t('navigation.home') }} />
      <Drawer.Screen name="notes" options={{ title: t('navigation.notes') }} />
      <Drawer.Screen
        name="settings"
        options={{ title: t('navigation.settings') }}
      />
    </Drawer>
  );
}
