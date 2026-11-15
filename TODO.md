# To do

## Do when starting a new project

Not built into the template yet. Do these first in every new project made from it.

References (read-only): TrackPal `expense-tracking-mobile` (`app.json`, `eas.json`, `package.json`, `scripts/publish-update.mjs`) and `website-mobile-template/template-mobile` (`eas.json`).

- [ ] **OTA updates and dev client.** `npx expo install expo-updates expo-dev-client`. In `app.config.js` set `runtimeVersion: { policy: 'appVersion' }` and `updates.url` from `eas update:configure` (owner runs `eas init` / `eas update:configure`; no agent logs in).
- [ ] **EAS profiles.** `eas.json` with `development` (`developmentClient`, internal), `development-apk` (`developmentClient`, `android.buildType: apk`), `preview` (internal), `production` and `production-apk` (`autoIncrement`, apk), each with a `channel` of the same name, `APP_ENV`, and an `https://` `EXPO_PUBLIC_API_BASE_URL` for release profiles. Keep `cli.appVersionSource: remote`.
- [ ] **Scripts.** `update:production` that publishes `eas update --channel production` with the production profile's environment and refuses a non-https API address (port TrackPal's `scripts/publish-update.mjs`); `android:dev` / `ios:dev` running `expo run:android` / `expo run:ios` for local builds.
- [ ] **Straight to Sign in / Create account.** Remove the welcome/onboarding route from the start flow (`app/(auth)/welcome.tsx`, `src/components/auth/WelcomeScreen.tsx`, `routes.welcome`, `AuthNavigator`) so the app opens on login with a link to register.
- [ ] **Guest mode off by default.** Put "Continue as guest" (`GuestSessionButton`, `GuestBanner`, `UpgradeGuestScreen`) behind a config flag that defaults to off; keep the code (hide, don't destroy).
- [ ] **Haptics off.** Add one switch in `src/services/platform/haptics.ts` that defaults to off, so every `haptics.*` call does nothing until the owner turns it on.

## Later

- [ ] `@gorhom/bottom-sheet` with a shared `components/ui/BottomSheet.tsx` wrapper (swipe down to close, no X, Back closes the sheet only).
- [ ] Theme registry and `AppThemeProvider` (system dark mode, user choice).
- [ ] Launch switches (remote feature flags for hiding unfinished features).
- [ ] Offline cache for reads and a write queue for offline changes.
- [ ] Real icon, adaptive icon and splash assets.
- [ ] `ui-tokens` check script (no hard-coded colours or sizes outside `src/theme`), as in TrackPal.
- [ ] Page help (short first-time explanation per screen).
- [ ] Screen-shaped loading skeletons for every list and detail screen.
- [ ] Batch of dormant native modules for the first store build, chosen per app: `expo-notifications`, `expo-task-manager`, `expo-background-task`, `expo-device`, `expo-file-system`, `expo-image-picker`, `expo-build-properties`, `@react-native-community/datetimepicker`, `@react-native-picker/picker`, `react-native-svg`, RevenueCat (`react-native-purchases`, `react-native-purchases-ui`), `react-native-google-mobile-ads` (list from `website-mobile-template/template-mobile`).
- [ ] Dependency audit step in CI (`yarn npm audit`), failing on high severity.
- [ ] Reconsider drawer navigation versus bottom tabs.
