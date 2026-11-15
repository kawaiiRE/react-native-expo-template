import type {
  EmailInput,
  HealthReport,
  LocaleInput,
  RegisterInput,
  RegisterOutcome,
  ResetPasswordInput,
  ServerFeatures,
  SignInInput,
  VerifyEmailOutcome,
} from '@/models/auth';
import type { AppResult } from '@/models/errors';
import type {
  CreateNoteInput,
  Note,
  NotesQuery,
  Page,
  UpdateNoteInput,
} from '@/models/note';
import type {
  ChangePasswordInput,
  DeleteAccountInput,
  UpdateProfileInput,
  User,
} from '@/models/user';

export const BACKEND_KINDS = ['next', 'fastify'] as const;
export type BackendKind = (typeof BACKEND_KINDS)[number];

export type AuthCapabilities = {
  /** The backend can re-send a verification email on request. */
  resendVerification: boolean;
  /** Registered users must confirm account deletion with their password. */
  deleteAccountRequiresPassword: boolean;
};

/**
 * Session lifecycle. Adapters own credential storage (bearer token or session
 * cookie); callers only ever see the application `User`.
 */
export interface AuthPort {
  readonly capabilities: AuthCapabilities;
  /** Local check only: whether a credential worth validating is stored. */
  hasStoredCredential(): Promise<boolean>;
  /** Validates (and rotates when needed) the stored credential. */
  refreshSession(): Promise<AppResult<User>>;
  signIn(input: SignInInput): Promise<AppResult<User>>;
  register(input: RegisterInput): Promise<AppResult<RegisterOutcome>>;
  startGuestSession(input?: LocaleInput): Promise<AppResult<User>>;
  /**
   * Converts the current guest into a registered account, keeping its data.
   * On `verification_required` the adapter forgets the guest credential when
   * the backend invalidated it; otherwise the guest session stays usable until
   * verification completes the upgrade.
   */
  upgradeGuest(input: RegisterInput): Promise<AppResult<RegisterOutcome>>;
  /** Ends the session on the server where supported, then forgets it locally. */
  signOut(): Promise<void>;
  /** Forgets the local credential after the session ended elsewhere. Never fails. */
  clearCredential(): Promise<void>;
  requestPasswordReset(input: EmailInput): Promise<AppResult<void>>;
  resetPassword(input: ResetPasswordInput): Promise<AppResult<void>>;
  verifyEmail(token: string): Promise<AppResult<VerifyEmailOutcome>>;
  resendVerification(input: EmailInput): Promise<AppResult<void>>;
}

export interface AccountPort {
  me(): Promise<AppResult<User>>;
  updateProfile(input: UpdateProfileInput): Promise<AppResult<User>>;
  /** `signedOut` reports whether the backend revoked the current session too. */
  changePassword(
    input: ChangePasswordInput,
  ): Promise<AppResult<{ signedOut: boolean }>>;
  /** Deletes the account, or ends and deletes a guest session. */
  deleteAccount(
    user: Pick<User, 'isGuest'>,
    input: DeleteAccountInput,
  ): Promise<AppResult<void>>;
}

export interface ConfigPort {
  features(): Promise<AppResult<ServerFeatures>>;
}

export interface HealthPort {
  check(signal?: AbortSignal): Promise<AppResult<HealthReport>>;
}

export interface NotesPort {
  list(query: NotesQuery, signal?: AbortSignal): Promise<AppResult<Page<Note>>>;
  get(id: string, signal?: AbortSignal): Promise<AppResult<Note>>;
  create(input: CreateNoteInput): Promise<AppResult<Note>>;
  update(id: string, input: UpdateNoteInput): Promise<AppResult<Note>>;
  remove(id: string): Promise<AppResult<void>>;
}

export type Backend = {
  auth: AuthPort;
  account: AccountPort;
  config: ConfigPort;
  health: HealthPort;
  notes: NotesPort;
};

export type BackendHooks = {
  /** Called when an authenticated request is rejected because the session ended. */
  onSessionRejected: () => void;
};
