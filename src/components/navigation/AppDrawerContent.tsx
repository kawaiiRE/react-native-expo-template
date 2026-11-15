import {
  router,
  useGlobalSearchParams,
  usePathname,
  type Href,
} from 'expo-router';
import {
  DrawerContentScrollView,
  type DrawerContentComponentProps,
} from 'expo-router/drawer';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Drawer, Icon, Text, TouchableRipple } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GuestBanner from '@/components/ui/GuestBanner';
import SegmentedControl from '@/components/ui/SegmentedControl';
import UserAvatar from '@/components/ui/UserAvatar';
import { NOTES_FILTER_PARAM, routes } from '@/constants/routes';
import { useLanguageSwitcher } from '@/hooks/useLanguageSwitcher';
import { useSignOut } from '@/hooks/useSignOut';
import { languageNativeNames, SUPPORTED_LANGUAGES } from '@/i18n/languages';
import { presentIdentity } from '@/presenters/identity';
import { haptics } from '@/services/platform/haptics';
import { usePreferences, useSession } from '@/stores/AppEnvironmentContext';
import { THEME_ICONS } from '@/constants/preferences';
import {
  THEME_PREFERENCES,
  type ThemePreference,
} from '@/stores/PreferencesStore';
import { makeStyles } from '@/theme/makeStyles';
import { useAppTheme } from '@/theme/theme';
import { radii, sizes, spacing } from '@/theme/tokens';

type DrawerEntry = {
  key: string;
  label: string;
  icon: string;
  activeIcon: string;
  href: Href;
  isActive: boolean;
  /** Drawer destinations switch in place; other pages are pushed above it. */
  push?: boolean;
};

type AppDrawerContentProps = DrawerContentComponentProps & {
  permanent: boolean;
};

export default observer(function AppDrawerContent({
  permanent,
  ...props
}: AppDrawerContentProps) {
  const session = useSession();
  const preferences = usePreferences();
  const switchLanguage = useLanguageSwitcher();
  const signOut = useSignOut();
  const { t } = useTranslation();
  const theme = useAppTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const params = useGlobalSearchParams<{ [NOTES_FILTER_PARAM]?: string }>();
  const user = session.user;
  const identity = user ? presentIdentity(user) : null;
  const onNotes = pathname === routes.notes;
  const showingArchived = onNotes && params[NOTES_FILTER_PARAM] === 'archived';
  const language = preferences.effectiveLanguage;
  const otherLanguage =
    SUPPORTED_LANGUAGES.find((candidate) => candidate !== language) ?? language;

  const sections: { title: string; entries: DrawerEntry[] }[] = [
    {
      title: t('navigation.sections.workspace'),
      entries: [
        {
          key: 'home',
          label: t('navigation.home'),
          icon: 'home-outline',
          activeIcon: 'home',
          href: routes.home,
          isActive: pathname === routes.home,
        },
        {
          key: 'notes',
          label: t('navigation.notes'),
          icon: 'note-text-outline',
          activeIcon: 'note-text',
          href: routes.notes,
          isActive: onNotes && !showingArchived,
        },
        {
          key: 'archived',
          label: t('navigation.archived'),
          icon: 'archive-outline',
          activeIcon: 'archive',
          href: routes.archivedNotes,
          isActive: showingArchived,
        },
      ],
    },
    {
      title: t('navigation.sections.account'),
      entries: [
        ...(session.isGuest
          ? [
              {
                key: 'upgrade',
                label: t('navigation.upgrade'),
                icon: 'account-plus-outline',
                activeIcon: 'account-plus',
                href: routes.upgrade,
                isActive: pathname === routes.upgrade,
                push: true,
              },
            ]
          : [
              {
                key: 'profile',
                label: t('navigation.profile'),
                icon: 'account-edit-outline',
                activeIcon: 'account-edit',
                href: routes.profile,
                isActive: pathname === routes.profile,
                push: true,
              },
              {
                key: 'password',
                label: t('navigation.changePassword'),
                icon: 'lock-outline',
                activeIcon: 'lock',
                href: routes.changePassword,
                isActive: pathname === routes.changePassword,
                push: true,
              },
            ]),
        {
          key: 'settings',
          label: t('navigation.settings'),
          icon: 'cog-outline',
          activeIcon: 'cog',
          href: routes.settings,
          isActive: pathname === routes.settings,
        },
      ],
    },
    {
      title: t('navigation.sections.app'),
      entries: [
        {
          key: 'about',
          label: t('navigation.about'),
          icon: 'information-outline',
          activeIcon: 'information',
          href: routes.about,
          isActive: pathname === routes.about,
          push: true,
        },
      ],
    },
  ];

  function close() {
    if (!permanent) props.navigation.closeDrawer();
  }

  function open(entry: DrawerEntry) {
    close();
    if (entry.isActive) return;
    haptics.selection();
    if (entry.push) router.push(entry.href);
    else router.navigate(entry.href);
  }

  function openAccount() {
    close();
    router.push(session.isGuest ? routes.upgrade : routes.profile);
  }

  function changeTheme(mode: ThemePreference) {
    haptics.selection();
    preferences.setThemeMode(mode);
  }

  return (
    <View style={styles.root}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.lg },
        ]}
      >
        {user && identity ? (
          <View style={styles.header}>
            <TouchableRipple
              accessibilityHint={t('navigation.openAccount')}
              accessibilityRole="button"
              borderless
              onPress={openAccount}
              style={styles.identityRow}
            >
              <View style={styles.identityContent}>
                <UserAvatar
                  size={sizes.avatarMd}
                  user={{
                    name: identity.name ?? '',
                    email: identity.email ?? '',
                  }}
                />
                <View style={styles.identity}>
                  <Text
                    numberOfLines={2}
                    style={styles.name}
                    variant="titleMedium"
                  >
                    {identity.name ?? t('guest.name')}
                  </Text>
                  {identity.email ? (
                    <Text
                      ellipsizeMode="middle"
                      numberOfLines={1}
                      style={styles.email}
                      variant="bodyMedium"
                    >
                      {identity.email}
                    </Text>
                  ) : (
                    <View style={styles.guestBadge}>
                      <Icon
                        color={theme.colors.onTertiaryContainer}
                        size={sizes.iconSm}
                        source="account-clock-outline"
                      />
                      <Text style={styles.guestBadgeText} variant="labelMedium">
                        {t('guest.sessionLabel')}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableRipple>
            <GuestBanner onNavigate={close} />
          </View>
        ) : null}

        {sections.map((section) => (
          <Drawer.Section
            key={section.title}
            showDivider={false}
            style={styles.section}
          >
            <Text
              accessibilityRole="header"
              style={styles.sectionTitle}
              variant="titleSmall"
            >
              {section.title}
            </Text>
            {section.entries.map((entry) => (
              <Drawer.Item
                accessibilityLabel={entry.label}
                accessibilityState={{ selected: entry.isActive }}
                active={entry.isActive}
                icon={entry.isActive ? entry.activeIcon : entry.icon}
                key={entry.key}
                label={entry.label}
                onPress={() => open(entry)}
                style={styles.item}
              />
            ))}
          </Drawer.Section>
        ))}
      </DrawerContentScrollView>

      <View
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}
      >
        <SegmentedControl
          options={THEME_PREFERENCES.map((mode) => ({
            value: mode,
            icon: THEME_ICONS[mode],
            accessibilityLabel: t('navigation.themeOption', {
              theme: t(`settings.theme.${mode}`),
            }),
            style: styles.themeButton,
          }))}
          density="small"
          onValueChange={changeTheme}
          style={styles.themeSwitch}
          value={preferences.themeMode}
        />
        <Drawer.Item
          accessibilityHint={t('navigation.switchLanguageHint')}
          accessibilityLabel={t('navigation.switchLanguage', {
            language: languageNativeNames[otherLanguage],
          })}
          icon="translate"
          label={t('navigation.language')}
          onPress={() => void switchLanguage(otherLanguage)}
          right={({ color }) => (
            <Text style={{ color }} variant="labelLarge">
              {languageNativeNames[otherLanguage]}
            </Text>
          )}
          style={styles.item}
        />
        <Drawer.Item
          accessibilityLabel={t('navigation.signOut')}
          icon="logout"
          label={t('navigation.signOut')}
          onPress={() => {
            close();
            void signOut();
          }}
          style={styles.item}
        />
      </View>
    </View>
  );
});

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.colors.surface,
    flex: 1,
  },
  scrollContent: {
    paddingEnd: 0,
    paddingStart: 0,
  },
  header: {
    gap: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  identityRow: {
    borderRadius: sizes.touchTarget / 2,
  },
  identityContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.sm,
  },
  identity: {
    alignItems: 'flex-start',
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0,
  },
  name: {
    color: theme.colors.onSurface,
    fontFamily: theme.fontFamilies.semiBold,
  },
  email: {
    color: theme.colors.onSurfaceVariant,
    maxWidth: '100%',
  },
  guestBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.tertiaryContainer,
    borderRadius: radii.sm,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  guestBadgeText: {
    color: theme.colors.onTertiaryContainer,
  },
  section: {
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    alignSelf: 'flex-start',
    color: theme.colors.onSurfaceVariant,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.xxl + spacing.xs,
    paddingTop: spacing.md,
  },
  item: {
    justifyContent: 'center',
    minHeight: sizes.touchTarget + 8,
  },
  footer: {
    borderTopColor: theme.colors.outlineVariant,
    borderTopWidth: sizes.borderHairline,
    gap: spacing.xs,
    paddingTop: spacing.md,
  },
  themeSwitch: {
    marginHorizontal: spacing.lg + spacing.xs,
  },
  themeButton: {
    minWidth: 0,
  },
}));
