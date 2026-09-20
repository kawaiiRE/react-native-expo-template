# React Native Expo Template

[![CI](https://github.com/kawaiiRE/react-native-expo-template/actions/workflows/ci.yml/badge.svg)](https://github.com/kawaiiRE/react-native-expo-template/actions/workflows/ci.yml)

A production-minded Expo SDK 57 starter with Expo Router, React Native Paper, strict TypeScript, focused MobX state, validated persistence, and a versioned connection to the separate Next.js + PocketBase templates.

## What is included

- Responsive three-tab starter UI with reusable screen, card, empty, loading, and metric components
- A small persisted task domain demonstrating MobX only where cross-screen state is useful
- Zod-validated `GET /api/health` integration through the public Next.js gateway
- Safe loading, unavailable, and retry states without requiring a backend during build
- Yarn 4, ESLint, Prettier, Vitest, strict TypeScript, static web export, and immutable CI installs
- Expo configuration for iOS, Android, web, and optional EAS builds without speculative native permissions

## Start locally

1. Install Node 24 and enable Corepack.
2. Run `corepack yarn install --immutable`.
3. Copy `.env.example` to `.env`.
4. Set `EXPO_PUBLIC_API_BASE_URL` to the running Next.js origin. A physical phone needs your computer's LAN address rather than `127.0.0.1`.
5. Run `corepack yarn start` and open Expo Go, an emulator, or the web client.

## Work with the other templates

Run `pocketbase-next-backend-template` first, then `next-pocketbase-frontend-template`, and finally this app. Mobile requests `GET /api/health` from Next.js; Next.js validates and presents PocketBase's `GET /api/v1/health` response. No repository imports another repository's files.

With the stack running:

```bash
corepack yarn integration:check
```

The command fails on an unreachable gateway, non-2xx response, malformed payload, unavailable PocketBase service, or incompatible API version. See [docs/integration.md](docs/integration.md).

## Commands

```bash
corepack yarn start
corepack yarn android
corepack yarn ios
corepack yarn web
corepack yarn check
corepack yarn integration:check
```

## Turn it into a real app

Change the package name and the values in `.env`, replace the sample task domain one vertical slice at a time, and add native modules only when a product requirement needs them. Before a store release, add real icon and splash assets, unique bundle identifiers, signing credentials, privacy declarations, store metadata, and device-level acceptance tests.

Architecture and operating notes live in [docs/architecture.md](docs/architecture.md), [docs/testing.md](docs/testing.md), and [docs/deployment.md](docs/deployment.md).

## License

[MIT](LICENSE)
