## Why

WC Review necesita un mapa y fichas de establecimientos sin exigir una cuenta de facturación de Google Maps Platform. El usuario autoriza MapLibre con un catálogo propio de fotos y descripciones.

## What Changes

- Sustituir react-native-maps/Google por MapLibre Native en iOS y Android con OpenFreeMap y datos OpenStreetMap, sin clave de mapa ni registro.
- Mostrar los establecimientos del catálogo editorial propio como puntos azules seleccionables, con una lista horizontal accesible que también abre las fichas.
- Incluir inicialmente dos establecimientos reales de Madrid, fotos locales con autor/licencia/enlace y descripciones breves con fuentes verificadas.
- Leer el catálogo empaquetado mediante un repositorio inyectado; eliminar los endpoints, secretos y funciones Places anteriormente preparados y nunca desplegados.
- Conservar AuthProvider, guards, logout, centrado opcional y tarjeta inferior limitada al 50% de altura útil, así como cancelación de cargas y fallbacks.
- Mostrar carga/error/reintento del mapa y del catálogo. La cobertura es la del catálogo propio, no todos los POIs del mapa base.

## Capabilities

### New Capabilities

- `main-map`: mapa autenticado, catálogo propio y tarjeta superpuesta extensible.

### Modified Capabilities

- `minimal-app`: pantalla inicial autenticada con mapa, retirando el contador.

## Impact

Feature main-screen y composición; plugin @maplibre/maplibre-react-native; catálogo editorial y fotos en repository; retirada de react-native-maps, adaptadores de transporte Places y functions/firebase.json. No cambian Firebase Authentication ni el login Google. Mantener la rama propietaria feature/main-screen y el cambio local ajeno appleTeamId. Verificar pruebas, lint, tipos, exportaciones y ambos builds; la aceptación nativa se registra sin confundirla con compilación.

## Estado al archivar

El alcance inicial del catálogo editorial se amplió mediante `add-osm-establishments`, archivado el 7 de octubre de 2026. La composición activa consulta OSM por zona y resuelve imágenes Commons/Wikidata asociadas; el catálogo empaquetado se conserva como adapter alternativo. La especificación main-map refleja ese estado actual. El usuario solicitó archivar este cambio tras conocer la aceptación nativa pendiente; el archivado no acredita esos escenarios ni autoriza integrar main.
