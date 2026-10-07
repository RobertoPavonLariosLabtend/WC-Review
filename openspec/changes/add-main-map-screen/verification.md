# Verificación de add-main-map-screen

Fecha: 2026-10-07. Rama propietaria: `feature/main-screen`. Esquema: `spec-driven`.

## Resumen

| Dimensión | Resultado |
| --- | --- |
| Completitud | 16/19 tareas completas. Pendientes: 3.1 (claves reales), 5.2 (aceptación con proveedores) y 5.4 (sincronización/archivo final). |
| Corrección | Los 7 requisitos main-map y el requisito inicial modificado tienen implementación; la interacción del contador ha sido retirada. La cobertura real de proveedor/dispositivos aún no acredita aceptación. |
| Coherencia | Feature con domain/use-cases/repository/ui; composition inyecta dependencias; auth conserva contrato y listener existentes. |

## Comprobaciones locales

- `npm test`: 28/28 pruebas de app, incluidas reglas arquitectónicas, entrada inválida, ubicación opcional, selección rápida, cierre/desmontaje, sesión nueva, error/reintento, fallo de foto y transporte autenticado.
- `npm test --prefix functions`: 7/7 pruebas de servicio. Se ejecutaron también con `npx --yes --package=node@22 node --test functions/tests/*.test.mjs`, 7/7.
- `npm run check`: lint, TypeScript y versiones Expo compatibles correctos.
- `npm run check --prefix functions`: sintaxis correcta; el entrypoint Functions se importa localmente sin desplegar.
- `npx expo-doctor`: 21/21 comprobaciones correctas.
- `npm run export`: bundles Hermes de producción para iOS y Android exportados. No incluyen configuración de servicio ni claves Maps reales.
- `openspec validate add-main-map-screen --strict`: correcto.
- Generación nativa mediante Expo prebuild: correcta; no se modifican directorios nativos a mano.
- Android: `:app:assembleDebug` correcto (3m 25s; 568 tareas), usando Java 21 de Android Studio y SDK Android local. Sin clave Maps real: demuestra compilación, no carga de mapa. Log `/tmp/wc-main-map-android-build.log`; APK `android/app/build/outputs/apk/debug/app-debug.apk`.
- iOS: Xcode 27, Debug para simulador genérico, sin firma: `BUILD SUCCEEDED`, incluyendo el subspec Google de react-native-maps y GoogleMaps 9.4.0. Se activó el plugin únicamente con `GOOGLE_MAPS_IOS_API_KEY=build-verification-only`; no es una clave funcional, no se instala ni distribuye ese binario y no acredita acceso a Google. Log `/tmp/wc-main-map-ios-build.log`; derivados `/tmp/wc-main-map-ios-build`. Después se regenera iOS sin esa variable para restaurar la configuración local sin claves.
- No son builds firmados para tiendas ni pruebas en dispositivos. La compilación iOS no ejecuta la app; el binario Debug usa Metro para JavaScript. Los bundles móviles se han exportado por separado.

## Trazabilidad a requisitos y escenarios

| Requisito | Evidencia de implementación | Cobertura / límite |
| --- | --- | --- |
| Authenticated map and global user | `src/composition/MainScreenFeature.tsx:8`, `src/features/main-screen/ui/MainScreen.tsx:11`, guards existentes de `_layout.tsx` | Casos auth existentes; remount por user.id y loader por sesión. Login y logout con cuenta real siguen pendientes. |
| Map navigation and optional location | `MainScreen.tsx:9`, `MainScreen.tsx:34`, `repository/expo-location-repository.ts:3` | No petición al montar; validación/denegación en casos de uso. Permisos nativos y centrado real pendientes. |
| Select visible establishments | `MainScreen.tsx:49`, `use-cases/index.ts:6` | IDs/coordenadas inválidos rechazados antes del proveedor. Solo onPoiClick inicia selección; toque normal no tiene handler de carga. Evento nativo real pendiente. |
| Partial overlay establishment card | `MainScreen.tsx:22`, `MainScreen.tsx:47`, `ui/EstablishmentCard.tsx:9` | Límite 50%, ScrollView, safe areas, close, extensibilidad por children y padding nativo. Pantalla pequeña, texto grande y cámara/atribución requieren inspección nativa con Maps configurado. |
| Partial data and photo attribution | `EstablishmentCard.tsx:6`, `functions/src/provider.mjs:8` | Normalización parcial, créditos originales, imagen neutra y descripción ausente. Enlaces/MIME validado; atribución visual real pendiente. |
| Loading failure and selection consistency | `ui/selection-loader.ts:6`, `MainScreen.tsx:21` | Pruebas de A lenta/B, close y dispose con proveedor que ignora abort, foto tardía, reintento y fallo de foto conservando detalles. |
| Provider configuration and protected details | `app.config.ts:28`, `repository/service-places-repository.ts:10`, `functions/src/service.mjs:9`, `functions/src/limiter.mjs:3` | Token/revocación, parámetros, pertenencia, límites transaccionales, timeout, MIME/tamaño y errores sin secretos. Firestore/Admin/Google se prueban con dobles, no contra servicios remotos. |
| Initial screen / Counter interaction removed | `src/app/index.tsx:1`, `src/composition/AppProviders.tsx:1` | CounterFeature y sus pruebas han sido retirados; guards/login/registro preservados. |

## Pendientes que impiden cerrar y archivar

- **CRITICAL — 3.1:** instalar/configurar plugins está hecho, pero faltan `GOOGLE_MAPS_IOS_API_KEY` y `GOOGLE_MAPS_ANDROID_API_KEY` reales, restringidas por plataforma y entorno. Aplicar los pasos de `docs/main-map-setup.md` y recompilar con esas claves.
- **CRITICAL — 5.2:** faltan URLs de `placeDetails`/`placePhoto` y el servicio desplegado/configurado. El despliegue requiere autorización explícita según el diseño y 2.4. Completar después la matriz de aceptación de `docs/main-map-setup.md` en ambas plataformas. No se han creado usuarios ni cambiado servicios remotos.
- **CRITICAL — 5.4:** no sincronizar ni archivar hasta completar configuración y aceptación. El trabajo local puede registrarse y subirse para revisión manteniendo abierto el cambio; no integrar en main.
- **WARNING:** las pruebas de layout y eventos del mapa son inspección de implementación, no una validación visual en dispositivo. La compilación no demuestra POI, cámara, fotos, permisos ni éxito del proveedor.
- **WARNING:** límites Firestore compartidos se verifican con transacciones falsas; reglas privadas/TTL y cuotas globales necesitan verificación en el proyecto al desplegar. No se persiste contenido Places.

## Preservación y entrega

El cambio local de `app.json` que añade `appleTeamId` se conserva y se excluye de los commits de esta feature. No se integra ni se hace force push a main. No se suben claves, tokens, directorios generados ni node_modules.
