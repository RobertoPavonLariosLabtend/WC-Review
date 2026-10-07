## Context

See proposal.md. Auth already owns domain contracts, injected use cases, a serialized Firebase adapter and UI. Expo Router guards signed-out and authenticated routes.

## Goals / Non-Goals

Goals: Add email registration inside the existing auth boundaries with Spanish validation/errors and the existing session observer.
Non-Goals: Password reset, email verification, profile editing, new dependencies, native configuration or remote test accounts.

## Decisions

- Extend AuthRepository with createAccount(email, password): Promise<AuthUser> and createAuthUseCases with createAccount(email, password, confirmation). The case validates registration and trims email without changing passwords; the adapter calls modular createUserWithEmailAndPassword inside the existing queue and maps the Firebase user. Direct SDK calls from UI are rejected.
- Keep a six-character local minimum, matching the default Firebase baseline; provider-specific stricter policy is enforced by Firebase and mapped to readable errors. Confirmation is local validation only. Login password validation remains unchanged for existing accounts.
- Add RegisterScreen under auth/ui, a thin src/app/register.tsx route and a signed-out guard. Share presentation styles with LoginScreen and use Expo Router links for entry/return. A separate feature for registration would split ownership of the same repository/session, so it stays in auth.
- Use a submission ref lock and pending state. Successful creation signs in automatically; AuthProvider observation drives protected routing. No duplicate manual navigation or account creation in tests.

## Risks / Trade-offs

- Firebase password policies can exceed six characters -> surface weak-password/policy failures from the provider.
- Duplicate submissions -> ref lock plus disabled inputs/button.
- Signed-in users opening register -> guarded route; retain current session initialization boundary.
- Real registration creates remote state -> use fake repositories in tests and report live verification as pending.

## Migration Plan

Add tests, domain/case/adapter, form/links/route, run boundary tests/lint/typecheck/mobile export, review and integrate feature/email-registration into main after verification. No backend migration or native changes are required; rollback reverts the feature merge.
