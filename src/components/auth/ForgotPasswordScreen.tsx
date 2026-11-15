import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from 'react-native-paper';

import FormBanner from '@/components/ui/FormBanner';
import FormTextField from '@/components/ui/FormTextField';
import { routes } from '@/constants/routes';
import { emailFormSchema, type EmailFormValues } from '@/forms/schemas';
import { errorMessageKey } from '@/presenters/errors';
import { haptics } from '@/services/platform/haptics';
import { useServices } from '@/stores/AppEnvironmentContext';
import { makeStyles } from '@/theme/makeStyles';
import { sizes } from '@/theme/tokens';

import AuthLayout from './AuthLayout';

export default function ForgotPasswordScreen() {
  const { auth } = useServices();
  const { t } = useTranslation();
  const styles = useStyles();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: { email: '' },
  });

  const submit = handleSubmit(async ({ email }) => {
    setFormError(null);
    const result = await auth.requestPasswordReset({ email });

    if (!result.ok) {
      haptics.error();
      setFormError(t(errorMessageKey(result.error)));
      return;
    }

    haptics.success();
    setSentTo(email);
  });

  if (sentTo) {
    return (
      <AuthLayout
        icon="email-check-outline"
        subtitle={t('auth.forgot.successBody', { email: sentTo })}
        title={t('auth.forgot.successTitle')}
      >
        <Button
          contentStyle={styles.submitContent}
          mode="contained"
          onPress={() => router.back()}
        >
          {t('auth.forgot.backToSignIn')}
        </Button>
        <Button
          contentStyle={styles.submitContent}
          icon="key-outline"
          mode="text"
          onPress={() => router.push(routes.resetPassword)}
        >
          {t('auth.forgot.haveCode')}
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon="lock-reset"
      subtitle={t('auth.forgot.subtitle')}
      title={t('auth.forgot.title')}
    >
      <FormBanner message={formError} />
      <FormTextField
        autoCapitalize="none"
        autoComplete="email"
        control={control}
        inputMode="email"
        keyboardType="email-address"
        label={t('auth.email')}
        name="email"
        onSubmitEditing={() => void submit()}
        returnKeyType="send"
        textContentType="emailAddress"
      />
      <Button
        contentStyle={styles.submitContent}
        disabled={formState.isSubmitting}
        loading={formState.isSubmitting}
        mode="contained"
        onPress={() => void submit()}
      >
        {t('auth.forgot.submit')}
      </Button>
    </AuthLayout>
  );
}

const useStyles = makeStyles(() => ({
  submitContent: {
    minHeight: sizes.touchTarget + 4,
  },
}));
