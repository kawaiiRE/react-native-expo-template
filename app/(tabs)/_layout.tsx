import type { ComponentProps } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { appFonts, appPalette, appTheme } from '@/constants/theme';

const TAB_BAR_BASE_HEIGHT = 62;
const TAB_BAR_MIN_BOTTOM_PADDING = 10;

function TabBarIcon({
  color,
  name,
}: {
  color: ColorValue;
  name: ComponentProps<typeof MaterialCommunityIcons>['name'];
}) {
  return <MaterialCommunityIcons color={color} name={name} size={26} />;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM_PADDING);

  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: appTheme.colors.background,
        },
        headerTitleAlign: 'left',
        headerTitleStyle: {
          color: appTheme.colors.onSurface,
          fontFamily: appFonts.extraBold,
          fontSize: 23,
        },
        tabBarActiveTintColor: appTheme.colors.primary,
        tabBarInactiveTintColor: appTheme.colors.onSurfaceVariant,
        tabBarLabelStyle: {
          fontFamily: appFonts.semiBold,
          fontSize: 11,
        },
        tabBarStyle: {
          backgroundColor: appTheme.colors.surface,
          borderRadius: 8,
          borderTopColor: appTheme.colors.outline,
          borderTopWidth: 1,
          bottom: 0,
          elevation: 18,
          height: TAB_BAR_BASE_HEIGHT + bottomPadding,
          left: 12,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          position: 'absolute',
          right: 12,
          shadowColor: appPalette.shadow,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.12,
          shadowRadius: 18,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <TabBarIcon color={color} name="view-dashboard-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color }) => (
            <TabBarIcon color={color} name="format-list-checks" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <TabBarIcon color={color} name="cog-outline" />
          ),
        }}
      />
    </Tabs>
  );
}
