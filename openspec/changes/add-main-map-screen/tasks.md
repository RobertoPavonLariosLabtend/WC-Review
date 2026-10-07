## 1. Scope and contracts

- [x] 1.1 Update existing proposal/design/specs for user-authorized MapLibre and own editable catalogue; preserve owning feature branch.
- [x] 1.2 Add listPlaces to domain port/use case and validate catalogue selections without SDK dependencies.

## 2. Owned establishment catalogue

- [x] 2.1 Implement injectable catalogue adapter with cancellation, copy isolation, partial fields and photo membership validation.
- [x] 2.2 Bundle two sourced Madrid establishment descriptions/photos and display source/author/license credits.
- [x] 2.3 Replace composition adapter and remove unused Google Places service, endpoints and credentials configuration.

## 3. Native map and presentation

- [x] 3.1 Install MapLibre RN through Expo, remove react-native-maps and configure MapLibre plugin.
- [x] 3.2 Implement OpenFreeMap map, catalogue pins/labels, accessible catalogue selection and Camera with overlay padding/visible attribution.
- [x] 3.3 Retain auth/logout, bounded card, location on request, stale-response invalidation and layout crash regression; add catalogue/map loading, failures, retries and empty state.

## 4. Verification and delivery

- [x] 4.1 Run app tests, lint/typecheck/Expo compatibility and strict OpenSpec validation.
- [x] 4.2 Export both mobile bundles and regenerate/compile iOS and Android without Google Maps keys.
- [ ] 4.3 Verify native map rendering, real marker selection, photographs/credits, dismissal, camera, text/small screen, location denial and session transitions on both platforms; record exact limits.
- [x] 4.4 Update setup/architecture/README and verification evidence, commit scoped changes on feature/main-screen and push for review, preserving unrelated appleTeamId and main.
- [ ] 4.5 Sync/archive only after required native acceptance is complete. Passing builds alone do not satisfy acceptance.
