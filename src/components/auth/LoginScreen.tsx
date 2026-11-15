import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { TextInput as NativeTextInput } from 'react-native';
import { Button, Text } from 'react-native-paper';

import FormBanner from '@/components/ui/FormBanner';
import FormTextField from '@/components/ui/FormTextField';
import { routes } from '@/constants/routes';
import { loginFormSchema, type LoginFormValues } from '@/forms/schemas';
import { applyServerFieldErrors } from '@/forms/serverErrors';
import { errorMessageKey } from '@/presenters/errors';
import { haptics } from '@/services/platform/haptics';
import { useSession } from '@/stores/AppEnvironmentContext';
import { makeStyles } from '@/theme/makeStyles';
import { sizes } from '@/theme/tokens';

import AuthLayout from './AuthLayout';
import GuestSessionButton from './GuestSessionButton';

export default observer(function LoginScreen() {
  const session = useSession();
  const { t } = useTranslation();
  const styles = useStyles();
  const passwordRef = useRef<NativeTextInput>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit, setError, formState } =
    useForm<LoginFormValues>({
      resolver: zodResolver(loginFormSchema),
      defaultValues: { email: '', password: '' },
    });
  const notice = session.signOutNotice;

  useEffect(() => {
    if (!session.features) void session.loadFeatures();
  }, [session]);

  useEffect(() => {
    if (notice !== 'emailNotVerified') return;
    const email = session.pendingVerificationEmail ?? undefined;
    session.dismissNotice();
    router.push(routes.verifyEmail(email));
  }, [notice, session]);

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    session.dismissNotice();
    const result = await session.signIn(values);

    if (result.ok) return;

    haptics.error();

    if (result.error.code === 'EMAIL_NOT_VERIFIED') {
      router.push(routes.verifyEmail(values.email));
      return;
    }

    if (
      !applyServerFieldErrors(result.error, setError, ['email', 'password'])
    ) {
      setFormError(t(errorMessageKey(result.error)));
    }
  });

  return (
    <AuthLayout
      footer={
        session.registrationEnabled ? (
          <>
            <Text style={styles.muted} variant="bodyMedium">
              {t('auth.login.noAccount')}
            </Text>
            <Link asChild href={routes.register}>
              <Button compact mode="text">
                {t('auth.login.createAccount')}
              </Button>
            </Link>
          </>
        ) : null
      }
      headerless
      icon="note-text-outline"
      subtitle={t('auth.login.subtitle')}
      title={t('auth.login.title')}
    >
      {notice && notice !== 'emailNotVerified' ? (
        <FormBanner message={t(`auth.notices.${notice}`)} tone="info" />
      ) : null}
      <FormBanner message={formError} />

      <FormTextField
        autoCapitalize="none"
        autoComplete="email"
        control={control}
        inputMode="email"
        keyboardType="email-address"
        label={t('auth.email')}
        name="email"
        onSubmitEditing={() => passwordRef.current?.focus()}
        returnKeyType="next"
        submitBehavior="submit"
        textContentType="emailAddress"
      />
      <FormTextField
        autoComplete="current-password"
        control={control}
        inputRef={passwordRef}
        label={t('auth.password')}
        name="password"
        onSubmitEditing={() => void submit()}
        password
        returnKeyType="go"
        textContentType="password"
      />

      <Link asChild href={routes.forgotPassword}>
        <Button compact mode="text" style={styles.forgot}>
          {t('auth.login.forgotPassword')}
        </Button>
      </Link>

      <Button
        contentStyle={styles.submitContent}
        disabled={formState.isSubmitting}
        loading={formState.isSubmitting}
        mode="contained"
        onPress={() => void submit()}
      >
        {t('auth.login.submit')}
      </Button>
      <GuestSessionButton />
    </AuthLayout>
  );
});

const useStyles = makeStyles((theme) => ({
  muted: {
    color: theme.colors.onSurfaceVariant,
  },
  forgot: {
    alignSelf: 'flex-end',
  },
  submitContent: {
    minHeight: sizes.touchTarget + 4,
  },
}));
