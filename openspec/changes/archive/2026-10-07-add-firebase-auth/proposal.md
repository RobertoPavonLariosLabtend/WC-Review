## Why

WC Review necesita autenticar usuarios mediante email y Google. Los archivos proporcionados pertenecen a Firebase wc-review-11c48 y registran las aplicaciones com.wcreview.app.

## What Changes

- Integrar los archivos Firebase nativos y crear un servicio de autenticación compartido.
- Mostrar login con email y contraseña, Google.
- Gestionar restauración de sesión, errores, cancelaciones y cierre de sesión.
- Mantener el contador de la base mínima dentro de la pantalla autenticada.
- Documentar la activación de proveedores, el cliente OAuth web pendiente para Google.

## Capabilities

### New Capabilities
- `user-auth`: Login con email y Google, persistencia de sesión y logout.

### Modified Capabilities
- `minimal-app`: La pantalla inicial requiere sesión; el contador se conserva en la pantalla autenticada.

## Impact

Configuración Expo, dependencias nativas Firebase y proveedores, servicio TypeScript, estado de sesión y pantallas. Nueva compilación nativa necesaria. El plist iOS actualizado contiene sus IDs OAuth, pero el JSON Android todavía no contiene el cliente OAuth web necesario. Completar Google requiere el JSON actualizado.

## Final scope update (2026-10-07)

The user supplied an updated iOS plist and requested removal of Apple for now. Final scope is email/password and Google; Apple is removed from the app. Google still requires the Android JSON's web OAuth client. No remote Firebase settings are changed.
