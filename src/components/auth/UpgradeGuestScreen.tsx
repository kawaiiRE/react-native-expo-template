import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { TextInput as NativeTextInput } from 'react-native';
import { Button } from 'react-native-paper';

import { useSnackbar } from '@/components/feedback/SnackbarProvider';
import FormBanner from '@/components/ui/FormBanner';
import FormTextField from '@/components/ui/FormTextField';
import Screen from '@/components/ui/Screen';
import { routes } from '@/constants/routes';
import { registerFormSchema, type RegisterFormValues } from '@/forms/schemas';
import { applyServerFieldErrors } from '@/forms/serverErrors';
import { errorMessageKey } from '@/presenters/errors';
import { haptics } from '@/services/platform/haptics';
import { usePreferences, useSession } from '@/stores/AppEnvironmentContext';
import { makeStyles } from '@/theme/makeStyles';
import { sizes, spacing } from '@/theme/tokens';

/** Turns the current guest session into a registered account; notes are kept. */
export default observer(function UpgradeGuestScreen() {
  const session = useSession();
  const preferences = usePreferences();
  const snackbar = useSnackbar();
  const { t } = useTranslation();
  const styles = useStyles();
  const emailRef = useRef<NativeTextInput>(null);
  const passwordRef = useRef<NativeTextInput>(null);
  const confirmRef = useRef<NativeTextInput>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit, setError, formState } =
    useForm<RegisterFormValues>({
      resolver: zodResolver(registerFormSchema),
      defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    });

  const submit = handleSubmit(async ({ name, email, password }) => {
    setFormError(null);
    const result = await session.upgradeGuest({
      name,
      email,
      password,
      locale: preferences.effectiveLanguage,
    });

    if (!result.ok) {
      haptics.error();
      if (
        !applyServerFieldErrors(result.error, setError, [
          'name',
          'email',
          'password',
        ])
      ) {
        setFormError(t(errorMessageKey(result.error)));
      }
      return;
    }

    haptics.success();
    if (result.data.status === 'verification_required') {
      router.replace(routes.verifyEmail(result.data.email));
      return;
    }
    snackbar.show({ message: t('guest.upgraded'), tone: 'success' });
    router.back();
  });

  return (
    <Screen gap={spacing.lg} keyboard safeBottom>
      <FormBanner message={t('guest.upgradeIntro')} tone="info" />
      <FormBanner message={formError} />
      <FormTextField
        autoCapitalize="words"
        autoComplete="name"
        control={control}
        label={t('auth.name')}
        name="name"
        onSubmitEditing={() => emailRef.current?.focus()}
        returnKeyType="next"
        submitBehavior="submit"
        textContentType="name"
      />
      <FormTextField
        autoCapitalize="none"
        autoComplete="email"
        control={control}
        inputMode="email"
        inputRef={emailRef}
        keyboardType="email-address"
        label={t('auth.email')}
        name="email"
        onSubmitEditing={() => passwordRef.current?.focus()}
        returnKeyType="next"
        submitBehavior="submit"
        textContentType="emailAddress"
      />
      <FormTextField
        autoComplete="new-password"
        control={control}
        hint={t('auth.register.passwordHint')}
        inputRef={passwordRef}
        label={t('auth.password')}
        name="password"
        onSubmitEditing={() => confirmRef.current?.focus()}
        password
        returnKeyType="next"
        submitBehavior="submit"
        textContentType="newPassword"
      />
      <FormTextField
        autoComplete="new-password"
        control={control}
        inputRef={confirmRef}
        label={t('auth.confirmPassword')}
        name="confirmPassword"
        onSubmitEditing={() => void submit()}
        password
        returnKeyType="go"
        textContentType="newPassword"
      />
      <Button
        contentStyle={styles.buttonContent}
        disabled={formState.isSubmitting}
        loading={formState.isSubmitting}
        mode="contained"
        onPress={() => void submit()}
      >
        {t('guest.upgradeSubmit')}
      </Button>
    </Screen>
  );
});

const useStyles = makeStyles(() => ({
  buttonContent: {
    minHeight: sizes.touchTarget,
  },
}));
