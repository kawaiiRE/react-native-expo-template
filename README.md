# React Native Expo Template

[![CI](https://github.com/kawaiiRE/react-native-expo-template/actions/workflows/ci.yml/badge.svg)](https://github.com/kawaiiRE/react-native-expo-template/actions/workflows/ci.yml)

A production-ready Expo starter with complete account and notes flows, a Material 3 interface built on React Native Paper, English and Arabic with full RTL, and one typed backend boundary that works with **either** a Next.js gateway **or** a Fastify + Better Auth API.

## Features

- **Two backends, one app.** `EXPO_PUBLIC_BACKEND=next|fastify` selects an adapter behind a typed port (auth, account, config, health, notes). Screens never know which one is active.
- **Every account flow.** Welcome, sign in, register (hidden when the backend closes registration), forgot and reset password (deep link or pasted code), email verification with resend, profile, change password, delete account, and expired-session handling.
- **Guest sessions.** Opt-in "Continue as guest" with an expiry banner driven by the backend's `guestTtlHours`, upgrade to a real account that keeps the guest's notes, and "End guest session".
- **Notes example domain.** Dashboard with stats and recent notes, debounced search, active/archived filter, infinite scroll, pull to refresh, skeletons, empty/error/retry states, create/edit with unsaved-change protection, archive with undo, confirmed delete.
- **A real drawer.** Paper drawer content with account header, grouped sections, clear active indicator, theme and language quick switches, and pinned sign-out with confirmation. Modal with edge swipe on phones, permanent on tablets and wide screens, on the correct side in RTL.
- **Internationalization.** English and Arabic, device-language default, Arabic plural rules, locale-aware dates and numbers, IBM Plex Sans Arabic, mirrored layout with a guided restart on native, and the profile locale kept in sync for localized emails.
- **Polish.** Light/dark/system themes from central MD3 tokens, haptics, snackbars, confirmation dialogs, offline banner, keyboard-aware forms, route and root error boundaries, 404.
- **Secure by default.** Credentials in SecureStore, validated persistence, Zod-validated responses, and no secrets in public config.

## Stack

Expo SDK 57 · React Native 0.86 · React 19 · Expo Router (typed routes) · React Native Paper · MobX · react-hook-form + Zod · i18next · Better Auth Expo client · Vitest · TypeScript strict · Yarn 4

## Quick start

```bash
corepack yarn install --immutable
cp .env.example .env    # set EXPO_PUBLIC_BACKEND and EXPO_PUBLIC_API_BASE_URL
corepack yarn start     # Expo Go, a simulator/emulator, or press w for web
```

On a physical device, point `EXPO_PUBLIC_API_BASE_URL` at your computer's LAN address (or an HTTPS tunnel), not `127.0.0.1`.

### With the Next.js gateway

Run `pocketbase-backend-template`, then `next-frontend-template`, and set:

```dotenv
EXPO_PUBLIC_BACKEND=next
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:3000
```

### With Fastify

Run `fastify-backend-template` with the app scheme trusted (`CORS_ALLOWED_ORIGINS=expo-starter://`, plus your web preview origin if you use it) and `AUTH_GUEST_ENABLED=true` if you want guests, then set:

```dotenv
EXPO_PUBLIC_BACKEND=fastify
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:5000
```

Full contract, deep links and the local workflow: [docs/integration.md](docs/integration.md).

## Commands

| Command                                           | Purpose                                                   |
| ------------------------------------------------- | --------------------------------------------------------- |
| `corepack yarn start` / `android` / `ios` / `web` | Development server                                        |
| `corepack yarn check`                             | Format, lint, typecheck, unit tests and static web export |
| `corepack yarn test`                              | Vitest in watch mode                                      |
| `corepack yarn integration:check`                 | Live contract check against the configured backend        |
| `corepack yarn build:web`                         | Static web export to `dist/`                              |

## Project layout

```text
app/                 Expo Router routes (thin re-exports)
src/components/      Screens, navigation, feedback and shared UI
src/hooks/           Screen lifecycle and actions
src/stores/          MobX session and preferences
src/models/          Backend-neutral types and error codes
src/services/backend Port, Next and Fastify adapters, HTTP client
src/presenters/      Formatting and view mapping
src/forms/           Zod form schemas
src/i18n/            English and Arabic
src/theme/           MD3 tokens, fonts, motion
```

## Make it yours

Change the app identifiers in `.env`, replace the notes domain one vertical slice at a time (model → port → both adapters → hooks → screens → translations → tests), and add native modules only for real product requirements. Read [docs/architecture.md](docs/architecture.md), [docs/testing.md](docs/testing.md) and [docs/deployment.md](docs/deployment.md) before shipping.

## License

[MIT](LICENSE)
