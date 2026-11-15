import { router } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Button, Chip, Divider, Text } from 'react-native-paper';

import Screen from '@/components/ui/Screen';
import SectionCard from '@/components/ui/SectionCard';
import SegmentedControl from '@/components/ui/SegmentedControl';
import GuestBanner from '@/components/ui/GuestBanner';
import UserAvatar from '@/components/ui/UserAvatar';
import { THEME_ICONS } from '@/constants/preferences';
import { routes } from '@/constants/routes';
import { useSignOut } from '@/hooks/useSignOut';
import { languageNativeNames } from '@/i18n/languages';
import { presentIdentity } from '@/presenters/identity';
import { haptics } from '@/services/platform/haptics';
import { usePreferences, useSession } from '@/stores/AppEnvironmentContext';
import { THEME_PREFERENCES } from '@/stores/PreferencesStore';
import { makeStyles } from '@/theme/makeStyles';
import { useAppTheme } from '@/theme/theme';
import { sizes, spacing } from '@/theme/tokens';

import SettingsRow from './SettingsRow';

export default observer(function SettingsScreen() {
  const session = useSession();
  const preferences = usePreferences();
  const signOut = useSignOut();
  const theme = useAppTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const user = session.user;
  const identity = user ? presentIdentity(user) : null;
  const guest = session.isGuest;

  return (
    <Screen>
      {user && identity ? (
        <SectionCard title={t('settings.sections.profile')}>
          <View style={styles.profile}>
            <UserAvatar
              size={sizes.avatarLg - 8}
              user={{ ...user, name: identity.name ?? '' }}
            />
            <View style={styles.identity}>
              <Text numberOfLines={2} style={styles.name} variant="titleLarge">
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
              ) : null}
              <Chip
                compact
                icon={
                  guest
                    ? 'account-clock-outline'
                    : user.verified
                      ? 'check-decagram'
                      : 'alert-circle-outline'
                }
                mode="flat"
                selectedColor={
                  guest
                    ? theme.colors.onTertiaryContainer
                    : user.verified
                      ? theme.colors.onSuccessContainer
                      : theme.colors.onWarningContainer
                }
                style={
                  guest
                    ? styles.guest
                    : user.verified
                      ? styles.verified
                      : styles.unverified
                }
              >
                {guest
                  ? t('guest.sessionLabel')
                  : user.verified
                    ? t('settings.verified')
                    : t('settings.unverified')}
              </Chip>
            </View>
          </View>
          {guest ? (
            <GuestBanner />
          ) : (
            <Button
              contentStyle={styles.buttonContent}
              icon="account-edit-outline"
              mode="contained-tonal"
              onPress={() => router.push(routes.profile)}
            >
              {t('settings.editProfile')}
            </Button>
          )}
        </SectionCard>
      ) : null}

      <SectionCard title={t('settings.sections.preferences')}>
        <Text style={styles.label} variant="labelLarge">
          {t('settings.theme.label')}
        </Text>
        <SegmentedControl
          options={THEME_PREFERENCES.map((mode) => ({
            value: mode,
            label: t(`settings.theme.${mode}`),
            icon: THEME_ICONS[mode],
            style: styles.segment,
            labelStyle: styles.segmentLabel,
          }))}
          onValueChange={(mode) => {
            haptics.selection();
            preferences.setThemeMode(mode);
          }}
          value={preferences.themeMode}
        />
        <Divider style={styles.divider} />
        <SettingsRow
          description={
            preferences.language
              ? languageNativeNames[preferences.language]
              : t('settings.languageDevice')
          }
          icon="translate"
          onPress={() => router.push(routes.language)}
          title={t('settings.language')}
          flush
        />
      </SectionCard>

      {guest ? null : (
        <SectionCard flush title={t('settings.sections.security')}>
          <SettingsRow
            icon="lock-reset"
            onPress={() => router.push(routes.changePassword)}
            title={t('settings.changePassword')}
          />
        </SectionCard>
      )}

      <SectionCard flush title={t('settings.sections.about')}>
        <SettingsRow
          icon="information-outline"
          onPress={() => router.push(routes.about)}
          title={t('settings.about')}
        />
      </SectionCard>

      <SectionCard flush title={t('settings.sections.danger')}>
        <SettingsRow
          color={theme.colors.error}
          icon={guest ? 'account-cancel-outline' : 'account-remove-outline'}
          onPress={() => router.push(routes.deleteAccount)}
          title={guest ? t('settings.endGuest') : t('settings.deleteAccount')}
        />
      </SectionCard>

      <Button
        contentStyle={styles.buttonContent}
        icon="logout"
        mode="outlined"
        onPress={() => void signOut()}
      >
        {t('settings.signOut')}
      </Button>
    </Screen>
  );
});

const useStyles = makeStyles((theme) => ({
  profile: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.lg,
  },
  identity: {
    alignItems: 'flex-start',
    flex: 1,
    gap: spacing.xs,
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
  verified: {
    backgroundColor: theme.colors.successContainer,
  },
  unverified: {
    backgroundColor: theme.colors.warningContainer,
  },
  guest: {
    backgroundColor: theme.colors.tertiaryContainer,
  },
  label: {
    color: theme.colors.onSurfaceVariant,
  },
  segment: {
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
  },
  segmentLabel: {
    fontFamily: theme.fontFamilies.medium,
  },
  divider: {
    marginVertical: spacing.xs,
  },
  buttonContent: {
    minHeight: sizes.touchTarget,
  },
}));
