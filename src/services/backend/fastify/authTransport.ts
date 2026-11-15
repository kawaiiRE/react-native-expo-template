import type { LocaleInput, RegisterInput, SignInInput } from '@/models/auth';

import type { BetterAuthError } from './errors';

export type AuthCallResult = { data: unknown; error: BetterAuthError | null };
type AuthCall = Promise<AuthCallResult>;

/**
 * The Better Auth client operations the Fastify adapter needs. Implemented by
 * `createBetterAuthTransport` over the official client (`expoClient` +
 * `anonymousClient`), and by fakes in tests.
 */
export interface BetterAuthTransport {
  signInEmail(body: SignInInput): AuthCall;
  signUpEmail(body: RegisterInput): AuthCall;
  signInAnonymous(body: LocaleInput): AuthCall;
  signOut(): AuthCall;
  getSession(): AuthCall;
  requestPasswordReset(body: { email: string }): AuthCall;
  resetPassword(body: { token: string; newPassword: string }): AuthCall;
  verifyEmail(token: string): AuthCall;
  sendVerificationEmail(body: { email: string }): AuthCall;
  changePassword(body: {
    currentPassword: string;
    newPassword: string;
    revokeOtherSessions: boolean;
  }): AuthCall;
  deleteUser(body: { password?: string }): AuthCall;
  deleteAnonymousUser(): AuthCall;
  /** `Cookie` header value for the stored session; empty when signed out or on the web. */
  getCookie(): Promise<string>;
}
