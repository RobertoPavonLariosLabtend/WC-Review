# Authentication verification

The original checks below record the earlier implementation with Apple. A user-requested follow-up removed Apple from the final application and replaced the iOS plist; see the follow-up section at the end for current verification.

Verified on 2026-10-07 with Node 26.7.0, Xcode 27 and an iPhone 18 Pro simulator running iOS 27.

## Automated and build checks

- `npm test`: 10 passing tests covering credentials, normalized errors, cancellation, Google configuration and token exchange, Apple hashed/raw nonce handling, and serialized auth operations.
- `npm run check`: lint, TypeScript and Expo dependency compatibility passed.
- Expo Doctor: 21/21 checks passed.
- `openspec validate add-firebase-auth --strict`: passed.
- `npm run export`: production bundles exported for iOS and Android.
- Native iOS generation and CocoaPods installation completed.
- `CI=1 npm run ios:release -- --device 26E1A007-2C13-4583-A7D0-FC4788ABE0F4 --no-bundler`: Release build succeeded with zero errors and three warnings; installed and opened in the simulator. Repeated after the final keyboard handling change.

Build logs are in `/tmp/wc-review-firebase-ios-final.log` and `/tmp/wc-review-firebase-export-final.log` on the development machine. Android native compilation was not tested.

## Simulator checks

- Signed-out launch renders the Spanish email/password form and native Apple button.
- Empty email and password submissions show the appropriate validation message.
- Submitting synthetic credentials dismisses the keyboard and returns an error with the form available again. This does not establish successful authentication or provider activation.
- Google is disabled with an availability message because the supplied configuration has no OAuth client IDs.
- Apple opens its native flow. The simulator asks for an Apple account to be signed in through Settings. Closing that prompt returns to the usable form; no account or system settings were changed.

## Remaining external verification

Successful email, Google and Apple sign-in, session restoration across app restarts, authenticated routing and end-to-end sign-out remain unverified with real accounts. Enable the providers in Firebase, supply updated Google OAuth configuration, and configure Apple capabilities/accounts as described in the README. No Firebase users were created during verification.

Focused tests cover auth operation ordering and provider exchange boundaries; they do not replace native SDK, route or live-provider integration tests. Apple cancellation normalization is unit-tested; the simulator's missing-account prompt is not proof of a successful sign-in or normal account-picker cancellation.

## Review and dependency status

Code review findings were addressed: the unsupported Firebase observer error callback was removed, auth mutations now share a queue to prevent logout cleanup overlapping a new login, and missing-password validation has its own error code.

`npm audit` reports 35 dependency findings (10 moderate, 25 high). No forced dependency upgrades were applied. The native build has three warnings; it completed successfully.

## Final provider follow-up (2026-10-07)

- Replaced the iOS plist with the supplied GoogleService-Info (1).plist: matching project and bundle, CLIENT_ID and REVERSED_CLIENT_ID present. Android JSON still has no OAuth web client; Google remains disabled pending that configuration.
- Removed Apple UI, service, context state, plugin, entitlement, direct dependencies and obsolete Apple unit tests. No remote provider settings were modified.
- Current tests: 8/8 pass. Lint, TypeScript, dependency compatibility, Expo Doctor 21/21 and production exports for iOS/Android pass.
- Clean iOS native regeneration passed. Confirmed Apple's entitlement and native pod are absent and Google's callback URL scheme is present.
- Final iOS Release simulator build succeeded with zero errors and three warnings, installed and opened. Logs: /tmp/wc-review-no-apple-ios.log.
- Real email/Google account sign-in remains unverified; Android native compilation remains unverified. The earlier Apple checks above are historical.
