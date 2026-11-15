import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { TextInput as NativeTextInput } from 'react-native';
import { Button } from 'react-native-paper';

import { useSnackbar } from '@/components/feedback/SnackbarProvider';
import FormBanner from '@/components/ui/FormBanner';
import FormTextField from '@/components/ui/FormTextField';
import Screen from '@/components/ui/Screen';
import {
  changePasswordFormSchema,
  type ChangePasswordFormValues,
} from '@/forms/schemas';
import { applyServerFieldErrors } from '@/forms/serverErrors';
import { errorMessageKey, fieldErrorMessageKey } from '@/presenters/errors';
import { haptics } from '@/services/platform/haptics';
import { useServices, useSession } from '@/stores/AppEnvironmentContext';
import { makeStyles } from '@/theme/makeStyles';
import { sizes, spacing } from '@/theme/tokens';

export default function ChangePasswordScreen() {
  const session = useSession();
  const { account } = useServices();
  const snackbar = useSnackbar();
  const styles = useStyles();
  const { t } = useTranslation();
  const nextRef = useRef<NativeTextInput>(null);
  const confirmRef = useRef<NativeTextInput>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit, setError, formState } =
    useForm<ChangePasswordFormValues>({
      resolver: zodResolver(changePasswordFormSchema),
      defaultValues: { currentPassword: '', password: '', confirmPassword: '' },
    });

  const submit = handleSubmit(async ({ currentPassword, password }) => {
    setFormError(null);
    const result = await account.changePassword({ currentPassword, password });

    if (!result.ok) {
      haptics.error();
      if (result.error.code === 'INVALID_CREDENTIALS') {
        setError('currentPassword', {
          type: 'server',
          message: fieldErrorMessageKey('incorrect_password'),
        });
        return;
      }
      if (
        !applyServerFieldErrors(result.error, setError, [
          'currentPassword',
          'password',
        ])
      ) {
        setFormError(t(errorMessageKey(result.error)));
      }
      return;
    }

    haptics.success();
    if (result.data.signedOut) {
      await session.signOut('passwordChanged');
      return;
    }
    snackbar.show({ message: t('password.changed'), tone: 'success' });
    router.back();
  });

  return (
    <Screen gap={spacing.lg} keyboard safeBottom>
      <FormBanner message={t('password.hint')} tone="info" />
      <FormBanner message={formError} />
      <FormTextField
        autoComplete="current-password"
        control={control}
        label={t('password.current')}
        name="currentPassword"
        onSubmitEditing={() => nextRef.current?.focus()}
        password
        returnKeyType="next"
        submitBehavior="submit"
        textContentType="password"
      />
      <FormTextField
        autoComplete="new-password"
        control={control}
        hint={t('auth.register.passwordHint')}
        inputRef={nextRef}
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
        contentStyle={styles.buttonContent}
        disabled={formState.isSubmitting}
        loading={formState.isSubmitting}
        mode="contained"
        onPress={() => void submit()}
      >
        {t('password.submit')}
      </Button>
    </Screen>
  );
}

const useStyles = makeStyles(() => ({
  buttonContent: {
    minHeight: sizes.touchTarget,
  },
}));
