## Context

See proposal.md for motivation and specs/main-map/spec.md for the behavior contract. AuthProvider already holds a plain AuthUser globally and observes Firebase through injected use cases. The initial route currently renders CounterFeature. Expo 57 uses native development builds for Firebase; Google must be the map provider on both platforms.

## Goals / Non-Goals

**Goals:** Keep session ownership in auth, isolate place data behind domain ports, retain native map interaction while showing details, and allow adding card sections later.

**Non-Goals:** No duplicate user store, persisted selection, background tracking, custom business catalogue, search/filter system, reviews, favourites or speculative extra fields. Future extensibility is a layout/composition boundary, not dummy buttons.

## Decisions

### Map selection and layout

Use react-native-maps with PROVIDER_GOOGLE on iOS and Android, compatible with the installed Expo version. Translate onPoiClick payloads to plain { placeId, name, coordinate } selections at the UI boundary. Establishment coverage follows Google's visible POIs and zoom level; do not attempt to download all businesses. Ordinary coordinate taps are not place selection.

The card is anchored to the bottom safe area, with rounded upper corners, a close control, name, a bounded landscape photo, description, attribution and a section area for future content. Max height is 50% of usable screen height; content scrolls internally. Keep map logo/attribution and location controls visible using insets/padding; account for the selected point when moving the camera. Dismiss retains the current viewport. User name and sign out occupy a compact top overlay.

Alternatives: a full-screen detail route loses the requested geographic context; a draggable full-screen sheet adds gesture complexity without a current need; search plus custom markers is a larger independent feature. Use a bounded card now.

### Existing global session and lifecycle

Reuse useAuth() and the existing guarded index route. No Redux/Zustand or second Firebase listener. Shared state is the user session; place selection is local to the main screen and cleared on unmount/user identity change. Keep logout behavior and errors consistent with auth. Composition instantiates main use cases and injects repositories; index remains a route adapter.

### Clean Architecture boundaries

Add src/features/main-screen/:
- domain/: PlaceSelection, EstablishmentDetails (id, name, coordinates, optional address/description/photo with author credits), Coordinates, PlacesRepository and LocationRepository contracts. No provider objects or credentials.
- use-cases/: validate place selection, obtain establishment details/photo and optionally obtain current coordinates through injected ports. Errors are plain typed outcomes.
- repository/: Firebase service adapter, provider-to-domain normalization and expo-location adapter. Native/service SDKs remain here. Photo fetching resolves to displayable local data without credential-bearing URLs in UI.
- ui/: MainScreen, map presentation, EstablishmentCard and hooks for selection/loading. Google Maps is a presentation component; Places data access still goes through use cases.

Use a request generation counter and cancellation where supported: only the latest place/current user may update UI. Closing, logout and unmount invalidate all results. Show loading immediately; an error keeps the selected name available and allows retry. Photo failure does not fail the whole card. Do not log tokens or provider credentials.

### Details and photo service

Recommend Firebase HTTPS functions under functions/, authenticated using Firebase ID tokens validated server-side. The mobile adapter receives authentication through the native Firebase service in the repository layer; UI/domain never receive tokens. A details endpoint accepts a bounded placeId and requests only id, displayName, location, formattedAddress, editorialSummary, photos and required attributions, with Spanish language preference. editorialSummary is optional; never generate a substitute description. The first photo is fetched on demand with a bounded resolution; optional image delivery returns validated content via authenticated service, not a URL exposing the server API key. Validate that photo resource names belong to the requested place, bound timeouts/response sizes, and return controlled errors.

Store the Places key in a server secret, separate from restricted Maps iOS/Android keys supplied via build environment and app.config.ts. Configure per-user rate limits (30 detail and 30 photo requests/minute initially), provider quotas and bounded images (max 800px, max response 5MB), using a shared transactional limiter for server instances. Keep only short-lived request/selection state; do not persist Places content or photo resource names. Keep Google and photo-author attributions intact. Document required API activation, Firebase functions configuration and applicable regional provider availability during implementation.

Alternatives: putting an unrestricted Places web-service key in the mobile bundle is unsuitable; native Places SDK bridges avoid the service but require additional platform implementations and integration. A Firebase service fits the existing project and gives one domain adapter; it introduces a deployment dependency, shown explicitly in tasks.

### Location and configuration behavior

Start at Madrid (40.4168, -3.7038), an explicit provisional default that is easy to change. Request foreground location only after pressing Mi ubicación. No background collection or auto-prompt. Permission denial/timeouts retain the map and show Spanish feedback. This control is optional for map use.

Do not mount an unconfigured native Google map; show configuration feedback and sign out. Maps can remain usable if the details service is unavailable; that error belongs to the card. Missing editorial summary/photo uses the specified fallbacks. Photo attribution is part of the layout, including its scroll behavior.

## Risks / Trade-offs

- [POI tap support depends on native provider integration] → Verify on both compiled platforms before accepting selection; check the compatible version's event contract.
- [Photos or editorial summaries are unavailable for some businesses] → Explicit fallbacks; require real-place testing with complete and partial data.
- [Provider configuration and service deployment are required] → Separate local checks from live-provider acceptance; never mark this complete using fixtures alone.
- [Editorial summary requests have their own billing tier] → Explicit field mask, fetch on selection only, limits and documented Google Cloud setup; no fetch on every map movement.
- [Repeated taps and logout produce stale results] → Invalidation by request generation/user identity and dedicated race tests.
- [Card obscures map controls on smaller devices] → Bound height, scroll contents, safe-area padding and native visual checks.

## Migration Plan

1. Develop on feature/main-screen, based on feature/login; preserve unrelated app.json edits. No main merge.
2. Implement/test the protected Firebase service and document its environment configuration. Prepare any remote deployment for explicit user authorization.
3. Add native dependencies and restricted Maps configuration; rebuild both platforms.
4. Wire the main-screen composition into index, remove the unused counter feature and its tests/composition after replacing the initial-screen specification.
5. Run use-case/architecture/service checks, lint/typecheck, mobile exports and native builds. Verify POI tap, photos, description/fallback, location denial, logout and quick reselection in real builds.
6. Record verification and provider limits, sync/archive the completed OpenSpec change on this feature branch and push. Integrate only on an explicit later request.
7. Rollback by reverting the main-screen implementation commits on its branch; the login/session feature remains available.

## References

- Expo 57 map setup: https://docs.expo.dev/versions/v57.0.0/sdk/map-view/
- MapView event API: https://github.com/react-native-maps/react-native-maps/blob/master/docs/mapview.md
- Places details and field masks: https://developers.google.com/maps/documentation/places/web-service/place-details
- Photos and attribution: https://developers.google.com/maps/documentation/places/web-service/place-photos
