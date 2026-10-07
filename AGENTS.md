This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Feature architecture

Read `docs/architecture.md` before adding features. Each feature owns `ui/`, `domain/`, `use-cases/` and `repository/`. UI calls injected use cases, which depend only on domain contracts. Concrete repositories and native SDKs stay in `repository/`; `src/composition/` wires them. Routes in `src/app/` are adapters. Run `npm test` to check architecture boundaries. Follow `CONTRIBUTING.md`: one branch per feature from main, no develop, verify before merging and merge only when the user explicitly requests integration.

These conventions apply to all future changes in this repository:
- Extend the feature that owns the behavior, keeping ui/, domain/, use-cases/ and repository/ together.
- Domain and use cases must be independent of React, Expo and data SDKs. Keep SDK objects and tokens outside UI/domain.
- Plan features in OpenSpec and verify with npm test and npm run check before integration. Use skip_specs: true only for refactors that preserve product behavior.
- Use one feature/ branch per feature, or fix/ and chore/ branches, from main with conventional commits. Keep implementation, verification and OpenSpec archives on the owning feature branch. Passing checks or archiving does not authorize a merge: integrate into main only when the user explicitly requests it. No develop or force pushes to main. Preserve unrelated local edits.
- Verify mobile exports for app changes and affected native builds for native changes. Report live-provider verification limits honestly.
