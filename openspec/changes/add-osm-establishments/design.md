## Context

See proposal.md. Main-screen already has injected PlacesRepository, a generation-cancelled selection loader and a native MapLibre component. SDK 57 is installed; no native dependency changes are needed. The feature remains on its existing feature/main-screen branch.

## Goals / Non-Goals

**Goals:** bounded OSM discovery, safe partial fichas, transparent source and reusable photo credits, public-service-friendly requests.

**Non-Goals:** exhaustive business directory, Google-quality photo coverage, user uploads/reviews, automatic Wikipedia enrichment, or a production SLA for public Overpass.

## Decisions

- Domain gains plain bounds and optional detail fields. listPlaces accepts an optional bounds argument to preserve the editorial adapter and existing callers. Use cases validate bounds and selections independently of React/native libraries.
- A session-scoped Overpass repository posts a numeric bbox query for named food/drink businesses, shops, hotels and tourist sites, and toilets (which can be unnamed). Use the public overpass-api.de instance, identifying WCReview via User-Agent as its usage policy requires. Initial probes returned 406/504, but identified queries subsequently succeeded; Private.coffee was also evaluated and timed out. No automatic multi-server fallback or request bursts. It requests node/way/relation centers and maps stable osm-type-id identifiers. Max extent 0.05 degrees in each axis, max 300 results. Recent area responses cache for five minutes with a bounded cache; requests are spaced by at least five seconds, with a one-minute cooldown after 429/406. No keys or Firebase tokens are sent.
- Details come from the same response, so selecting a point does not issue another Overpass request. Records are bounded and retained with cached query results. Invalid elements are ignored; provider remarks indicating an incomplete query are errors, not silent empty results.
- Commons photos load only on selection, only for directly linked File: tags (wikimedia_commons/image). Resolve metadata through the Commons API, require author/license/source and an approved reusable license, allow HTTPS Wikimedia thumbnails only. External arbitrary image links and categories have no automatic photo. Descriptions use OSM description:es/description when present.
- Map onRegionDidChange copies plain visible bounds immediately. UI performs initial Madrid search and later explicit searches; camera selection/padding never automatically fetches. Previous successful points remain during loading/errors. A generation-based list loader cancels stale requests/disposal. The horizontal accessible list virtualizes all returned entries, initially rendering eight, while all returned points remain selectable on the map.
- UI displays counts/limit and source, named empty/error/zoom/cooldown messages, category/hours/website and recorded toilet availability/accessibility. Unknown toilet data is displayed as unknown. Composition replaces the bundled catalogue adapter; editorial assets remain available for later editorial augmentation rather than pretending to be live OSM data.

## Risks / Trade-offs

- Public Overpass can be overloaded → bounded bbox/output, timeouts, explicit refresh, cache and cooldown; production scaling may need a separate service.
- OSM fields and photos are incomplete → fallbacks and recorded-data labels; no fabricated descriptions or toilets.
- Raw community tags/Commons HTML → plain-text mapping, capped text, HTTPS website filtering, fixed provider endpoints, reusable license check and Wikimedia-only image URLs.
- Node/way duplicates or centers outside a polygon → stable IDs, deduplication by ID and bbox filtering; no unsupported claim of complete coverage.

## Migration Plan

Switch composition to the OSM repository; export both mobile bundles and verify the existing iOS development client. Rollback is restoring the bundled adapter. No native rebuild, remote deployment or main merge is required.
