import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button, HelperText, TextInput } from 'react-native-paper';
import { View } from 'react-native';

import { useSnackbar } from '@/components/feedback/SnackbarProvider';
import FormBanner from '@/components/ui/FormBanner';
import FormTextField from '@/components/ui/FormTextField';
import Screen from '@/components/ui/Screen';
import {
  NAME_MAX,
  profileFormSchema,
  type ProfileFormValues,
} from '@/forms/schemas';
import { applyServerFieldErrors } from '@/forms/serverErrors';
import { errorMessageKey } from '@/presenters/errors';
import { haptics } from '@/services/platform/haptics';
import { useServices, useSession } from '@/stores/AppEnvironmentContext';
import { makeStyles } from '@/theme/makeStyles';
import { sizes, spacing } from '@/theme/tokens';

export default observer(function ProfileScreen() {
  const session = useSession();
  const { account } = useServices();
  const snackbar = useSnackbar();
  const styles = useStyles();
  const { t } = useTranslation();
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit, setError, formState } =
    useForm<ProfileFormValues>({
      resolver: zodResolver(profileFormSchema),
      defaultValues: { name: session.user?.name ?? '' },
    });

  const submit = handleSubmit(async ({ name }) => {
    setFormError(null);
    const result = await account.updateProfile({ name });

    if (!result.ok) {
      haptics.error();
      if (!applyServerFieldErrors(result.error, setError, ['name'])) {
        setFormError(t(errorMessageKey(result.error)));
      }
      return;
    }

    await session.updateUser(result.data);
    snackbar.show({
      message: t('profile.saved'),
      tone: 'success',
      haptic: true,
    });
    router.back();
  });

  return (
    <Screen gap={spacing.lg} keyboard safeBottom>
      <FormBanner message={formError} />
      <FormTextField
        autoCapitalize="words"
        autoComplete="name"
        control={control}
        label={t('profile.name')}
        maxLength={NAME_MAX}
        name="name"
        onSubmitEditing={() => void submit()}
        returnKeyType="done"
        textContentType="name"
      />
      <View>
        <TextInput
          disabled
          label={t('profile.email')}
          mode="outlined"
          style={styles.readonly}
          value={session.user?.email ?? ''}
        />
        <HelperText style={styles.helper} type="info" visible>
          {t('profile.emailHint')}
        </HelperText>
      </View>
      <Button
        contentStyle={styles.buttonContent}
        disabled={formState.isSubmitting || !formState.isDirty}
        loading={formState.isSubmitting}
        mode="contained"
        onPress={() => void submit()}
      >
        {t('common.save')}
      </Button>
    </Screen>
  );
});

const useStyles = makeStyles((theme) => ({
  readonly: {
    backgroundColor: theme.colors.background,
  },
  helper: {
    paddingHorizontal: 0,
  },
  buttonContent: {
    minHeight: sizes.touchTarget,
  },
}));
