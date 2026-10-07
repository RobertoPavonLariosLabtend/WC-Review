# Verificación de establecimientos OSM

## Checks

- npm test: **49 pruebas, 49 pasan**, incluidas fronteras de arquitectura, mapeo nodos/vías/relaciones, bounds inválidos/área excesiva, límite de resultados, caché/expiración, atribuciones, cooldown 429/406, aborto de transporte tardío, carreras y aislamiento del loader, fotos autorizadas y rechazo de URL/licencia no admitidas; asociaciones exactas, fallbacks de Wikidata/categoría, aborto/rate-limit y caché por fuente completa.
- npm run check: lint, TypeScript y versiones Expo correctas.
- npm run export: bundles Hermes **iOS y Android** exportados; logs /tmp/wc-osm-photo-export.log; checks /tmp/wc-osm-photo-check.log y pruebas /tmp/wc-osm-photo-tests.log.
- Sin cambios de dependencias/configuración nativa; se reutilizó el development build MapLibre existente. No se necesita recompilar nativo para este cambio JavaScript.

## Proveedor real

La consulta inicial del centro de Madrid mediante el adapter real devolvió **300 establecimientos**, seis descripciones y una foto File: directamente enlazada. Ejemplos: Teatro Alfil, Filmoteca Nacional, Café Melo's, Room Mate Mario Hotel y McDonald's. Resultado público de comprobación en /tmp/wc-osm-live.json, sin tokens de sesión.

Las primeras consultas al servidor principal devolvieron 406/504 y la instancia Private.coffee evaluada dio timeout. Se incorporó User-Agent que identifica WCReview con su repositorio público, como solicita la política Overpass. Posteriormente la consulta real y la app iOS funcionaron sobre overpass-api.de. No se implementó una ráfaga de reintentos ni fallback automático entre instancias. Las respuestas 406/429 activan cooldown de un minuto; el proveedor sigue sin SLA.

La fotografía del **Teatro Bellas Artes**, File:Teatro Bellas Artes (Madrid) 01.jpg, resolvió metadatos reales de Luis García (Zaqarbal), CC BY-SA 3.0; la miniatura descargó con **HTTP 200, image/jpeg**. La API actual usa thumb.wikimedia.org además de upload.wikimedia.org: ambos hosts exactos están admitidos y se descartan parámetros de tracking. Se comprobó también la respuesta real de Commons para Casa Labra al diagnosticar el cambio de host; no se mezcla esa foto editorial con establecimientos distintos.

## iOS observado

En iPhone 18 Pro / iOS 27 con la app normal y Metro 8082 se observaron el mapa real, **OpenStreetMap · 300 sitios**, múltiples puntos azules, lista horizontal virtualizada y límite indicado. Se observó la ficha de **Yambala** con categoría Pub, dirección Calle de Coloreros 4, 28013, Madrid, foto/descripción no disponibles y «Baño indicado en OSM: Sin datos». Las atribuciones al elemento OSM y a ODbL están en la ficha desplazable; el mapa y su atribución permanecen visibles por encima.

Se cerró la ficha con su control nativo y se pulsó Buscar en esta zona: se activó la carga y se conservaron los puntos previos durante la petición. Esa búsqueda falló y la UI mostró el reintento conservando los 300 puntos anteriores, verificando el comportamiento ante fallo real del proveedor. Se amplió el timeout HTTP a 45 segundos para dar margen al tiempo de espera de un slot antes del presupuesto de consulta Overpass de 20 segundos. **El reintento nativo funcionó**: desapareció el error y la lista mostró nuevos resultados de la zona visible, incluidos Café Comercial, Honest Greens, Mür Café, La Parrilla de Nino y Tempo.

## Corrección de cobertura fotográfica (7 de octubre de 2026)

La primera implementación solo admitía tags File: y descartaba categorías Commons y entidades Wikidata. Por eso la consulta inicial de 300 sitios solo ofrecía una foto candidata directa. Ahora se resuelven File:, imagen P18 de la entidad `wikidata` del establecimiento y categorías Commons enlazadas en OSM o mediante P373. No se usan `brand:wikidata`, entidades de etimología del nombre ni búsquedas genéricas de imágenes. La consulta de categoría inspecciona hasta seis archivos, sin recursión; se mantienen validación de URL/licencia/créditos, cancelación y caché de 32 fuentes.

Se verificaron dos resoluciones reales: **Teatro Alfil** (Q6139590 y Category:Teatro Alfil (Madrid)) devolvió Teatro Alfil (Madrid) 01.jpg, de Luis García (Zaqarbal), CC BY-SA 3.0 es; **Category:Lhardy** devolvió Interior tienda Lhardy-2009.jpg, de Tamorlan, CC BY 3.0. Ambas miniaturas se descargaron con HTTP 200 desde thumb.wikimedia.org.

En el development build iOS normal, sin fixtures ni sustitución de proveedor, el reintento devolvió **OpenStreetMap · 300 sitios**. Al abrir **Teatro Alfil** se observó la fotografía de su fachada dentro de la ficha, junto a los créditos y licencia. La imagen se comprobó visualmente, no solo mediante metadatos. Antes de ese reintento hubo fallos reales de Overpass; se evaluó otra instancia pública sin cambiar el proveedor de la app. Overpass continúa sin SLA. La cobertura fotográfica sigue siendo parcial: muchos negocios carecen de asociaciones o imágenes reutilizables, y mantienen «Foto no disponible».

## Límites de aceptación

No se ha realizado aceptación interactiva Android, pantalla pequeña/texto grande, red caída en dispositivo, todos los tags de baño/horario, permiso/ubicación nativa ni login/logout/cambio de usuario. No se crean cuentas, despliegan servicios ni modifican facturación o proveedores Firebase. Los checks/export no equivalen a esos escenarios; la aceptación general pendiente del cambio add-main-map-screen permanece abierta.

## Entrega

Feature main-screen ampliada en su rama propietaria feature/main-screen, sobre MapLibre todavía no integrado en main. Se preserva y excluye el cambio ajeno appleTeamId de app.json. Documentación actualizada en README, docs/architecture.md y docs/main-map-setup.md. No se integra main ni se archiva el cambio anterior.
