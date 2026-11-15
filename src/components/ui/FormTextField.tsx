import { useState, type Ref } from 'react';
import {
  useController,
  type Control,
  type FieldValues,
  type Path,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View, type TextInput as NativeTextInput } from 'react-native';
import { HelperText, TextInput, type TextInputProps } from 'react-native-paper';

import type { ValidationMessageKey } from '@/forms/schemas';
import type { FieldErrorMessageKey } from '@/presenters/errors';
import { makeStyles } from '@/theme/makeStyles';

type FormMessageKey = ValidationMessageKey | FieldErrorMessageKey;

type FormTextFieldProps<T extends FieldValues> = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'onBlur' | 'error' | 'secureTextEntry' | 'label'
> & {
  control: Control<T>;
  name: Path<T>;
  label: string;
  hint?: string;
  password?: boolean;
  inputRef?: Ref<NativeTextInput>;
};

export default function FormTextField<T extends FieldValues>({
  autoCapitalize,
  autoCorrect,
  control,
  hint,
  inputRef,
  label,
  name,
  password = false,
  right,
  ...inputProps
}: FormTextFieldProps<T>) {
  const { t } = useTranslation();
  const styles = useStyles();
  const [revealed, setRevealed] = useState(false);
  const { field, fieldState } = useController({ control, name });
  const messageKey = fieldState.error?.message as FormMessageKey | undefined;
  // Client rules and backend field codes both resolve to translation keys.
  const message = messageKey ? t(messageKey) : undefined;
  const helper = message ?? hint;

  return (
    <View style={styles.field}>
      <TextInput
        accessibilityHint={helper}
        accessibilityLabel={label}
        autoCapitalize={password ? 'none' : autoCapitalize}
        autoCorrect={password ? false : autoCorrect}
        error={Boolean(message)}
        label={label}
        mode="outlined"
        onBlur={field.onBlur}
        onChangeText={field.onChange}
        ref={inputRef}
        right={
          password ? (
            <TextInput.Icon
              accessibilityLabel={
                revealed ? t('auth.hidePassword') : t('auth.showPassword')
              }
              forceTextInputFocus={false}
              icon={revealed ? 'eye-off-outline' : 'eye-outline'}
              onPress={() => setRevealed((value) => !value)}
            />
          ) : (
            right
          )
        }
        secureTextEntry={password && !revealed}
        style={styles.input}
        value={typeof field.value === 'string' ? field.value : ''}
        {...inputProps}
      />
      {helper ? (
        <HelperText
          style={styles.helper}
          type={message ? 'error' : 'info'}
          visible
        >
          {helper}
        </HelperText>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  field: {
    gap: 0,
  },
  input: {
    backgroundColor: theme.colors.background,
  },
  helper: {
    marginTop: -4,
    paddingHorizontal: 0,
  },
}));
