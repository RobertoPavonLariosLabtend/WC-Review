# Verificación de add-main-map-screen

Fecha: 2026-10-07. Rama propietaria: feature/main-screen. Cambio actualizado por petición del usuario: MapLibre/OpenFreeMap y catálogo propio sustituyen Google Maps/Places. La verificación anterior del proveedor Google queda superada por esta migración.

## Resultado

Implementación de MapLibre y catálogo propio terminada. 33 pruebas pasan, lint/tipos/versiones Expo y OpenSpec válidos. Ambas plataformas exportan y compilan sin claves de Maps. Prueba nativa parcial de iOS confirmada con mapa real y fotos locales, usando una sesión ficticia en un harness de desarrollo aislado; no acredita login real ni aceptación completa en ambas plataformas. El cambio permanece abierto hasta terminar esa aceptación y el archivado.

## Comprobaciones locales

- npm test: **33/33**; arquitectura, auth/registro existentes, validación de IDs/coordenadas, catálogo/fotos/atribuciones/copia/abort/recursos cruzados, aislamiento de sesiones, selección A→B, cierre/desmontaje y fallos/reintento. El test de mapa ejecuta el componente real transpiliado con dobles: acepta solo IDs del catálogo, verifica orden longitude/latitude, cámara/padding y posición de atribución. No sustituye el mapa nativo.
- npm run check: lint, TypeScript y expo install --check correctos.
- npx expo-doctor: **21/21**, sin incidencias detectadas.
- openspec validate add-main-map-screen --strict: correcto.
- npm run export: bundles Hermes iOS/Android y los dos JPEG locales incluidos en dist. Log /tmp/wc-maplibre-export.log.
- Expo prebuild --clean --no-install y pod install: correctos. No se editan directorios nativos a mano; permanecen ignorados.
- Android :app:assembleDebug: **BUILD SUCCESSFUL**, 2m 13s, 572 tareas. Java 21/SDK Android local; APK android/app/build/outputs/apk/debug/app-debug.apk. Log /tmp/wc-maplibre-android-build.log. No había dispositivo/emulador Android conectado; no se acredita comportamiento visual/runtime Android.
- iOS: **BUILD SUCCEEDED**, Xcode 27, Debug Simulator genérico arm64/x86_64, CODE_SIGNING_ALLOWED=NO. MapLibreReactNative 11.5.0 y MapLibre Native 6.31.0; sin GoogleMaps/AirGoogleMaps en Podfile.lock. Log /tmp/wc-maplibre-ios-build.log; derivados /tmp/wc-maplibre-ios-build. No es un build firmado para tiendas.
- Binario iOS instalado en iPhone 18 Pro/iOS 27. App de producción abierta mediante Metro actualizado en puerto 8082; muestra login correctamente. La instancia previa 8081 conservaba el plugin react-native-maps y devolvía 500 tras retirarlo; se mantiene intacta y requiere reiniciarse.

## Inspección nativa iOS

Para revisar componentes sin crear usuarios ni modificar auth, se creó temporalmente un proyecto Metro ignorado en .expo/native-map-preview, con el **MainScreen real**, **AuthProvider real** inyectado con un caso de sesión ficticio, repositorio real del catálogo y ubicación simulada. Se utilizó el mismo binario compilado; el mapa conectó al proveedor real OpenFreeMap. El harness no forma parte del bundle/export/commits de la aplicación y se eliminó después. Se detuvo su Metro y se restauró la app normal en el simulador; el Metro normal 8082 queda disponible.

Confirmado visualmente:

- Estilo/teselas reales de Madrid, pan geográfico, nombres y puntos azules del catálogo.
- Botón accesible Casa Labra abre su ficha: fotografía correcta, nombre, descripción, dirección y créditos Tamorlan/CC BY 3.0.
- Toque **nativo sobre el punto azul de Botín** cambia la selección, centra el punto en el área descubierta y abre su foto/descripción/dirección correctas.
- La ficha mantiene mapa descubierto, safe area y controles de atribución/logo por encima de ella. Foto, autor y licencia permanecen visibles; la fuente tiene acceso por scroll.
- No crash onLayout ni necesidad de Maps key. El test sigue capturando altura antes del updater de estado.

No comprobado como aceptación real: login/logout con cuenta, sesión restaurada/cambio de usuario en dispositivo, permiso/ubicación nativa, texto grande/pantalla pequeña, caída de red/reintento nativo, fallbacks visuales ni la matriz Android. Estos escenarios se cubren parcialmente con dobles, pero no se marcan aceptados. No se modificaron proveedores Firebase, cuentas, facturación, secretos ni servicios remotos.

## Trazabilidad

| Requisito | Implementación y evidencia |
| --- | --- |
| Sesión/mapa autenticado | composition/MainScreenFeature, AuthProvider y guards existentes; login observado. Sesión real pendiente. |
| Navegación/ubicación opcional | ui/EstablishmentMap y repository/expo-location-repository; mapa real observado, denegación probada en casos de uso. |
| Selección catálogo | GeoJSONSource y botones accesibles; toque nativo y botón verificados en iOS; IDs desconocidos ignorados. |
| Ficha parcial | MainScreen calcula máximo 50% y reserva espacio descubierto; EstablishmentCard permite scroll y close; inspección iOS parcial. |
| Datos parciales/créditos | Catálogo propio, photos locales, fuente/autor/licencia, sin crédito Google fijo. Fallbacks de datos/foto preservados. |
| Cargas/cancelación | Selection loader existente con generación y abort, catálogo con abort, mapa con loading/error/retry; pruebas de carreras. |
| Sin facturación/catálogo propio | Plugin MapLibre, OpenFreeMap sin key, adapter inyectado y photos empaquetadas; retirados servicio Places y variables en app.config. |
| Initial screen/counter retirado | src/app/index.tsx sigue conectado a MainScreenFeature; login/registro intactos. |

## Entrega y pendientes

Se documenta mantenimiento del catálogo en docs/main-map-setup.md y la arquitectura en docs/architecture.md. Solo los dos establecimientos del catálogo tienen fichas; las etiquetas del mapa base no prometen información adicional. No existe editor/subida desde la app en esta iteración. Fotos de 2009 atribuidas, sin afirmaciones sobre baños.

Se conserva intacto el cambio ajeno appleTeamId en app.json y se excluye del commit. No se integra main. OpenSpec no se sincroniza/archiva mientras falte la aceptación real de ambas plataformas (4.3/4.5).
