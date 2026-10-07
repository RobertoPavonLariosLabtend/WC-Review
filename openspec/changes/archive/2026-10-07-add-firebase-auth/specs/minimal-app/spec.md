## MODIFIED Requirements

### Requirement: Initial screen
The app SHALL show login when no session exists and SHALL show the Spanish counter screen initialized to zero after session restoration identifies an authenticated user.

#### Scenario: Fresh launch
- **WHEN** the user opens the installed app without a session
- **THEN** the login screen appears after session initialization

#### Scenario: Authenticated launch
- **WHEN** session restoration identifies an authenticated user
- **THEN** the authenticated screen shows the counter initialized to zero
