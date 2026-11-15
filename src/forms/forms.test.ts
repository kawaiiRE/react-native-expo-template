import { describe, expect, it, vi } from 'vitest';

import {
  changePasswordFormSchema,
  noteFormSchema,
  registerFormSchema,
  resetPasswordFormSchema,
} from './schemas';
import { applyServerFieldErrors } from './serverErrors';

function messages(result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
}) {
  return Object.fromEntries(
    (result.error?.issues ?? []).map((issue) => [
      issue.path.join('.'),
      issue.message,
    ]),
  );
}

describe('form schemas', () => {
  it('validates registration with translation-key messages', () => {
    expect(
      messages(
        registerFormSchema.safeParse({
          name: 'J',
          email: 'not-an-email',
          password: 'short',
          confirmPassword: 'different',
        }),
      ),
    ).toEqual({
      name: 'validation.nameMin',
      email: 'validation.emailInvalid',
      password: 'validation.passwordMin',
      confirmPassword: 'validation.passwordsMismatch',
    });
    expect(
      messages(
        registerFormSchema.safeParse({
          name: 'Jo',
          email: 'jo@example.com',
          password: 'long-enough',
          confirmPassword: 'different',
        }),
      ),
    ).toEqual({ confirmPassword: 'validation.passwordsMismatch' });
  });

  it('limits new passwords by UTF-8 bytes, not characters', () => {
    const arabic = 'كلمة'.repeat(9);
    expect(arabic.length).toBe(36);
    expect(
      messages(
        resetPasswordFormSchema.safeParse({
          token: 'tok',
          password: arabic,
          confirmPassword: arabic,
        }),
      ),
    ).toEqual({ password: 'validation.passwordMax' });
  });

  it('requires a different new password', () => {
    expect(
      messages(
        changePasswordFormSchema.safeParse({
          currentPassword: 'same-password',
          password: 'same-password',
          confirmPassword: 'same-password',
        }),
      ),
    ).toEqual({ password: 'validation.passwordSame' });
  });

  it('trims note titles and enforces limits shared by both backends', () => {
    expect(
      messages(noteFormSchema.safeParse({ title: '   ', body: '' })),
    ).toEqual({ title: 'validation.titleRequired' });
    expect(
      messages(noteFormSchema.safeParse({ title: 'x'.repeat(161), body: '' })),
    ).toEqual({ title: 'validation.titleMax' });
  });
});

describe('applyServerFieldErrors', () => {
  it('copies known field codes as translation keys and reports success', () => {
    const setError = vi.fn();
    const applied = applyServerFieldErrors(
      {
        code: 'INVALID_INPUT',
        status: 400,
        fields: { email: 'taken', unrelated: 'invalid' },
      },
      setError,
      ['name', 'email'],
    );

    expect(applied).toBe(true);
    expect(setError).toHaveBeenCalledTimes(1);
    expect(setError).toHaveBeenCalledWith('email', {
      type: 'server',
      message: 'fieldErrors.taken',
    });
  });

  it('returns false when no form field matches', () => {
    expect(
      applyServerFieldErrors({ code: 'RATE_LIMITED', status: 429 }, vi.fn(), [
        'email',
      ]),
    ).toBe(false);
  });
});
