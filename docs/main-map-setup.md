# Mapa principal y servicio Places

La pantalla autenticada abre Google Maps en Madrid (40.4168, -3.7038). Permite tocar los POIs que Google presenta a ese nivel de zoom; no es un catálogo exhaustivo. La ficha ocupa como máximo el 50% de la altura útil y su contenido se desplaza. Ubicación solo se solicita al pulsar **Mi ubicación**, sin seguimiento continuo. No se generan descripciones cuando falta editorialSummary.

## Configuración móvil por entorno

Define estas variables en `.env.local` para desarrollo o en el entorno del perfil EAS correspondiente; no las guardes en Git:

```dotenv
GOOGLE_MAPS_IOS_API_KEY=
GOOGLE_MAPS_ANDROID_API_KEY=
PLACES_DETAILS_URL=
PLACES_PHOTO_URL=
```

Las dos URLs son HTTPS completas y distintas, obtenidas al desplegar `placeDetails` y `placePhoto`. No contienen claves ni tokens. `app.config.ts` configura el plugin de react-native-maps; el cliente recibe únicamente indicadores de disponibilidad y las URLs. Las claves Maps sí forman parte del binario nativo por necesidad del SDK; deben estar restringidas y separadas del secreto Places. Cambiar claves o indicadores requiere regenerar/recompilar el binario, no solo recargar JavaScript. No publiques una actualización OTA con indicadores que no correspondan al binario instalado.

1. Activa facturación en Google Cloud y habilita **Maps SDK for iOS**, **Maps SDK for Android** y **Places API (New)**.
2. Crea una clave iOS restringida a `com.wcreview.app` y exclusivamente Maps SDK for iOS.
3. Crea una clave Android restringida a `com.wcreview.app` y a las huellas SHA-1 de la firma del entorno, exclusivamente Maps SDK for Android. Producción requiere la firma de Play App Signing; desarrollo usa su propia firma.
4. Usa claves distintas para desarrollo y producción. No reutilices las claves Firebase/OAuth para el servicio Places.
5. Configura las URLs y recompila con `npx expo prebuild`, `npm run ios`/`npm run android`, o `npx eas-cli@latest build --profile development` si tienes un perfil EAS preparado.

Sin clave de la plataforma, la app muestra un estado español de configuración y conserva cerrar sesión. Si falta el servicio, el mapa sigue utilizable y la ficha informa del error con reintento.

Referencia: [react-native-maps en Expo 57](https://docs.expo.dev/versions/v57.0.0/sdk/map-view/), [ubicación en Expo 57](https://docs.expo.dev/versions/v57.0.0/sdk/location/).

## Servicio Firebase preparado para despliegue

`functions/` contiene funciones HTTPS de segunda generación con runtime Node 22. La región predeterminada es `europe-west1`. `firebase.json` utiliza el codebase `places`; no sustituye otros servicios del proyecto. No se ha desplegado nada ni modificado facturación, APIs, secretos, reglas o cuotas remotas durante la implementación.

Prerequisitos: proyecto Firebase con plan que permita Functions, facturación Google, Firestore Native habilitado y credenciales de administrador disponibles para desplegar. El runtime debe tener permiso para verificar tokens (incluida revocación), acceder al secreto y ejecutar transacciones Firestore. La colección `placesRequestLimits` es exclusiva del backend: deniega acceso de clientes en las reglas Firestore existentes y configura TTL en `expiresAt`. El documento solo contiene contador y expiración; el identificador se deriva mediante hash de usuario, tipo y minuto. No guarda contenido Places ni nombres de recursos de fotos. Las reglas/TTL se revisan en el proyecto antes del despliegue; no se sobrescriben desde este repositorio.

Comprobaciones locales:

```sh
npm ci --prefix functions
npm test --prefix functions
npm run check --prefix functions
```

Después de autorización explícita para modificar servicios remotos, los pasos de despliegue son:

```sh
npx firebase-tools@latest login
npx firebase-tools@latest functions:secrets:set PLACES_API_KEY --project wc-review-11c48
npx firebase-tools@latest deploy --only functions:places --project wc-review-11c48
```

Introduce el secreto interactivamente, nunca como argumento o en el bundle. Restringe la clave de servidor a Places API (New); para restricciones por IP necesitas primero salida con IP estable. Los parámetros Firebase `PLACES_REGION`, `PLACES_DETAILS_PER_MINUTE` y `PLACES_PHOTOS_PER_MINUTE` tienen valores predeterminados `europe-west1`, `30` y `30`; el CLI permite configurar los valores al desplegar. Node 22 es el runtime de despliegue; la ejecución local puede utilizar una versión más reciente y debe confirmarse también con Node 22 antes de publicar.

Cada endpoint acepta solo GET y un ID token Firebase válido en `Authorization: Bearer …`; valida revocación y rechaza peticiones inválidas antes de consultar Google. El límite por usuario/minuto es transaccional y compartido entre instancias. Se aceptan IDs acotados y solo la primera foto actualmente devuelta para ese lugar. La petición de foto vuelve a consultar detalles para verificar pertenencia sin persistir metadatos; consume una solicitud de detalles adicional, además de su límite de fotos. La ventana es por minuto de reloj, no deslizante. Se mantiene `maxInstances: 10`; ajusta cuotas del proveedor y alertas de presupuesto en Cloud para el tráfico total del proyecto. Los límites por usuario no sustituyen las cuotas globales.

Details solicita exclusivamente `id,displayName,location,formattedAddress,editorialSummary,photos,attributions` y `languageCode=es`. La máscara limita campos pero incluye datos de distintos niveles de facturación; editorialSummary tiene su propio nivel de tarifa. Consulta [campos y facturación de Details](https://developers.google.com/maps/documentation/places/web-service/place-details) antes de habilitar tráfico.

Las fotos se solicitan con máximo 800×800, se valida el MIME y se limita la lectura a 5 MiB, incluso sin Content-Length. Se entregan como datos de imagen mediante el endpoint autenticado, con atribuciones del autor. Las claves de servidor nunca llegan a la UI, ni en las URLs de fotos. Cada solicitud al proveedor tiene timeout de 10 segundos; la función tiene 30 segundos y el cliente 25. Las respuestas son `private, no-store`; no se persisten detalles ni fotos. Consulta [Photos y atribuciones](https://developers.google.com/maps/documentation/places/web-service/place-photos).

Verifica disponibilidad y condiciones de Google Maps Platform para la región de facturación, incluidas las condiciones EEA. No se afirma que todos los POIs dispongan de fotos o resumen editorial.

## Aceptación en dispositivos

En ambas plataformas, con claves restringidas y servicio desplegado, comprobar: restauración de sesión, toque real de POI, selección A→B con A lenta, cierre durante carga, fallo y reintento, foto con autor/enlace, ausencia de foto/resumen, ficha en pantalla pequeña con texto grande, logo/atribución nativos visibles, ubicación concedida/denegada/timeout y logout durante cargas. Confirmar que entrar con otro usuario elimina toda selección anterior. Las pruebas con dobles y los bundles no verifican estas integraciones reales.
