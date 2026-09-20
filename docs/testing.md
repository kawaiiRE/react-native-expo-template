# Testing

Run `corepack yarn check` before handoff. It checks formatting, ESLint, strict TypeScript, unit tests, and a production-style static web export without depending on a live backend.

Run `corepack yarn integration:check` separately when Next.js and PocketBase are available. This verifies the deployed contract without making deterministic CI depend on external services.

For UI work, run the app and inspect a narrow phone viewport plus at least one native platform. Any native permission, secure storage, deep link, notification, background task, purchase, or signing change requires a real device or release-build test.
