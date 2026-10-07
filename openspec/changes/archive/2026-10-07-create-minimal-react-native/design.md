## Context

See proposal.md for motivation. Empty directory; Node, OpenSpec, Xcode and an iOS simulator are available locally.

## Goals / Non-Goals

**Goals:** Minimal dependencies, typed source, reproducible native build and clear developer commands.

**Non-Goals:** Backend, authentication, navigation, persistence and store distribution.

## Decisions

- Use the official Expo blank TypeScript template and its compatible React Native dependencies. Bare React Native requires more manual native setup; the full Expo Router template adds unnecessary navigation.
- Enable scene support with the official expo-build-properties config plugin: Xcode 27 / iOS 27 require the scene lifecycle. Keep this in app.json so prebuild reproduces it.
- Keep the single screen in App.tsx using React state and native accessible controls. No global state library is needed.
- Generate native projects through Expo prebuild; do not version generated native directories. Keep app configuration and npm lockfile as sources of truth.
- Verify TypeScript, Expo dependency compatibility, Metro exports for both mobile platforms, and a Release simulator build with Xcode. Exercise the counter manually in the running app.

## Risks / Trade-offs

- Native build tooling and downloads → use installed Xcode/CocoaPods and record actual build results.
- Android SDK availability → provide Android command but report Android native compilation separately from successful Metro export.
- In-memory counter resets after process restart → intentional behavior for a minimal starter.

## Migration Plan

Create the base in this empty directory, install dependencies, generate iOS and build for the simulator. No existing application or data needs migration.
