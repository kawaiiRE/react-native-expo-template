# Backend integration

The app talks to exactly one backend, chosen at build time:

| `EXPO_PUBLIC_BACKEND` | Backend                                                                                     | `EXPO_PUBLIC_API_BASE_URL`                            |
| --------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `next`                | `next-frontend-template` gateway (which talks to the private `pocketbase-backend-template`) | Public Next.js origin, e.g. `https://app.example.com` |
| `fastify`             | `fastify-backend-template`                                                                  | Public Fastify origin, e.g. `https://api.example.com` |

Both values are validated at startup (`src/config/backend.ts`). A missing or invalid value shows a configuration screen instead of failing on every request. The origin must be `http(s)` without a path. Both variables are public: never put secrets in an `EXPO_PUBLIC_` variable.

No repository imports another repository's code; the contracts below are HTTP only. Sources of truth: the gateway's `src/app/api/v1/**` and `src/contracts/**`, and Fastify's `docs/integration.md` and `openapi/openapi.json`.

## Next.js gateway (`next`)

Native clients use the bearer-token routes and send no `Origin` and no cookies.

| App operation      | Route                                                                                                                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Config / health    | `GET /api/v1/config`, `GET /api/v1/health`                                                                                                                                                   |
| Sign in            | `POST /api/v1/auth/token` → `Session { token, expiresAt, user }`                                                                                                                             |
| Register           | `POST /api/v1/auth/token/register` → `{ status: 'authenticated', session }` or `{ status: 'verification_required', user }`                                                                   |
| Refresh            | `POST /api/v1/auth/token/refresh` (bearer) → `Session`                                                                                                                                       |
| Guest              | `POST /api/v1/auth/token/guest` → `Session`; upgrade `POST /api/v1/auth/token/guest/upgrade` (guest bearer) `{ name, email, password }` → `200 authenticated` or `202 verification_required` |
| Password reset     | `POST /api/v1/auth/password-reset { email }` (202), `POST /api/v1/auth/password-reset/confirm { token, password }`                                                                           |
| Email verification | `POST /api/v1/auth/verify-email { token }`, resend `POST /api/v1/auth/verify-email/request { email }` (202)                                                                                  |
| Profile            | `GET`/`PATCH`/`DELETE /api/v1/me` (`{ user }`), `POST /api/v1/me/password` (revokes every token)                                                                                             |
| Notes              | `GET /api/v1/notes?page&perPage&search&archived` → `{ items, page, perPage, totalItems, totalPages }`; `POST`, `GET`/`PATCH`/`DELETE /api/v1/notes/:id`                                      |

Register, guest and upgrade bodies include the app's active `locale` (`en` | `ar`), so emails and the default guest name match the app language; on Fastify the guest locale is sent as `Accept-Language` because Better Auth's anonymous endpoint takes no body.

Errors are `{ message, code, fields? }` with the gateway's codes (`INVALID_CREDENTIALS`, `EMAIL_TAKEN`, `GUEST_DISABLED`, `NOT_GUEST`, ...) and field codes; the adapter keeps them and normalizes unknown values. Config fields added later (`guest`, `guestTtlHours`, `isGuest`) default safely when an older gateway omits them.

## Fastify (`fastify`)

Authentication uses Better Auth's official Expo client: `createAuthClient` from `better-auth/client` with `expoClient` (`@better-auth/expo/client`, SecureStore storage) and `anonymousClient`. The client stores the session cookie and sends `expo-origin: <APP_SCHEME>://`; the app sends the same cookie as `Cookie` to `/api/v1/*`.

| App operation            | Route                                                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Config / health          | `GET /api/v1/config`, `GET /readyz`                                                                                                                                       |
| Sign in / out            | `POST /api/auth/sign-in/email`, `POST /api/auth/sign-out`; validation `GET /api/auth/get-session`                                                                         |
| Register / guest upgrade | `POST /api/auth/sign-up/email` (`token: null` when verification is required; sent with a guest cookie it upgrades the guest)                                              |
| Guest                    | `POST /api/auth/sign-in/anonymous`; end with `POST /api/auth/delete-anonymous-user`                                                                                       |
| Password                 | `POST /api/auth/request-password-reset`, `POST /api/auth/reset-password { token, newPassword }`, `POST /api/auth/change-password` (other sessions revoked, this one kept) |
| Verification             | `GET /api/auth/verify-email?token=` (signs in), `POST /api/auth/send-verification-email`                                                                                  |
| Delete account           | `POST /api/auth/delete-user { password }`                                                                                                                                 |
| Profile / notes          | `GET`/`PATCH /api/v1/me` (`emailVerified` → `verified`), notes as above with `{ list, total, ... }` → app `Page`                                                          |

Required backend settings (environment only, no code change):

- `CORS_ALLOWED_ORIGINS` must include the app scheme, e.g. `expo-starter://`, or Better Auth rejects mutations with `403 INVALID_ORIGIN`. For Expo Go, Better Auth's Expo guide also trusts an `exp://` pattern (for example `exp://192.168.*.*:*/**`); a development build with your own scheme avoids this.
- For the web preview, add the preview origin (for example `http://localhost:8081`) and use the same host name for both (`localhost` vs `127.0.0.1` matters for cookies).
- `AUTH_GUEST_ENABLED` / `AUTH_GUEST_TTL_HOURS` control guest sessions.

## Email links and deep links

Both backends email links to the **web frontend**: `${APP_URL}/verify-email?token=…` and `${APP_URL}/reset-password?token=…`. The app has matching root routes, so the same paths work in the app:

- With `APP_LINK_HOST=<APP_URL host>`, `app.config.js` adds iOS Associated Domains and Android App Links (`autoVerify`) for `/verify-email` and `/reset-password`. The web host must also serve `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json` for your bundle IDs; until it does, the links open in the browser.
- The custom scheme works without any host setup: `expo-starter://reset-password?token=…`.
- Without app links, users finish the step on the web page, or paste the code from the email on **Forgot password → I have a reset code**.

## Local workflow

Plain `http://` origins work only in development bundles (`__DEV__`). A release build with an `http://` `EXPO_PUBLIC_API_BASE_URL` shows the configuration error screen instead of sending credentials in clear text.

Next.js stack: start `pocketbase-backend-template`, then `next-frontend-template`, then:

```bash
EXPO_PUBLIC_BACKEND=next EXPO_PUBLIC_API_BASE_URL=http://<LAN-IP>:3000 corepack yarn start
```

Fastify:

```bash
# in fastify-backend-template (see its README for every variable)
docker compose up -d postgres && npm run db:migrate && \
  CORS_ALLOWED_ORIGINS=expo-starter://,http://localhost:8081 AUTH_GUEST_ENABLED=true npm run dev
# here
EXPO_PUBLIC_BACKEND=fastify EXPO_PUBLIC_API_BASE_URL=http://<LAN-IP>:5000 corepack yarn start
```

The web preview (`corepack yarn web`) works against Fastify with the CORS settings above. The Next.js gateway enforces an exact `Origin` and sends no CORS headers, so the web preview cannot call a gateway on another origin; use a device, simulator or emulator for that backend.

## Live verification

```bash
corepack yarn integration:check
```

The check reads `.env` (or the environment), detects the backend from `EXPO_PUBLIC_BACKEND`, and exercises config, health, a rejected unauthenticated request, sign-in or a throwaway registration, session refresh, profile, notes CRUD with search, archive filter and pagination, and, when enabled, guest start → note → upgrade → notes kept. Throwaway accounts are deleted. It skips when the backend is unreachable unless `INTEGRATION_REQUIRED=1`.
