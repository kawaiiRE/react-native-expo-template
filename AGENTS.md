# Agent guide

This is a generic, reusable Expo mobile template. It is one of three independent repositories in the Next.js + PocketBase + Expo starter set; never import source, secrets, generated types, or runtime data from its sibling templates.

## Stack and package manager

- Expo SDK 57, React Native 0.86, React 19, Expo Router, TypeScript strict mode, React Native Paper, MobX, AsyncStorage, Zod, Vitest, ESLint, and Prettier.
- Use Yarn through Corepack. Keep `packageManager` pinned and commit only `yarn.lock`; never add npm or pnpm lockfiles.
- Node 24 is the local and CI baseline.
- Expo Go is the default development path. Add a development client only when a product introduces native modules that require one.

## Repository boundary

- This repository must install, test, build, version, publish, and recover independently.
- Mobile talks to the public Next.js gateway through versioned HTTP contracts. PocketBase remains private behind Next.js unless a reviewed realtime or file flow genuinely requires direct access.
- `EXPO_PUBLIC_API_BASE_URL` is public by definition. Never put PocketBase superuser credentials, signing secrets, private API keys, or privileged tokens in an `EXPO_PUBLIC_` variable.
- New applications must set unique app names, slugs, schemes, bundle identifiers, Android package names, and EAS project IDs.

## Structure and request flow

```text
app/ route -> component -> hook -> domain service -> API client
                                         -> Next.js /api/* -> PocketBase
```

- `app/` contains thin Expo Router screens and layouts.
- `src/components/` renders focused UI and receives application-facing data.
- `src/hooks/` coordinates component lifecycle and service calls.
- `src/services/` owns network, storage, and platform operations.
- `src/contracts/` validates untrusted HTTP responses with Zod.
- `src/stores/` owns genuinely shared mutable client state only.
- `src/constants/` centralizes routes, configuration, copy, and design tokens.
- Keep raw API calls out of screens and components. Keep storage and network work out of MobX computed values.

## State and persistence

- Prefer route state and component-local state before a store. If cross-screen mutable state is required, use MobX; do not add Redux, Zustand, or another global state library.
- Create one store instance per React tree. Do not export a mutable singleton.
- Validate persisted JSON before hydration. Treat it as untrusted and fall back safely when it is malformed or from an incompatible version.
- AsyncStorage is for small, non-sensitive preferences and cache-sized data. Use SecureStore for device secrets and SQLite or the backend for larger relational data when a real requirement exists.
- Do not claim offline support unless writes are queued, retries are idempotent, conflicts are resolved deliberately, and restart/reconnection behavior is tested.

## API, auth, and security

- Keep contract versions explicit. Update the Next.js and mobile schemas together before depending on a new response shape.
- Services return named result types and safe user-facing errors. Do not expose raw upstream errors, response bodies, or credentials.
- Use timeouts, validate every response, and handle loading, unavailable, empty, and retry states.
- Store production auth in platform-appropriate secure storage. Never use AsyncStorage for long-lived bearer or refresh tokens.
- Add camera, contacts, notifications, location, billing, advertising, background tasks, or analytics only for an approved feature. Document permission rationale, denial behavior, device testing, and data handling when added.

## UI

- Use React Native Paper consistently and keep colors, typography, radii, and spacing centralized in `src/constants/theme.ts`.
- Preserve visible focus, accessible labels, useful touch targets, readable wrapping, safe areas, and narrow-phone layouts.
- Screens must not depend on a live backend to render. Remote sections need intentional loading and unavailable states.
- Replace sample copy, tasks, identifiers, and metadata before releasing a real product.

## Verification

Run before handoff:

```bash
corepack yarn install --immutable
corepack yarn check
corepack yarn integration:check
```

`yarn check` covers formatting, lint, strict types, tests, and a static web export. The integration check requires the Next.js and PocketBase templates to be running and `EXPO_PUBLIC_API_BASE_URL` to point to the Next.js origin.

For UI changes, run `corepack yarn start` and inspect a narrow phone viewport or real device. Native permissions, deep links, push notifications, purchases, and signing changes always require device or store-build verification.
