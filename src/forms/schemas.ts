import { z } from 'zod';

import { NOTE_BODY_MAX, NOTE_TITLE_MAX } from '@/models/note';

/** Validation messages are translation keys resolved by the form field. */
export type ValidationMessageKey =
  | 'validation.required'
  | 'validation.emailInvalid'
  | 'validation.passwordMin'
  | 'validation.passwordMax'
  | 'validation.passwordsMismatch'
  | 'validation.passwordSame'
  | 'validation.nameMin'
  | 'validation.nameMax'
  | 'validation.titleRequired'
  | 'validation.titleMax'
  | 'validation.bodyMax';

const message = (key: ValidationMessageKey) => ({ message: key });

/** The intersection of every supported backend's rules. */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX_BYTES = 71;
export const NAME_MIN = 2;
export const NAME_MAX = 100;

function utf8ByteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

const emailField = z
  .string()
  .trim()
  .min(1, message('validation.required'))
  .pipe(z.email(message('validation.emailInvalid')));

const newPasswordField = z
  .string()
  .min(PASSWORD_MIN, message('validation.passwordMin'))
  .refine(
    (value) => utf8ByteLength(value) <= PASSWORD_MAX_BYTES,
    message('validation.passwordMax'),
  );

const requiredField = z.string().min(1, message('validation.required'));

const nameField = z
  .string()
  .trim()
  .min(1, message('validation.required'))
  .min(NAME_MIN, message('validation.nameMin'))
  .max(NAME_MAX, message('validation.nameMax'));

const matchingPasswords = {
  check: (values: { password: string; confirmPassword: string }) =>
    values.password === values.confirmPassword,
  params: {
    ...message('validation.passwordsMismatch'),
    path: ['confirmPassword'],
  },
};

export const loginFormSchema = z.object({
  email: emailField,
  password: requiredField,
});

export const registerFormSchema = z
  .object({
    name: nameField,
    email: emailField,
    password: newPasswordField,
    confirmPassword: requiredField,
  })
  .refine(matchingPasswords.check, matchingPasswords.params);

export const emailFormSchema = z.object({ email: emailField });

export const resetPasswordFormSchema = z
  .object({
    token: z.string().trim().min(1, message('validation.required')),
    password: newPasswordField,
    confirmPassword: requiredField,
  })
  .refine(matchingPasswords.check, matchingPasswords.params);

export const profileFormSchema = z.object({ name: nameField });

export const changePasswordFormSchema = z
  .object({
    currentPassword: requiredField,
    password: newPasswordField,
    confirmPassword: requiredField,
  })
  .refine(matchingPasswords.check, matchingPasswords.params)
  .refine((values) => values.password !== values.currentPassword, {
    ...message('validation.passwordSame'),
    path: ['password'],
  });

export const noteFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, message('validation.titleRequired'))
    .max(NOTE_TITLE_MAX, message('validation.titleMax')),
  body: z.string().max(NOTE_BODY_MAX, message('validation.bodyMax')),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type EmailFormValues = z.infer<typeof emailFormSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;
export type ProfileFormValues = z.infer<typeof profileFormSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
export type NoteFormValues = z.infer<typeof noteFormSchema>;
