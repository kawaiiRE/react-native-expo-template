import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation, router } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useLayoutEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { TextInput as NativeTextInput } from 'react-native';
import { Button, HelperText, IconButton } from 'react-native-paper';

import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { useSnackbar } from '@/components/feedback/SnackbarProvider';
import FormBanner from '@/components/ui/FormBanner';
import FormTextField from '@/components/ui/FormTextField';
import Screen from '@/components/ui/Screen';
import { NOTE_BODY_MAX, NOTE_TITLE_MAX, type Note } from '@/models/note';
import { noteFormSchema, type NoteFormValues } from '@/forms/schemas';
import { applyServerFieldErrors } from '@/forms/serverErrors';
import { errorMessageKey } from '@/presenters/errors';
import { formatNumber } from '@/presenters/format';
import type { AppResult } from '@/models/errors';
import { haptics } from '@/services/platform/haptics';
import { makeStyles } from '@/theme/makeStyles';
import { useAppTheme } from '@/theme/theme';
import { spacing } from '@/theme/tokens';

type NoteFormProps = {
  initialValues: NoteFormValues;
  successMessage: string;
  onSubmit: (values: NoteFormValues) => Promise<AppResult<Note>>;
};

/** Create/edit form with header actions, server errors and a discard guard. */
export default function NoteForm({
  initialValues,
  onSubmit,
  successMessage,
}: NoteFormProps) {
  const navigation = useNavigation();
  const theme = useAppTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const confirm = useConfirm();
  const snackbar = useSnackbar();
  const bodyRef = useRef<NativeTextInput>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const { control, handleSubmit, setError, formState } =
    useForm<NoteFormValues>({
      resolver: zodResolver(noteFormSchema),
      defaultValues: initialValues,
    });
  const body = useWatch({ control, name: 'body' }) ?? '';
  const isSubmitting = formState.isSubmitting;

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await onSubmit({
      title: values.title.trim(),
      body: values.body,
    });

    if (!result.ok) {
      haptics.error();
      if (!applyServerFieldErrors(result.error, setError, ['title', 'body'])) {
        setFormError(t(errorMessageKey(result.error)));
      }
      return;
    }

    setSaved(true);
    snackbar.show({ message: successMessage, tone: 'success', haptic: true });
    router.back();
  });

  usePreventRemove(formState.isDirty && !saved && !isSubmitting, ({ data }) => {
    void confirm({
      title: t('notes.discard.title'),
      message: t('notes.discard.body'),
      confirmLabel: t('notes.discard.confirm'),
      cancelLabel: t('notes.discard.keep'),
      destructive: true,
    }).then((discard) => {
      if (discard) navigation.dispatch(data.action);
    });
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <IconButton
          accessibilityLabel={t('common.close')}
          icon="close"
          iconColor={theme.colors.onSurface}
          onPress={() => router.back()}
        />
      ),
      headerRight: () => (
        <Button
          disabled={isSubmitting}
          loading={isSubmitting}
          mode="text"
          onPress={() => void submit()}
        >
          {t('common.save')}
        </Button>
      ),
    });
  }, [isSubmitting, navigation, submit, t, theme]);

  return (
    <Screen gap={spacing.lg} keyboard safeBottom>
      <FormBanner message={formError} />
      <FormTextField
        autoCapitalize="sentences"
        autoFocus={!initialValues.title}
        control={control}
        label={t('notes.form.title')}
        maxLength={NOTE_TITLE_MAX}
        name="title"
        onSubmitEditing={() => bodyRef.current?.focus()}
        returnKeyType="next"
        submitBehavior="submit"
      />
      <FormTextField
        control={control}
        inputRef={bodyRef}
        label={t('notes.form.body')}
        maxLength={NOTE_BODY_MAX}
        multiline
        name="body"
        placeholder={t('notes.form.bodyPlaceholder')}
        style={styles.body}
        textAlignVertical="top"
      />
      <HelperText style={styles.counter} type="info" visible>
        {t('notes.form.characters', {
          current: formatNumber(body.length, theme.language),
          max: formatNumber(NOTE_BODY_MAX, theme.language),
        })}
      </HelperText>
    </Screen>
  );
}

const useStyles = makeStyles((theme) => ({
  body: {
    backgroundColor: theme.colors.background,
    minHeight: 220,
  },
  counter: {
    alignSelf: 'flex-end',
    marginTop: -spacing.md,
  },
}));
