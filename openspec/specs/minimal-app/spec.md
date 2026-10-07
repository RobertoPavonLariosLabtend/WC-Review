# minimal-app Specification

## Purpose

Proporcionar una aplicación móvil mínima e interactiva para comprobar el arranque y disponer de una base de desarrollo funcional.

## Requirements

### Requirement: Initial screen
The app SHALL show login when no session exists and SHALL show the Spanish counter screen initialized to zero after session restoration identifies an authenticated user.

#### Scenario: Fresh launch
- **WHEN** the user opens the installed app without a session
- **THEN** the login screen appears after session initialization

#### Scenario: Authenticated launch
- **WHEN** session restoration identifies an authenticated user
- **THEN** the authenticated screen shows the counter initialized to zero

### Requirement: Counter interaction
The app SHALL let users increment the counter by one and reset it to zero.

#### Scenario: Increment
- **WHEN** the user presses Incrementar twice from zero
- **THEN** the counter displays 2

#### Scenario: Reset
- **WHEN** the user presses Reiniciar after incrementing the counter
- **THEN** the counter displays 0

### Requirement: Native iOS startup
The app SHALL compile for an iOS simulator and launch as an installed native application.

#### Scenario: Local native build
- **WHEN** the developer runs the documented iOS build with the required local toolchain
- **THEN** the build succeeds and the installed application opens on the simulator
