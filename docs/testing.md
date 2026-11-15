# Testing

## Quality gate

```bash
corepack yarn check
```

Runs Prettier, ESLint (zero warnings), strict TypeScript, Vitest and a static web export. It needs no backend: without `EXPO_PUBLIC_*` variables the export renders the configuration screen.

## Unit tests (Vitest, `src/**/*.test.ts`)

| Area              | File                                                             | Covers                                                                                                                                                                                                                                                                                                                       |
| ----------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next adapter      | `services/backend/next/nextBackend.test.ts`                      | Every route, method, body and header the app sends; bearer handling; guest start, upgrade (200 and 202), locale in register/guest bodies; proactive single-flight refresh; rejected and persisted tokens; field-code and status error mapping; config defaults for older gateways; API-version pinning; response validation. |
| Fastify adapter   | `services/backend/fastify/fastifyBackend.test.ts`                | Better Auth calls through a fake transport, cookie forwarding on native vs browser cookies on web, Better Auth and domain error mapping (including Zod field messages), guest start/upgrade/end, delete with password, change-password semantics, list envelope mapping, readiness.                                          |
| HTTP client       | `services/backend/http/httpClient.test.ts`                       | Query encoding, JSON bodies, credentials, timeouts, cancellation, network errors, schema rejection, rejected-session hook.                                                                                                                                                                                                   |
| Stores            | `stores/SessionStore.test.ts`, `stores/PreferencesStore.test.ts` | Restore from cache or server, offline launch, revalidation throttling, sign-out notices, guest flows, persisted preference validation.                                                                                                                                                                                       |
| Forms             | `forms/forms.test.ts`                                            | Schema messages, UTF-8 password limit, server field errors.                                                                                                                                                                                                                                                                  |
| Config            | `config/backend.test.ts`                                         | `EXPO_PUBLIC_BACKEND` / `EXPO_PUBLIC_API_BASE_URL` validation.                                                                                                                                                                                                                                                               |
| i18n              | `i18n/i18n.test.ts`                                              | en/ar key parity, Arabic plural categories, every error and field code translated, guest-lifetime plurals.                                                                                                                                                                                                                   |
| Presenters, lists | `presenters/presenters.test.ts`, `hooks/notesListState.test.ts`  | Worst-case names and initials, guest identity, formatting, pagination merge, cross-screen note updates.                                                                                                                                                                                                                      |

Fixtures use realistic worst-case content: long names, Arabic and mixed-script text, emoji, very long emails.

## Live checks

`corepack yarn integration:check` verifies the deployed contract of the configured backend (see [integration.md](integration.md)). It is kept out of `check` so CI never depends on external services.

## Manual and device checks

For UI changes, run the app on a narrow phone, a tablet in landscape (permanent drawer), both languages and both themes. Arabic on native requires a development build to see the mirrored layout (Expo Go keeps the launch direction). Secure storage, deep links (`APP_LINK_HOST`), keyboard behavior, haptics and release signing always need a real device or release build.
