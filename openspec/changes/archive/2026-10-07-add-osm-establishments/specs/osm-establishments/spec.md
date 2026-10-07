## Purpose

Permitir explorar establecimientos de OpenStreetMap por zona y abrir fichas con los datos y fotografías disponibles, sin exigir una cuenta de facturación.

## ADDED Requirements

### Requirement: Discovery by map area
The app SHALL load OSM establishments for the initial Madrid area and SHALL allow searching the current map area explicitly. It MUST bound area, frequency and results, and MUST NOT promise exhaustive coverage.

#### Scenario: Search another area
- **WHEN** the user moves the map and presses Buscar en esta zona
- **THEN** the returned establishments appear as selectable points and accessible choices

#### Scenario: Area too large
- **WHEN** the user searches an area exceeding the supported size
- **THEN** the app asks the user to zoom in without issuing an unbounded request

### Requirement: Partial attributed establishment cards
Each returned point SHALL open a card with its name and available category, address, opening hours, website and toilet information. Missing description or photograph MUST be explicit. OSM and image credits MUST be visible. A missing toilet tag MUST NOT be interpreted as confirmation of a toilet.

#### Scenario: Establishment without optional data
- **WHEN** the user selects an OSM place without photo, description or toilet information
- **THEN** the card still opens, identifies OSM as its source and makes the missing data clear

#### Scenario: Linked Commons photograph
- **WHEN** a place links a supported Commons file with reusable license metadata
- **THEN** its photograph loads on selection with author, original source and license

#### Scenario: Linked category or Wikidata entity
- **WHEN** a place links its Commons category or its own Wikidata entity with an image or Commons category
- **THEN** the app attempts a bounded image lookup through those exact associations and displays a supported reusable photo with original, author and license

#### Scenario: Unassociated business
- **WHEN** a place has no supported image association
- **THEN** the app does not substitute a generic brand or nearby business photo and shows that no photo is available

### Requirement: Controlled reliable network loading
The app SHALL reuse recent area results, cancel obsolete loads, and show understandable loading, empty, failure and rate-limit states with manual retry. Late responses MUST NOT replace newer searches or a different session. Photo failures MUST NOT hide the place details.

#### Scenario: Obsolete search
- **WHEN** a search finishes after a newer search or session disposal
- **THEN** its results do not replace the current state

#### Scenario: Provider unavailable
- **WHEN** Overpass fails or rate limits a request
- **THEN** the app explains the failure, preserves previous successful points and offers manual retry without automatic repeated requests
