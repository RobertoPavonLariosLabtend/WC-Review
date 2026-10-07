# user-auth Specification

## Purpose

Permitir que los usuarios accedan a WC Review con email y contraseña o Google y mantengan su sesión entre aperturas de la aplicación.

## Requirements

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

### Requirement: Email account registration
The application SHALL let a signed-out user create an account with email, password and password confirmation. It SHALL validate a syntactically valid email, a password of at least six characters and matching confirmation before submission, and SHALL enter the authenticated screen after successful account creation and session observation.

#### Scenario: Valid registration
- **WHEN** a signed-out user submits a new email, a password satisfying the configured provider policy and matching confirmation
- **THEN** the account is created and the authenticated screen appears when the session is observed

#### Scenario: Invalid registration inputs
- **WHEN** email is invalid, password has fewer than six characters or confirmation differs
- **THEN** registration is not submitted and a Spanish validation error is displayed

#### Scenario: Registration rejected
- **WHEN** the provider rejects an existing email, weak password, disabled provider or network failure
- **THEN** the form remains available with a Spanish error and without exposing passwords

#### Scenario: Registration pending
- **WHEN** account creation is pending
- **THEN** the form indicates progress and prevents duplicate submissions

### Requirement: Login and registration navigation
The application SHALL expose Crear cuenta from login and Iniciar sesión from registration, and SHALL restrict both screens to signed-out users.

#### Scenario: Open registration
- **WHEN** a signed-out user selects Crear cuenta on login
- **THEN** the registration form appears

#### Scenario: Return to login
- **WHEN** a signed-out user selects Iniciar sesión on registration
- **THEN** login appears

#### Scenario: Authenticated registration route
- **WHEN** an authenticated user attempts to open registration
- **THEN** the authenticated screen is shown instead
