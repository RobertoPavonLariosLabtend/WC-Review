## Why

El mapa actual solo permite abrir dos establecimientos editoriales. El usuario quiere OpenStreetMap como fuente para explorar establecimientos reales sin claves Google ni cuenta de facturación.

## What Changes

- Buscar establecimientos OSM en la zona del mapa, inicialmente Madrid y después mediante «Buscar en esta zona».
- Abrir fichas de los puntos recuperados con nombre, categoría, dirección, horarios, web y datos de baños cuando estén registrados.
- Mostrar descripción OSM y fotografía Commons cuando estén disponibles, mediante archivo/categoría enlazados o la imagen/categoría de la entidad Wikidata propia del lugar, con fuente y licencia; conservar fallbacks explícitos.
- Limitar área, resultados y frecuencia; cachear consultas por sesión y gestionar cancelación, errores, reintento y respuestas obsoletas.
- Sustituir el catálogo fijo como fuente de la pantalla, manteniendo MapLibre/OpenFreeMap y la arquitectura existente.

## Capabilities

### New Capabilities

- `osm-establishments`: descubrimiento por zona, fichas OSM parciales, atribución y carga controlada.

### Modified Capabilities

Ninguna especificación integrada cambia; este cambio amplía la feature main-screen aún en su rama propietaria.

## Impact

main-screen/domain, use-cases, repository, ui y composition. Consultas HTTPS a Overpass y, bajo demanda, Wikimedia Commons/Wikidata. Sin dependencias nuevas, cambios nativos, despliegues ni modificaciones de autenticación. Implementación y verificación en feature/main-screen, cuya base ya contiene MapLibre; sin integración en main.
