# Agent guide

Generic, reusable Expo mobile template. It works with either of two independent backends from the same starter set: the Next.js gateway (`next-frontend-template`, backed by `pocketbase-backend-template`) or `fastify-backend-template`. Never import source, secrets, generated types or runtime data from sibling repositories; integrate only through their documented HTTP contracts.

## Stack and package manager

- Expo SDK 57, React Native 0.86, React 19, Expo Router (typed routes), strict TypeScript, React Native Paper (MD3), MobX, react-hook-form + Zod, i18next, Better Auth Expo client, Vitest, ESLint, Prettier.
- Yarn 4 through Corepack (`corepack yarn ...`). Commit only `yarn.lock`. Add Expo modules with `npx expo install` so versions match the SDK.
- Node 24 locally and in CI.

## Architecture

```text
app/ route -> component -> hook / store -> service -> backend port -> adapter (next | fastify)
```

- `app/` files only re-export screens and layouts from `src/components`.
- Screens, hooks and stores depend on `src/models` and the port in `src/services/backend/ports.ts`, never on an adapter or a backend DTO. `createBackend` is the only place that branches on `EXPO_PUBLIC_BACKEND`.
- Adapters validate every response with Zod, map errors to `AppError` (stable codes + field codes), and own credential storage. Keep both adapters behaviorally equivalent; express real differences as `AuthCapabilities` or explicit result fields, not `if (backend === ...)` in UI code.
- MobX only for genuinely shared state (`SessionStore`, `PreferencesStore`), one `RootStore` per tree. Prefer route and component state elsewhere. No Redux, Zustand or a second state library.
- Navigation is a single drawer (modal on compact windows, permanent at ≥ 840 dp). Do not reintroduce bottom tabs that duplicate drawer destinations.

## Security and data

- `EXPO_PUBLIC_*` values are public. Never ship secrets, admin credentials or privileged tokens.
- Credentials (gateway token, Better Auth cookie, cached profile) live in SecureStore. AsyncStorage holds only validated, non-sensitive preferences.
- Validate persisted JSON before use and fall back safely.
- Guest placeholder emails are never displayed (`presentIdentity`).
- Do not claim offline support beyond what exists: the app shows offline state and keeps a stored session usable, but does not queue writes.

## UI and copy

- Paper components with tokens from `src/theme` only; no hard-coded colors. Respect safe areas, 48 dp touch targets, accessible labels, reduced motion.
- Every visible string goes through i18next with English and Arabic entries (`src/i18n/locales`). Plurals need Arabic `zero/one/two/few/many/other`. Dates and numbers use the presenters in `src/presenters/format.ts`.
- RTL: use logical properties (`start`/`end`), `direction: 'auto'` for directional icons, and `SegmentedControl` instead of raw `SegmentedButtons`.

## Verification

```bash
corepack yarn install --immutable
corepack yarn check
corepack yarn integration:check   # needs the configured backend running
npx expo install --check
```

UI changes need a look at a narrow phone, a landscape tablet, both languages and both themes. Native permissions, deep links, secure storage and signing changes need device or release-build verification. Update code, tests, `.env.example` and `docs/` together.
