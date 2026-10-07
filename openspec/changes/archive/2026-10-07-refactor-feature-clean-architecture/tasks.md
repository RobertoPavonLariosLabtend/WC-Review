## 1. Auth boundaries and use cases

- [x] 1.1 Add failing tests for injected auth cases: validation blocks repository calls, email trim/password preservation, Google cancellation, session unsubscribe, logout errors and provider availability.
- [x] 1.2 Define AuthUser/AuthRepository under features/auth/domain, implement createAuthUseCases under use-cases, move SDK adapter/helpers under repository and map users to plain models; retain provider/queue tests.

## 2. Feature UI and counter

- [x] 2.1 Add failing counter tests for read/increment/reset and independent instances; implement CounterRepository contract, memory adapter and createCounterUseCases.
- [x] 2.2 Move login, auth provider/guards and counter UI into feature ui folders; inject cases through src/composition/AppProviders.tsx and reduce src/app to route adapters; delete legacy service/context files.

## 3. Verification and delivery

- [x] 3.1 Add architecture boundary tests; run all tests, lint, TypeScript, Expo checks, mobile export, strict OpenSpec validation and Android native build.
- [x] 3.2 Review changes, document feature layout and verification limits; commit and push feature/clean-architecture, integrate into main after verification, preserving the pre-existing unstaged app.json edit.
