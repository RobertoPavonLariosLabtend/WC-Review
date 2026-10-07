# Verificación de establecimientos OSM

## Checks

- npm test: **43 pruebas, 43 pasan**, incluidas fronteras de arquitectura, mapeo nodos/vías/relaciones, bounds inválidos/área excesiva, límite de resultados, caché/expiración, atribuciones, cooldown 429/406, aborto de transporte tardío, carreras y aislamiento del loader, fotos autorizadas y rechazo de URL/licencia no admitidas.
- npm run check: lint, TypeScript y versiones Expo correctas.
- npm run export: bundles Hermes **iOS y Android** exportados; logs /tmp/wc-osm-export.log.
- Sin cambios de dependencias/configuración nativa; se reutilizó el development build MapLibre existente. No se necesita recompilar nativo para este cambio JavaScript.

## Proveedor real

La consulta inicial del centro de Madrid mediante el adapter real devolvió **300 establecimientos**, seis descripciones y una foto File: directamente enlazada. Ejemplos: Teatro Alfil, Filmoteca Nacional, Café Melo's, Room Mate Mario Hotel y McDonald's. Resultado público de comprobación en /tmp/wc-osm-live.json, sin tokens de sesión.

Las primeras consultas al servidor principal devolvieron 406/504 y la instancia Private.coffee evaluada dio timeout. Se incorporó User-Agent que identifica WCReview con su repositorio público, como solicita la política Overpass. Posteriormente la consulta real y la app iOS funcionaron sobre overpass-api.de. No se implementó una ráfaga de reintentos ni fallback automático entre instancias. Las respuestas 406/429 activan cooldown de un minuto; el proveedor sigue sin SLA.

La fotografía del **Teatro Bellas Artes**, File:Teatro Bellas Artes (Madrid) 01.jpg, resolvió metadatos reales de Luis García (Zaqarbal), CC BY-SA 3.0; la miniatura descargó con **HTTP 200, image/jpeg**. La API actual usa thumb.wikimedia.org además de upload.wikimedia.org: ambos hosts exactos están admitidos y se descartan parámetros de tracking. Se comprobó también la respuesta real de Commons para Casa Labra al diagnosticar el cambio de host; no se mezcla esa foto editorial con establecimientos distintos.

## iOS observado

En iPhone 18 Pro / iOS 27 con la app normal y Metro 8082 se observaron el mapa real, **OpenStreetMap · 300 sitios**, múltiples puntos azules, lista horizontal virtualizada y límite indicado. Se observó la ficha de **Yambala** con categoría Pub, dirección Calle de Coloreros 4, 28013, Madrid, foto/descripción no disponibles y «Baño indicado en OSM: Sin datos». Las atribuciones al elemento OSM y a ODbL están en la ficha desplazable; el mapa y su atribución permanecen visibles por encima.

Se cerró la ficha con su control nativo y se pulsó Buscar en esta zona: se activó la carga y se conservaron los puntos previos durante la petición. Esa búsqueda falló y la UI mostró el reintento conservando los 300 puntos anteriores, verificando el comportamiento ante fallo real del proveedor. Se amplió el timeout HTTP a 45 segundos para dar margen al tiempo de espera de un slot antes del presupuesto de consulta Overpass de 20 segundos. **El reintento nativo funcionó**: desapareció el error y la lista mostró nuevos resultados de la zona visible, incluidos Café Comercial, Honest Greens, Mür Café, La Parrilla de Nino y Tempo.

## Límites de aceptación

No se ha observado la foto remota dentro de la ficha nativa, aunque su metadata/descarga real y el flujo de presentación existente están verificados por separado. No se ha realizado aceptación interactiva Android, pantalla pequeña/texto grande, red caída en dispositivo, todos los tags de baño/horario, permiso/ubicación nativa ni login/logout/cambio de usuario. No se crean cuentas, despliegan servicios ni modifican facturación o proveedores Firebase. Los checks/export no equivalen a esos escenarios; la aceptación general pendiente del cambio add-main-map-screen permanece abierta.

## Entrega

Feature main-screen ampliada en su rama propietaria feature/main-screen, sobre MapLibre todavía no integrado en main. Se preserva y excluye el cambio ajeno appleTeamId de app.json. Documentación actualizada en README, docs/architecture.md y docs/main-map-setup.md. No se integra main ni se archiva el cambio anterior.
