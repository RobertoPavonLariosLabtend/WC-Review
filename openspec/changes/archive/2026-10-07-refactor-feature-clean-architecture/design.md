## Context

See proposal.md. Expo 57 and Expo Router use route files in src/app. Authentication currently imports Firebase into the shared context and screens call native services directly. The counter stores its value in React state. Existing behavior is defined by user-auth and minimal-app.

## Goals / Non-Goals

Goals: Feature ownership, injected repositories, framework-independent use cases and plain session models; unchanged routes and Spanish UI.
Non-Goals: New dependencies, DI frameworks, backend changes, persistent counter storage, new providers or account creation.

## Decisions

- Each feature contains ui/, domain/, use-cases/ and repository/. Repository interfaces live in domain so dependency direction points inward; concrete Firebase/in-memory adapters live in repository. A global layers-only layout was rejected because feature changes should stay together.
- AuthUser exposes only id, email and displayName. A mapper copies those properties from Firebase users, so native SDK objects and token operations never reach React state.
- Auth use cases validate email/password, invoke the repository for email/Google/session/logout and expose provider availability. UI calls injected use cases. SDK credential exchange and the existing auth operation queue stay in the repository, preserving logout cleanup ordering. Errors remain normalized for the existing Spanish UI; Google cancellation still returns null.
- The counter has a synchronous in-memory repository (get/save), injected read/increment/reset cases and a UI-owned instance per screen. Do not share a singleton counter across users or screen remounts. React renders returned values; arithmetic is in use cases.
- src/composition/AppProviders.tsx is the only wiring point importing concrete repositories. Route files adapt feature screens and guards to Expo Router; they contain no SDK calls or business logic. React providers accept use cases and handle subscription lifetime.
- Retain focused provider/queue tests and add fake-repository tests proving validation, delegation, session cleanup, user mapping and isolated counter state. TypeScript AST boundary tests prohibit SDK imports outside repository and infrastructure imports from UI/domain/use-cases.

## Risks / Trade-offs

- Session object change -> mapper and use-case tests, typecheck and production bundles.
- Listener leaks/retry behavior -> keep cleanup and active guard in AuthProvider; prove the observe use case returns the repository unsubscribe.
- Counter singleton leak -> create its repository per feature screen instance and test separate instances.
- Node tests import TypeScript directly -> use explicit .ts for runtime imports in pure modules and enable allowImportingTsExtensions under noEmit.
- Live Google sign-in remains account dependent -> do not claim success from compilation or mocks.
- Local app.json change -> preserve it unstaged through commits/merge.

## Migration Plan

Move existing logic and UI into features, implement domain contracts and use cases, wire providers, reduce routes, remove old global service/context paths, update documentation, validate tests/lint/typecheck/exports/native build. Commit to feature/clean-architecture and integrate into main only after checks pass, following CONTRIBUTING.md. Rollback is a revert of the feature merge; Firebase configuration and accounts are unaffected.
