# Deployment

## Native builds

Create a unique EAS project, set `EAS_PROJECT_ID`, replace the example bundle identifiers, and configure signing credentials in EAS rather than source control. `eas.json` includes only preview and production profiles; add a development client when a chosen native dependency requires it.

Before release, run the quality gate, build both target platforms, test upgrades from the previous version, verify deep links and network failure behavior, and complete current Apple and Google privacy declarations.

## Web preview

`corepack yarn build:web` produces an ignored `dist/` directory. It is a build verification and optional preview artifact; the Next.js repository remains the primary web frontend.

## Recovery

Mobile source and signing configuration are separate from application data. Back up the PocketBase service through its documented consistent backup process. Keep signing credentials and store access in an approved secrets manager, with recovery ownership documented outside the repository.
