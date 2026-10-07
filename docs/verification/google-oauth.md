# Google OAuth configuration verification

Verified on 2026-10-07 in `feature/google-oauth-config`.

- Incorporated the supplied `google-services (1).json` into `config/firebase/google-services.json`.
- Project `wc-review-11c48` and package `com.wcreview.app` match the existing iOS configuration. The JSON contains a web OAuth client (`client_type: 3`) and its iOS client matches the plist.
- Resolved Expo configuration includes the web client, iOS client and Google callback URL scheme. The existing availability checks now enable Google on iOS and Android; Apple remains absent.
- Eight auth tests, lint, TypeScript and Expo dependency compatibility pass. Production iOS and Android bundles export successfully.
- Android native generation copies the updated JSON; the generated Google Services resource contains the expected web client ID.
- Android debug build succeeded, installed and opened on the running `flutter_emulator` with Java 21 and Android SDK 36. Log: `/tmp/wc-review-google-oauth-android-build.log`.
- An initial build failed deleting a Gradle merge-output directory. Removing that generated directory and retrying resolved the failure; application data and source files were not removed.

Successful Google authentication with a real account remains unverified. Android sign-in also depends on an Android OAuth client registered for the package and the actual signing certificate. The supplied JSON lists the web client in its app-level OAuth clients; live registration of the Android signing certificate was not verified through Firebase/Google Cloud Console. No Firebase users or remote provider settings were changed.

The production bundle for iOS was exported with the new configuration; its native binary was not rebuilt in this follow-up. Android compilation is a debug development build, not a production store release. Restart Metro after configuration changes if a previously running development server still serves the old configuration.
