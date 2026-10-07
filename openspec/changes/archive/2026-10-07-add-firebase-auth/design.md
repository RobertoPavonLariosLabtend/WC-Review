## Context

See proposal.md for motivation. Expo 57, React Native 0.86, TypeScript and iOS scene support already exist. The current app is a single counter screen. Both supplied Firebase files belong to wc-review-11c48 and com.wcreview.app. The plist has no CLIENT_ID or REVERSED_CLIENT_ID; Android oauth_client is empty.

## Goals / Non-Goals

**Goals:** A shared authentication service, native provider integrations, restored sessions and a Spanish login UI with honest configuration errors.

**Non-Goals:** Email registration, password reset, account deletion, Firestore, backend authorization rules and Apple OAuth on Android. Email login uses existing Firebase accounts. Social providers may create accounts through Firebase as part of their standard sign-in flow.

## Decisions

- Use @react-native-firebase/app and auth with the modular API and supplied native service files. The Firebase JS SDK is an alternative but requires web-app configuration and extra persistence setup; a custom backend adds unnecessary scope.
- Keep configuration files in a project-owned config/firebase directory and wire them through Expo googleServicesFile properties. Preserve enableSceneSupport; use supported Firebase Expo plugins and required native build settings rather than editing generated projects.
- Use the documented CocoaPods option for RNFB 26.4: disable SPM and use static frameworks with RNFBApp and RNFBAuth forced to static linkage, alongside the prebuilt React Native core. Pin indirect React DOM, Reanimated and Worklets dependencies to Expo 57's compatible versions.
- Google: use a maintained native Google Sign-In library to obtain an ID token and exchange it for a Firebase credential. Read iOS client, reversed URL scheme and Android web OAuth client from updated configuration; never invent IDs. Missing configuration disables that provider with a readable explanation while other methods work.
- Apple: expo-apple-authentication plus expo-crypto; generate a cryptographically random nonce, send its SHA-256 digest to Apple, pass the raw nonce with the identity token to Firebase. Use the native Apple button and isAvailableAsync; restrict to iOS. No client secrets are placed in the application.
- Centralize credential exchange, auth observation and sign-out in src/services/auth. Manage initialization and user state in an AuthProvider that unsubscribes on unmount. Firebase persists the native session; do not store passwords or tokens manually.
- Follow AGENTS.md and use Expo Router for login and authenticated routes. Replace the custom entry point with expo-router/entry. Keep service, context and presentational components outside the route directory. Preserve the starter counter inside the authenticated route.
- Show a Spanish email/password form with secure password entry, keyboard handling, pending state, cancellation handling and a normalized error map. Use a generic credentials error to avoid exposing account existence.
- Verify validation and error/cancellation behavior with focused tests; run lint, TypeScript, Expo checks, mobile bundles and iOS Release compilation. Verify real provider success only with user-controlled accounts and completed external provider setup. Do not silently create test accounts in the production Firebase project.

## Risks / Trade-offs

- Missing Google OAuth configuration → enable Google in Firebase Authentication, configure Android signing fingerprints and download fresh files; independently build and verify other methods. Google success remains unverified until configured.
- Unknown Firebase provider status → document activation of Email/Password, Google and Apple and report live configuration failures accurately.
- Apple entitlement and account setup → configure usesAppleSignIn and its plugin, enable the App ID capability and the Firebase Apple provider. A simulator build is not proof of successful Apple login on a signed physical device.
- Native dependency compatibility → install with Expo CLI, check upstream versions and SDK 57 guidance, regenerate projects and compile before completion claims.
- Full real-provider verification requires credentials → ask the user to complete sign-in interactively; never request passwords in chat.

## Migration Plan

1. Copy the supplied Firebase files into the project and configure supported native plugins.
2. Introduce the authentication service, session context and routes.
3. Regenerate native projects, run checks and compile iOS.
4. Confirm login UI and failure/cancellation paths; document external setup and any provider that cannot yet be verified.
5. To roll back, restore the existing app entry and app configuration and regenerate native projects. No existing Firebase accounts or data are migrated or deleted.

## User-requested follow-up (2026-10-07)

Replace the iOS plist with GoogleService-Info (1).plist for the same project and bundle ID. It now supplies CLIENT_ID and REVERSED_CLIENT_ID. Android's existing JSON still has no web OAuth client, so Google remains gated until that client is supplied, as required by the current token exchange setup. Remove Apple from the app, including its service, button, context state, plugin, entitlement and direct dependencies. No Firebase Console provider or account is changed. The earlier Apple implementation and verification above are historical; the final supported methods are email and Google.
