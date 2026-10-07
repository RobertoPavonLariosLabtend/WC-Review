## 1. Native configuration

- [x] 1.1 Copy the supplied Firebase files to config/firebase and verify project and application identifiers.
- [x] 1.2 Install SDK-compatible Firebase, Google, Apple, crypto and Expo Router packages with Expo CLI; configure native plugins, service files, Apple entitlement and iOS scene support.
- [x] 1.3 Resolve Google OAuth IDs from configuration; handle missing values without fabricated credentials and document fresh configuration requirements.

## 2. Authentication service

- [x] 2.1 Add focused failing tests for form validation, normalized auth errors and provider cancellation, then implement those behaviors.
- [x] 2.2 Implement email login, Google credential exchange, Apple credential exchange with a random nonce and sign-out using Firebase modular APIs.
- [x] 2.3 Add an auth session provider with initialization state, user observation and listener cleanup.

## 3. Screens and routing

- [x] 3.1 Introduce Expo Router login and authenticated routes with guards that wait for session restoration.
- [x] 3.2 Build the Spanish login form with email/password, Google and supported native Apple controls, keyboard handling, pending state and errors.
- [x] 3.3 Preserve the counter in the authenticated screen and add user identity and sign-out.

## 4. Verification and handoff

- [x] 4.1 Run tests, lint, TypeScript, Expo Doctor, dependency compatibility and strict OpenSpec validation.
- [x] 4.2 Export both mobile bundles, regenerate native iOS and compile a Release simulator app.
- [x] 4.3 Verify login rendering, validation, pending/cancellation behavior and configured provider flows where user-controlled accounts are available; report all unverified provider outcomes.
- [x] 4.4 Document Firebase provider activation, Android signing fingerprints, Google client configuration and Apple account/capability requirements.

## 5. Provider follow-up requested by user

- [x] 5.1 Replace the iOS Firebase plist with the supplied updated configuration and verify identifiers.
- [x] 5.2 Remove Apple UI, service, native configuration and direct dependencies; preserve email and Google.
- [x] 5.3 Run focused tests, lint/typecheck, export and native iOS compilation; document outstanding Google Android configuration.
- [x] 5.4 Update the final auth specs and documentation before archiving.
