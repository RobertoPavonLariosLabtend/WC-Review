## Purpose

Permitir al usuario autenticado explorar establecimientos sobre Google Maps y consultar una ficha superpuesta sin abandonar la pantalla ni perder el contexto del mapa.

## ADDED Requirements

### Requirement: Authenticated map and global user
The application SHALL show Google Maps on iOS and Android after session restoration identifies an authenticated user. It SHALL consume the existing shared session, show the user's display name or email when available, and retain sign out. Session loss SHALL remove access to the map and clear the selected establishment.

#### Scenario: Authenticated entry
- **WHEN** the signed-in user opens the initial screen
- **THEN** a Google map and user controls appear without requiring another login

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
The application SHALL allow selecting a Google point of interest with a valid place identifier and SHALL load its details. Selection SHALL be limited to points of interest available from the current map presentation; the app SHALL NOT claim an exhaustive catalogue of all establishments.

#### Scenario: Select a place
- **WHEN** the user taps a selectable establishment on the map
- **THEN** its selection is indicated and its information is loaded in the same screen

#### Scenario: Tap ordinary map area
- **WHEN** the user taps a location without a place identifier
- **THEN** no establishment details request is made

### Requirement: Partial overlay establishment card
The application SHALL show a dismissible lower card above the map with the selected establishment's name, one photo and its provider description when available. In its normal presentation the card SHALL occupy at most half of the usable screen height, keep the uncovered map interactive, support scrolling its content and respect safe areas and text accessibility. The card SHALL allow future information or actions without changing the map navigation flow.

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
The application SHALL display a neutral image placeholder when a photo is missing or fails and SHALL display Descripción no disponible when the provider supplies no description. It SHALL NOT invent descriptions. Provider and photo author attributions SHALL be shown where required and map attribution SHALL remain unobscured.

#### Scenario: No optional data
- **WHEN** details contain a name but no photo or description
- **THEN** the name, image placeholder and Descripción no disponible appear

#### Scenario: Photo supplied with attribution
- **WHEN** a provider photo with author attribution is shown
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

### Requirement: Provider configuration and protected details
The application SHALL use platform-restricted native Maps credentials and SHALL obtain details and photos through an authenticated service which keeps its Places service credential outside the distributed client. The service SHALL validate requests and limit request volume and image size. Missing configuration SHALL produce a readable Spanish unavailable state with working sign out rather than a misleading empty screen.

#### Scenario: Unauthenticated service request
- **WHEN** a details or photo request lacks a valid session
- **THEN** it is rejected without querying the provider

#### Scenario: Missing map configuration
- **WHEN** required native map configuration is absent
- **THEN** the screen explains the map is unavailable and allows sign out

#### Scenario: Excessive or malformed request
- **WHEN** a service request is malformed or exceeds its configured allowance
- **THEN** it is rejected with a controlled error without an unrestricted provider request
