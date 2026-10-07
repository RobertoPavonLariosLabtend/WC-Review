## Purpose

Permitir al usuario autenticado explorar establecimientos sobre MapLibre y consultar una ficha superpuesta sin abandonar la pantalla ni perder el contexto del mapa.

## ADDED Requirements

### Requirement: Authenticated map and global user
The application SHALL show a MapLibre map on iOS and Android after session restoration identifies an authenticated user. It SHALL consume the existing shared session, show the user's display name or email when available, and retain sign out. Session loss SHALL remove access to the map and clear the selected establishment.

#### Scenario: Authenticated entry
- **WHEN** the signed-in user opens the initial screen
- **THEN** a MapLibre map and user controls appear without requiring another login

#### Scenario: Session ends
- **WHEN** the session ends while an establishment is selected
- **THEN** login appears and neither selection nor pending results are shown to the next user

### Requirement: Map navigation and optional location
The application SHALL allow panning and zooming without location permission. It SHALL start at a documented default region and request foreground location only when the user presses the location control. Denial or location failure SHALL leave manual map navigation usable.

#### Scenario: No location permission
- **WHEN** the user opens the map without granting location
- **THEN** the default region is shown without a permission prompt

#### Scenario: Center on location
- **WHEN** the user requests centering and location is available with permission
- **THEN** the map centers on the current location

#### Scenario: Location unavailable
- **WHEN** location is denied or cannot be obtained
- **THEN** a readable Spanish message appears and the map remains interactive

### Requirement: Select visible establishments
The application SHALL allow selecting an establishment marker from the injected establishment repository with a valid returned identifier and SHALL load its details. Selection SHALL be limited to points of interest available from the current map presentation; the app SHALL NOT claim an exhaustive catalogue of all establishments.

#### Scenario: Select a place
- **WHEN** the user taps a selectable establishment on the map
- **THEN** its selection is indicated and its information is loaded in the same screen

#### Scenario: Tap ordinary map area
- **WHEN** the user taps a location without a place identifier
- **THEN** no establishment details request is made

### Requirement: Partial overlay establishment card
The application SHALL show a dismissible lower card above the map with the selected establishment's name, one photo and its supplied description when available. In its normal presentation the card SHALL occupy at most half of the usable screen height, keep the uncovered map interactive, support scrolling its content and respect safe areas and text accessibility. The card SHALL allow future information or actions without changing the map navigation flow.

#### Scenario: Details available
- **WHEN** the selected establishment's details load
- **THEN** its name, photo and available description appear in a lower card while part of the map remains visible and interactive

#### Scenario: Dismiss card
- **WHEN** the user presses the card's close control
- **THEN** the card and selected-place highlight disappear and the current map viewport is retained

#### Scenario: Small screen or large text
- **WHEN** content exceeds the bounded card height
- **THEN** the card content scrolls while the uncovered map remains available

### Requirement: Partial data and photo attribution
The application SHALL display a neutral image placeholder when a photo is missing or fails and SHALL display Descripción no disponible when the repository supplies no description. It SHALL NOT invent descriptions. Provider and photo author attributions SHALL be shown where required and map attribution SHALL remain unobscured.

#### Scenario: No optional data
- **WHEN** details contain a name but no photo or description
- **THEN** the name, image placeholder and Descripción no disponible appear

#### Scenario: Photo supplied with attribution
- **WHEN** a place photo with author attribution is shown
- **THEN** the attribution is displayed with the photo

### Requirement: Loading failure and selection consistency
The application SHALL show loading and actionable Spanish errors inside the card without blocking map navigation. It SHALL offer retry for failed details requests. Only the currently selected place SHALL receive asynchronous results; closing the card, changing selection or ending the session SHALL invalidate previous results.

#### Scenario: Rapid selection
- **WHEN** the user selects B while A is loading and A completes later
- **THEN** the card remains associated with B and does not display A's details

#### Scenario: Details failure
- **WHEN** the selected place cannot be loaded
- **THEN** the card displays an error and retry while the map remains usable

#### Scenario: Close during loading
- **WHEN** the card is closed before the request completes
- **THEN** its response does not reopen the card

### Requirement: Map without billing and injected establishment data
The application SHALL render MapLibre on iOS and Android using OpenFreeMap without Google Maps/Places credentials or a billing account. It SHALL obtain selectable places, available descriptions and credited photographs through an injected establishment repository. It SHALL NOT query Google Places. The active OSM discovery and image associations SHALL follow the osm-establishments capability. Base-map POIs absent from the returned places SHALL NOT open misleading or invented details. A readable Spanish map loading failure SHALL offer retry and preserve sign out and access to already loaded places.

#### Scenario: No Google credentials
- **WHEN** the app is built with no Maps keys or Places URLs
- **THEN** the native map can load from OpenFreeMap and returned establishment cards are available

#### Scenario: Establishment photo and description
- **WHEN** the user selects a returned marker or its accessible list button
- **THEN** the same returned identifier loads its available details and associated photograph with its credits

#### Scenario: Map provider unreachable
- **WHEN** the map style fails to load
- **THEN** a Spanish error and map retry appear while already loaded establishment cards and sign out remain available

#### Scenario: Empty establishment results
- **WHEN** the repository returns no establishments
- **THEN** an explicit empty message appears and the map remains usable

#### Scenario: Unknown place or mismatched photo
- **WHEN** a request refers to a place absent from the returned establishments or a photo belonging to another place
- **THEN** the repository rejects it without a provider request
