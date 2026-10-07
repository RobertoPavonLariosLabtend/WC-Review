## MODIFIED Requirements

### Requirement: Initial screen
The app SHALL show login when no session exists and SHALL show the Spanish main MapLibre map screen after session restoration identifies an authenticated user.

#### Scenario: Fresh launch
- **WHEN** the user opens the installed app without a session
- **THEN** the login screen appears after session initialization

#### Scenario: Authenticated launch
- **WHEN** session restoration identifies an authenticated user
- **THEN** the authenticated main map screen appears

## REMOVED Requirements

### Requirement: Counter interaction
**Reason**: The demonstration counter is replaced by the product's main map screen.
**Migration**: Users enter the map after authentication; the initial screen no longer exposes increment or reset controls.
