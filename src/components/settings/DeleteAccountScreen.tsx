import { Stack } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Button, Icon, Text, TextInput } from 'react-native-paper';

import { useConfirm } from '@/components/feedback/ConfirmProvider';
import FormBanner from '@/components/ui/FormBanner';
import Screen from '@/components/ui/Screen';
import { errorMessageKey, fieldErrorMessageKey } from '@/presenters/errors';
import { haptics } from '@/services/platform/haptics';
import { useServices, useSession } from '@/stores/AppEnvironmentContext';
import { makeStyles } from '@/theme/makeStyles';
import { useAppTheme } from '@/theme/theme';
import { radii, sizes, spacing } from '@/theme/tokens';

/**
 * In-app account deletion (required by the App Store and Google Play). For
 * guests the same flow ends the guest session and deletes its data.
 */
export default observer(function DeleteAccountScreen() {
  const session = useSession();
  const { account, auth } = useServices();
  const confirm = useConfirm();
  const theme = useAppTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const guest = session.isGuest;
  const copy = guest ? 'endGuest' : 'deleteAccount';
  const needsPassword =
    !guest && auth.capabilities.deleteAccountRequiresPassword;
  const [typed, setTyped] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const word = t('deleteAccount.confirmWord');
  const matches = typed.trim().toLocaleUpperCase() === word.toLocaleUpperCase();
  const ready = matches && (!needsPassword || password.length > 0);

  async function deleteAccount() {
    const user = session.user;
    if (!user) return;

    const confirmed = await confirm({
      title: t(`${copy}.dialogTitle`),
      message: t(`${copy}.dialogBody`),
      confirmLabel: t(`${copy}.dialogConfirm`),
      destructive: true,
    });
    if (!confirmed) return;

    setBusy(true);
    setFormError(null);
    const result = await account.deleteAccount(
      user,
      needsPassword ? { password } : {},
    );
    setBusy(false);

    if (!result.ok) {
      haptics.error();
      const passwordCode = result.error.fields?.currentPassword;
      setFormError(
        passwordCode
          ? t(fieldErrorMessageKey(passwordCode))
          : t(errorMessageKey(result.error)),
      );
      return;
    }

    haptics.success();
    await session.signOut(guest ? 'guestEnded' : 'accountDeleted');
  }

  return (
    <Screen gap={spacing.lg} keyboard safeBottom>
      <Stack.Screen
        options={{
          title: guest
            ? t('navigation.endGuest')
            : t('navigation.deleteAccount'),
        }}
      />
      <View style={styles.hero}>
        <View style={styles.iconFrame}>
          <Icon
            color={theme.colors.onErrorContainer}
            size={sizes.iconLg}
            source={guest ? 'account-cancel-outline' : 'account-remove-outline'}
          />
        </View>
        <Text
          accessibilityRole="header"
          style={styles.title}
          variant="headlineSmall"
        >
          {t(`${copy}.title`)}
        </Text>
        <Text style={styles.body} variant="bodyLarge">
          {t(`${copy}.body`)}
        </Text>
      </View>

      <FormBanner message={formError} />

      {needsPassword ? (
        <TextInput
          autoComplete="current-password"
          label={t('deleteAccount.password')}
          mode="outlined"
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          textContentType="password"
          value={password}
        />
      ) : null}

      <TextInput
        autoCapitalize="characters"
        autoCorrect={false}
        label={t('deleteAccount.confirmLabel', { word })}
        mode="outlined"
        onChangeText={setTyped}
        style={styles.input}
        value={typed}
      />

      <Button
        buttonColor={theme.colors.error}
        contentStyle={styles.buttonContent}
        disabled={!ready || busy}
        icon="delete-forever-outline"
        loading={busy}
        mode="contained"
        onPress={() => void deleteAccount()}
        textColor={theme.colors.onError}
      >
        {t(`${copy}.submit`)}
      </Button>
    </Screen>
  );
});

const useStyles = makeStyles((theme) => ({
  hero: {
    gap: spacing.sm,
  },
  iconFrame: {
    alignItems: 'center',
    backgroundColor: theme.colors.errorContainer,
    borderRadius: radii.lg,
    height: 64,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 64,
  },
  title: {
    color: theme.colors.onBackground,
    fontFamily: theme.fontFamilies.semiBold,
  },
  body: {
    color: theme.colors.onSurfaceVariant,
  },
  input: {
    backgroundColor: theme.colors.background,
  },
  buttonContent: {
    minHeight: sizes.touchTarget,
  },
}));
