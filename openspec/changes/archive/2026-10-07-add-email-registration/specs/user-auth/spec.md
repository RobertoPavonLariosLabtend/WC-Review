## ADDED Requirements

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
