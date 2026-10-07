## Purpose

Proporcionar una aplicación móvil mínima e interactiva para comprobar el arranque y disponer de una base de desarrollo funcional.

## ADDED Requirements

### Requirement: Initial screen
The app SHALL show a Spanish welcome screen and a counter initialized to zero on a fresh launch.

#### Scenario: Fresh launch
- **WHEN** the user opens the installed app
- **THEN** the welcome screen shows a counter value of 0 without requiring login or a backend

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
