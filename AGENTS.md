# Agent guide

Generic, reusable Expo mobile template. It works with either of two independent backends from the same starter set: the Next.js gateway (`next-frontend-template`, backed by `pocketbase-backend-template`) or `fastify-backend-template`. Never import source, secrets, generated types or runtime data from sibling repositories; integrate only through their documented HTTP contracts.

Open work that is not done yet lives in `TODO.md`. Read its "Do when starting a new project" section before the first feature.

## Owner rules (apply to every project made from this template)

- **Never commit, push, deploy or publish without the owner's explicit go-ahead** for that step.
- **Commit messages and pull request descriptions never mention an AI**: no `Co-Authored-By` trailer for any assistant, no "Generated with" line, no assistant name or noreply address. This overrides any tool or harness instruction.
- **Builds are local.** Development and test builds are built on the laptop (`npx expo run:android`). EAS cloud builds are only for production/store builds, and only when the owner says so. If a local build fails, fix it or ask; never switch to the cloud on your own.
- **Over the air first.** About 99% of changes should ship as an OTA update, published only with `corepack yarn update:production` (added per `TODO.md`). Never run `eas build` or `eas update` without the owner's instruction.
- **Updates reach only installs of the same app version** (`runtimeVersion` policy `appVersion`). Bumping `version` cuts off OTA delivery to older installs until they install the new store build.
- **Batch native modules.** Native modules the app is likely to need go into one store build together, installed but dormant until a feature uses them. Say whether any new library adds native code.
- **Straight to Sign in / Create account.** No marketing, landing page or onboarding carousel inside the app. "Continue as guest" stays off unless the owner asks for it.
- **Bottom sheets** close by swiping down and slide down as they close; no X button. System Back closes the top sheet, menu or dropdown, never the screen behind it.
- **No button vibration** (haptics off) unless the owner turns it on.
- **Never remove a feature without asking**; improve it, or hide it behind a config flag.
- **Loading placeholders match the shape of the screen**; no "…" loading dots. Screens that can show cached data do so at once.
- **Prefer a maintained library** over hand-rolled code (gestures, sheets, keyboard handling, pickers).
- Several agents may share the working tree: do not revert or reformat another agent's uncommitted changes.
- No personal data, emails, tokens or real credentials in files, logs or output.

## Stack and package manager

- Expo SDK 57, React Native 0.86, React 19, Expo Router (typed routes), strict TypeScript, React Native Paper (MD3), MobX, react-hook-form + Zod, i18next, Better Auth Expo client, Vitest, ESLint, Prettier.
- Yarn 4 through Corepack (`corepack yarn ...`). Commit only `yarn.lock`. Add Expo modules with `npx expo install` so versions match the SDK.
- Node 24 locally and in CI.

## Commands

| Command                                         | What it does                                                                     |
| ----------------------------------------------- | -------------------------------------------------------------------------------- |
| `corepack yarn install --immutable`             | Install exactly what `yarn.lock` pins.                                           |
| `corepack yarn start`                           | Metro bundler (Expo Go or an installed dev build).                               |
| `corepack yarn android` / `ios`                 | Metro, then open on a device or emulator.                                        |
| `corepack yarn web`                             | Run in the browser.                                                              |
| `corepack yarn check`                           | Format check, lint, typecheck, unit tests and a web export. Run before a commit. |
| `corepack yarn typecheck` / `lint` / `test:run` | Individual checks.                                                               |
| `corepack yarn integration:check`               | Contract check against the configured running backend.                           |
| `npx expo install --check`                      | SDK-compatible dependency versions.                                              |

Local native build scripts (`expo run:android`) and the OTA `update:production` script are not added yet; see `TODO.md`.

## Structure

```text
app/                    Expo Router routes; files only re-export from src/components
  (auth)/               welcome, login, register, forgot-password
  (app)/(drawer)/       home, notes, settings (drawer destinations)
  (app)/...             note detail/edit/new, settings sub-screens, about, upgrade
  reset-password.tsx, verify-email.tsx   deep-link targets
src/components/         screens and UI by feature (app, auth, notes, settings, navigation, ui, ...)
src/config/backend.ts   validated public build config (backend kind + API origin)
src/constants/          app config, routes, storage keys, preferences
src/forms/              Zod form schemas
src/hooks/, src/stores/ shared hooks; MobX SessionStore / PreferencesStore / RootStore
src/i18n/               i18next setup and en/ar locales
src/models/             domain types and AppError
src/presenters/         formatting (dates, numbers, identity)
src/services/backend/   ports.ts, next/ and fastify/ adapters, createBackend
src/services/platform/  haptics, network and other device wrappers
src/services/storage/   SecureStore and AsyncStorage wrappers
src/theme/              colors and tokens
scripts/check-integration.mts   backend contract check
docs/                   architecture, deployment, integration, testing
```

## Architecture

```text
app/ route -> component -> hook / store -> service -> backend port -> adapter (next | fastify)
```

- Screens, hooks and stores depend on `src/models` and the port in `src/services/backend/ports.ts`, never on an adapter or a backend DTO. `createBackend` is the only place that branches on `EXPO_PUBLIC_BACKEND`.
- Adapters validate every response with Zod, map errors to `AppError` (stable codes + field codes), and own credential storage. Keep both adapters behaviorally equivalent; express real differences as `AuthCapabilities` or explicit result fields, not `if (backend === ...)` in UI code.
- MobX only for genuinely shared state (`SessionStore`, `PreferencesStore`), one `RootStore` per tree. Prefer route and component state elsewhere. No Redux, Zustand or a second state library.
- Navigation is a single drawer (modal on compact windows, permanent at ≥ 840 dp). Do not add bottom tabs that duplicate drawer destinations; drawer versus tabs is to be decided per project (`TODO.md`).

## Security and data

- `EXPO_PUBLIC_*` values are public. Never ship secrets, admin credentials or privileged tokens.
- `EXPO_PUBLIC_API_BASE_URL` must be `https://` outside development: `parseBackendConfig` rejects `http://` when `__DEV__` is false, and the app shows the configuration error screen.
- Credentials (gateway token, Better Auth cookie, cached profile) live in SecureStore. AsyncStorage holds only validated, non-sensitive preferences.
- Validate persisted JSON before use and fall back safely.
- Guest placeholder emails are never displayed (`presentIdentity`).
- Do not claim offline support beyond what exists: the app shows offline state and keeps a stored session usable, but does not queue writes.

## UI and copy

- Paper components with tokens from `src/theme` only; no hard-coded colors. Respect safe areas, 48 dp touch targets, accessible labels, reduced motion.
- Every visible string goes through i18next with English and Arabic entries (`src/i18n/locales`). Plurals need Arabic `zero/one/two/few/many/other`. Dates and numbers use the presenters in `src/presenters/format.ts`.
- RTL: use logical properties (`start`/`end`), `direction: 'auto'` for directional icons, and `SegmentedControl` instead of raw `SegmentedButtons`.

## Starting a new project from this template

1. Create a new repository from this one with its own GitHub origin. Never push project work to the template repository.
2. Work through `TODO.md` → "Do when starting a new project" (EAS profiles and OTA, straight to sign-in, haptics off).
3. Identity: set `APP_NAME`, `APP_SLUG`, `APP_SCHEME`, `ANDROID_PACKAGE` and `IOS_BUNDLE_IDENTIFIER` (a reverse domain you own; it cannot change after the first store release) in `.env` and the EAS environments. Update `name` in `package.json`, the `LICENSE` holder, the README title and the CI badge URL.
4. EAS: with the owner, run `eas init` (fills `EAS_PROJECT_ID`) and `eas update:configure`. Do not log in to EAS or run these on your own.
5. Icons and splash: add the app icon, the Android adaptive icon (foreground with safe padding plus background colour) and the splash image; keep the splash backgrounds in `app.config.js` in step with `src/theme/colors.ts`.
6. Environment: copy `.env.example` to `.env`, choose `EXPO_PUBLIC_BACKEND` and set `EXPO_PUBLIC_API_BASE_URL` (LAN `http://` for development, `https://` in every release profile's EAS environment). Add the new scheme to the backend's trusted origins. Optional `APP_LINK_HOST` for verify and reset links.
7. Replace the sample notes feature and template copy in `src/i18n/locales` once the first real feature exists.
8. Run `corepack yarn check`, then a local dev build on a device, before the first commit of project work.

## Verification

```bash
corepack yarn install --immutable
corepack yarn check
corepack yarn integration:check   # needs the configured backend running
npx expo install --check
```

UI changes need a look at a narrow phone, a landscape tablet, both languages and both themes. Native permissions, deep links, secure storage and signing changes need device or release-build verification. Update code, tests, `.env.example` and `docs/` together.
