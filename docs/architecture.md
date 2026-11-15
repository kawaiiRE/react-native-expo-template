# Architecture

## Layers and request flow

```text
app/ route ─► component ─► hook / MobX store ─► service ─► backend port
                                                              │
                         ┌────────────────────────────────────┴───────────┐
                    Next adapter                                   Fastify adapter
          HttpClient + bearer token (SecureStore)    Better Auth Expo client + HttpClient
          ─► Next.js /api/v1/* ─► PocketBase         ─► /api/auth/* and /api/v1/*
```

| Directory                            | Owns                                                                                                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/`                               | Thin Expo Router files that re-export screens and layouts.                                                                                                                |
| `src/components/`                    | Paper UI: screens, navigation, feedback providers, shared UI.                                                                                                             |
| `src/hooks/`                         | Screen lifecycle: lists, detail loading, note actions, language switching, sign-out confirmation, locale sync.                                                            |
| `src/stores/`                        | MobX state shared across screens: `SessionStore` (user, features, sign-out notices) and `PreferencesStore` (theme, language, onboarding). One `RootStore` per React tree. |
| `src/models/`                        | Backend-neutral application types: `User`, `Note`, `Page`, `ServerFeatures`, `AppError` and its codes.                                                                    |
| `src/services/backend/`              | The port (`ports.ts`), one adapter per backend, the shared `HttpClient`, and `createBackend`.                                                                             |
| `src/services/notes/`                | `NotesService`: notes port plus change events that keep open lists and details in sync.                                                                                   |
| `src/services/storage/`, `platform/` | SecureStore/AsyncStorage wrappers, haptics, appearance, layout direction.                                                                                                 |
| `src/presenters/`                    | Pure view mapping: identity (guests are never shown their placeholder email), note previews, locale-aware dates and numbers, error keys.                                  |
| `src/forms/`                         | Zod form schemas (messages are translation keys) and server field-error mapping.                                                                                          |
| `src/config/`, `src/constants/`      | Validated public configuration, routes, storage keys.                                                                                                                     |
| `src/theme/`                         | MD3 colors, typography (DM Sans / IBM Plex Sans Arabic), spacing, radii, breakpoints, motion.                                                                             |
| `src/i18n/`                          | i18next instance per tree, English and Arabic resources, language helpers.                                                                                                |

Screens, hooks and stores import only the port types and `src/models`. `createBackend` is the only code that knows which backend is active; it is called once by the composition root (`src/services/container.ts`).

## Backend port

`src/services/backend/ports.ts` defines `AuthPort`, `AccountPort`, `ConfigPort`, `HealthPort` and `NotesPort`. Every method returns `AppResult<T>` (`{ ok: true, data } | { ok: false, error }`) and never throws for HTTP or transport failures.

- **Errors.** Each adapter maps its backend's error body into `AppError { code, status, fields? }`. `code` is one of the stable app codes in `src/models/errors.ts`; `fields` holds field codes (`required`, `invalid_email`, `too_short`, `taken`, `invalid_token`, `incorrect_password`, ...) that forms translate. The gateway already sends field codes; Fastify's Zod messages and Better Auth codes (`INVALID_EMAIL_OR_PASSWORD`, `USER_ALREADY_EXISTS*`, `INVALID_PASSWORD`, `INVALID_TOKEN`, ...) are reduced to the same vocabulary.
- **Validation.** Every response is parsed with Zod in the adapter (`next/contracts.ts`, `fastify/contracts.ts`). A mismatch becomes `INVALID_RESPONSE`.
- **Capabilities.** `auth.capabilities` describes real differences: `resendVerification` and `deleteAccountRequiresPassword`. `changePassword` reports whether the backend also revoked the current session (`signedOut`).
- **Rejected sessions.** An authenticated request answered with `UNAUTHENTICATED`, or attempted without a credential, calls `BackendHooks.onSessionRejected`, which signs the user out with a notice.

## Sessions

|            | Next gateway                                                                                                         | Fastify                                                                                                                                                              |
| ---------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Credential | Bearer token from `/api/v1/auth/token*`, stored by `NextTokenStore` in SecureStore (`app.next.token.v1`).            | Better Auth session cookie stored by `@better-auth/expo` in SecureStore (prefix `app_auth`), sent as `Cookie` to `/api/v1/*`. The web build uses the browser cookie. |
| Refresh    | Proactive, single-flight exchange at `/api/v1/auth/token/refresh` once less than 25 % of the token lifetime remains. | `GET /api/auth/get-session` on launch and foreground, which rotates the cookie when Better Auth extends the session.                                                 |
| Sign-out   | Forget the token (gateway tokens are stateless).                                                                     | `POST /api/auth/sign-out`; the Expo client clears its storage first, so it also works offline.                                                                       |

`SessionStore` caches the last profile in SecureStore (`app.session.user.v1`) so a stored session opens instantly and offline; it revalidates in the background, at most every five minutes on foreground.

## Guest sessions

When `features.guest` is `true`, welcome and login offer **Continue as guest**. Guests (`user.isGuest`) see a Paper `Banner` on Home and in the drawer with the backend's `guestTtlHours`, can create an account from the upgrade screen (their notes are kept), cannot change a password, and "Delete account" becomes **End guest session** (`DELETE /api/v1/me` on Next, `POST /api/auth/delete-anonymous-user` on Fastify). Signing out as a guest asks for confirmation because the session cannot be resumed.

If an upgrade needs email verification, the app shows the verify-email notice. The Next gateway invalidates the guest token at that point, so the app returns to sign-in; Fastify keeps the guest session, so verifying on the same device (or the next sign-in) merges the guest's data.

## Navigation

A single drawer is the primary navigation; there are no bottom tabs.

- **Compact and medium windows** (< 840 dp): modal drawer opened by the header menu button or an edge swipe.
- **Expanded windows** (≥ 840 dp, landscape tablets and desktop web): permanent drawer, no menu button.

The drawer content is built from Paper (`Drawer.Section`, `Drawer.Item`): account header (avatar, name, email or guest badge), guest banner, Workspace (Home, Notes, Archived notes), Account (Edit profile, Change password or Create account for guests, Settings), App (About), and a pinned footer with theme selection, a one-tap language switch and confirmed sign-out. `expo-router`'s `LocaleProvider` passes the layout direction to React Navigation, so the drawer opens from the leading edge (right in Arabic).

Routes: `(auth)` holds welcome, login, register and forgot-password behind `Stack.Protected`; `(app)` holds the drawer (`index`, `notes`, `settings`) and stacked pages (note detail/new/edit, profile, language, password, delete-account, about, upgrade). `verify-email` and `reset-password` live at the root so email links work signed in or out.

## UI system

React Native Paper MD3 with centralized tokens in `src/theme`. Theme mode (system, light, dark), language (device default, English, Arabic) and onboarding are persisted in AsyncStorage (`app.preferences.v1`, validated on hydration). Arabic switches to IBM Plex Sans Arabic with taller line heights; directional icons use Paper's `direction: 'auto'`.

Native layout direction is fixed per process. Choosing a language with a different direction calls `I18nManager.forceRTL` and offers an immediate restart through `expo`'s `reloadAppAsync`; Expo Go cannot mirror the layout, which the app explains. The web build mirrors immediately (`document.dir`); Paper's segmented buttons are mirrored by `SegmentedControl` because their corner radii are physical.

## Offline behavior

The app shows an offline banner (NetInfo), keeps a stored session usable while offline, and shows retryable error states. It does not queue writes: creating or editing a note offline fails with a clear message.
