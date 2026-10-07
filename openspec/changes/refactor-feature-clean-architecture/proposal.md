## Why

Las pantallas llaman directamente a Firebase y el código está separado por capas globales. Organizarlo por feature con interfaces de repositorio y casos de uso permitirá sustituir la infraestructura y probar la lógica sin cargar SDK nativos.

## What Changes

- Separar autenticación y contador en `src/features/`, cada uno con `ui`, `repository`, `domain` y `use-cases`.
- Inyectar los contratos de repositorio en los casos de uso y exponerlos a la UI mediante providers.
- Aislar Firebase y Google en el repositorio de autenticación; mapear sus usuarios a un modelo propio.
- Mantener Expo Router como adaptador de rutas, la sesión, login email/Google, errores, cancelación, logout y contador.
- Añadir pruebas de casos de uso con repositorios falsos y controles de dependencias arquitectónicas.

## Capabilities

### New Capabilities
Ninguna. Refactor interno sin nuevas conductas de producto.

### Modified Capabilities
Ninguna. Se mantienen `user-auth` y `minimal-app`. `skip_specs: true` documenta que no hay deltas de comportamiento.

## Impact

Código TypeScript, rutas, pruebas y documentación. Sin dependencias nuevas, cambios en Firebase Console ni cambios en la configuración nativa. El cambio local previo de appleTeamId en app.json se conserva y no se incluye en los commits de esta feature.
