# Deployment

## Native builds with EAS

1. Set unique `APP_NAME`, `APP_SLUG`, `APP_SCHEME`, `IOS_BUNDLE_IDENTIFIER`, `ANDROID_PACKAGE` and `EAS_PROJECT_ID`.
2. Store the public build variables per environment in EAS (`eas env:create`), for example `EXPO_PUBLIC_BACKEND=fastify` and `EXPO_PUBLIC_API_BASE_URL=https://api.example.com` for `production`. They are embedded in the bundle, so they must not contain secrets.
3. Build with `eas build --profile preview` (internal distribution) or `--profile production` (auto-incremented build numbers, `appVersionSource: remote`), then `eas submit --profile production`.

Signing credentials live in EAS, never in the repository.

## Backend requirements

- **Fastify:** add the production scheme to `CORS_ALLOWED_ORIGINS` (for example `myapp://`). Better Auth rejects mutations from an untrusted `expo-origin`.
- **Next.js gateway:** nothing extra; native clients use the bearer-token routes and send no `Origin`.
- Use HTTPS origins in production. Android blocks cleartext HTTP in release builds.

## Email links in the app

Set `APP_LINK_HOST` to the host in the backend's `APP_URL` and publish `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json` on that host (owned by the web frontend) for your Team ID / bundle ID and Android signing certificate. Verify on devices that verification and reset links open the app.

## Over-the-air updates

`expo-updates` is not included. Language changes that flip the layout direction restart the bundle with `reloadAppAsync`, which works without it. Add `expo-updates` only when you adopt EAS Update, and keep runtime versions aligned with native changes.

## Release checklist

Run `corepack yarn check`, `corepack yarn integration:check` against staging, build both platforms, test the upgrade from the previous store version, deep links, offline launch, account deletion and guest expiry, replace icons, splash and store metadata, and complete Apple and Google privacy declarations (the app stores credentials in the Keychain/Keystore and preferences in AsyncStorage, and collects no analytics).

## Web preview

`corepack yarn build:web` writes a static export to the ignored `dist/` directory. It is a verification and preview artifact; the Next.js and Nuxt templates are the primary web frontends.

## Recovery

The app holds no server data. Back up the chosen backend with its documented procedure (PocketBase backups for the gateway stack, PostgreSQL backups for Fastify). Keep signing credentials and store access in an approved secrets manager with documented ownership.
