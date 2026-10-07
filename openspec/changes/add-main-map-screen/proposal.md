## Why

La pantalla autenticada actual es un contador de prueba. WC Review necesita una pantalla principal donde el usuario explore el mapa y seleccione establecimientos para consultar su información sin perder el contexto geográfico.

## What Changes

- Reemplazar el contador inicial por un mapa de Google en iOS y Android, reutilizando el usuario global de AuthProvider.
- Seleccionar puntos de interés visibles del mapa y consultar su información por placeId.
- Mostrar una tarjeta inferior en la misma pantalla con nombre, foto y descripción; mantener una zona del mapa visible e interactiva y una composición extensible para futuras acciones.
- Manejar datos incompletos, carga, errores, selección rápida de otro lugar y cierre de tarjeta.
- Añadir un adaptador de Places y una función Firebase autenticada para obtener detalles y fotos sin incluir la clave de servicio en el cliente.
- Mantener cerrar sesión, añadir centrado opcional en la ubicación y permitir navegar sin conceder ubicación.
- Retirar la interacción del contador de la experiencia inicial. No añadir búsqueda, filtros, reseñas ni persistencia de lugares en esta feature.

## Capabilities

### New Capabilities

- `main-map`: mapa autenticado, selección de establecimientos y tarjeta superpuesta extensible.

### Modified Capabilities

- `minimal-app`: la pantalla inicial autenticada pasa del contador al mapa y se elimina el requisito de interacción del contador.

## Impact

- Nueva feature src/features/main-screen/{ui,domain,use-cases,repository}, composición y adaptador src/app/index.tsx. Auth conserva su contrato y estado global.
- react-native-maps con Google como proveedor en ambas plataformas y expo-location para ubicación opcional; instalación compatible con Expo 57.
- Configuración nativa de claves Maps por plataforma y APIs de Google Cloud; función Firebase para Places Details/Photos con secretos de servidor.
- Pruebas de casos de uso y dependencias, exportación de bundles y compilaciones iOS/Android. Validación real requiere APIs, facturación y claves configuradas.
- Rama feature/main-screen basada en feature/login por dependencia del estado de sesión y sus convenciones pendientes de integración. No integrar en main sin petición expresa. Preservar el cambio local ajeno de appleTeamId.
