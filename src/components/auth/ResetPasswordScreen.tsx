import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { TextInput as NativeTextInput } from 'react-native';
import { Button } from 'react-native-paper';

import FormBanner from '@/components/ui/FormBanner';
import FormTextField from '@/components/ui/FormTextField';
import { routes } from '@/constants/routes';
import {
  resetPasswordFormSchema,
  type ResetPasswordFormValues,
} from '@/forms/schemas';
import { applyServerFieldErrors } from '@/forms/serverErrors';
import { errorMessageKey } from '@/presenters/errors';
import { haptics } from '@/services/platform/haptics';
import { useServices, useSession } from '@/stores/AppEnvironmentContext';
import { makeStyles } from '@/theme/makeStyles';
import { sizes } from '@/theme/tokens';

import AuthLayout from './AuthLayout';

/**
 * Completes a password reset. Opened from the emailed link
 * (`/reset-password?token=…`) or manually with a pasted token.
 */
export default observer(function ResetPasswordScreen() {
  const { token: linkToken } = useLocalSearchParams<{ token?: string }>();
  const { auth } = useServices();
  const session = useSession();
  const { t } = useTranslation();
  const styles = useStyles();
  const passwordRef = useRef<NativeTextInput>(null);
  const confirmRef = useRef<NativeTextInput>(null);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(!linkToken);
  const { control, handleSubmit, setError, formState } =
    useForm<ResetPasswordFormValues>({
      resolver: zodResolver(resetPasswordFormSchema),
      defaultValues: {
        token: linkToken ?? '',
        password: '',
        confirmPassword: '',
      },
    });

  const submit = handleSubmit(async ({ token, password }) => {
    setFormError(null);
    const result = await auth.resetPassword({ token, password });

    if (!result.ok) {
      haptics.error();
      if (result.error.fields?.token && !showToken) {
        setShowToken(true);
        setFormError(t('auth.reset.linkInvalid'));
      }
      if (
        !applyServerFieldErrors(result.error, setError, ['token', 'password'])
      ) {
        setFormError(t(errorMessageKey(result.error)));
      }
      return;
    }

    haptics.success();
    // Resetting the password revokes every session of the account.
    if (session.isSignedIn) await session.signOut('passwordChanged');
    setDone(true);
  });

  if (done) {
    return (
      <AuthLayout
        icon="lock-check-outline"
        subtitle={t('auth.reset.successBody')}
        title={t('auth.reset.successTitle')}
      >
        <Button
          contentStyle={styles.submitContent}
          mode="contained"
          onPress={() => router.replace(routes.login)}
        >
          {t('auth.reset.signIn')}
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon="lock-reset"
      subtitle={
        showToken ? t('auth.reset.subtitleManual') : t('auth.reset.subtitle')
      }
      title={t('auth.reset.title')}
    >
      <FormBanner message={formError} />
      {showToken ? (
        <FormTextField
          autoCapitalize="none"
          autoCorrect={false}
          control={control}
          label={t('auth.reset.token')}
          name="token"
          onSubmitEditing={() => passwordRef.current?.focus()}
          returnKeyType="next"
          submitBehavior="submit"
        />
      ) : null}
      <FormTextField
        autoComplete="new-password"
        control={control}
        hint={t('auth.register.passwordHint')}
        inputRef={passwordRef}
        label={t('password.next')}
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
        label={t('password.confirm')}
        name="confirmPassword"
        onSubmitEditing={() => void submit()}
        password
        returnKeyType="go"
        textContentType="newPassword"
      />
      <Button
        contentStyle={styles.submitContent}
        disabled={formState.isSubmitting}
        loading={formState.isSubmitting}
        mode="contained"
        onPress={() => void submit()}
      >
        {t('auth.reset.submit')}
      </Button>
    </AuthLayout>
  );
});

const useStyles = makeStyles(() => ({
  submitContent: {
    minHeight: sizes.touchTarget + 4,
  },
}));
