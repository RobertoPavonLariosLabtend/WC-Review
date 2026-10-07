## Purpose

Permitir que los usuarios accedan a WC Review con email y contraseña o Google y mantengan su sesión entre aperturas de la aplicación.

## ADDED Requirements

### Requirement: Session restoration and access
The application SHALL restore an existing session before choosing the initial screen and SHALL show login when no session exists.

#### Scenario: Signed out launch
- **WHEN** a user opens the app without a session
- **THEN** the login screen appears after session initialization

#### Scenario: Existing session
- **WHEN** a previously authenticated user reopens the app with a valid session
- **THEN** the authenticated screen appears without requesting credentials again

### Requirement: Email login
The application SHALL authenticate an existing account with email and password, validate required inputs and show readable Spanish errors without exposing credentials.

#### Scenario: Successful email login
- **WHEN** the user submits valid credentials for an existing account
- **THEN** the authenticated screen shows the signed-in user

#### Scenario: Invalid credentials
- **WHEN** authentication rejects the submitted credentials
- **THEN** the user remains on login and sees an actionable error without exposing account existence

#### Scenario: Incomplete form
- **WHEN** email is invalid or password is empty
- **THEN** the form shows a validation message and does not submit authentication

### Requirement: Google login
The application SHALL support Google sign-in on iOS and Android when the provider and its OAuth clients are configured.

#### Scenario: Successful Google login
- **WHEN** Google returns a valid identity token and the backend accepts it
- **THEN** the authenticated screen appears

#### Scenario: Missing provider configuration
- **WHEN** OAuth configuration is missing
- **THEN** the app remains usable with other available methods and clearly explains Google sign-in is unavailable

### Requirement: Pending operations and cancellation
The application SHALL prevent duplicate authentication submissions and SHALL handle provider cancellation without displaying a login failure.

#### Scenario: Authentication pending
- **WHEN** an authentication operation is pending
- **THEN** the UI indicates progress and prevents a second concurrent submission

#### Scenario: User cancellation
- **WHEN** the user cancels Google sign-in
- **THEN** the login screen becomes interactive again without a failure message

### Requirement: Sign out
The application SHALL allow the authenticated user to sign out and return to the login screen.

#### Scenario: Successful sign out
- **WHEN** the authenticated user presses Cerrar sesión and logout succeeds
- **THEN** login appears and restarting the application does not restore the previous session
