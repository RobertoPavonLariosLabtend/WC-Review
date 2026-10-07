# Mapa principal y catálogo propio

La pantalla autenticada utiliza **MapLibre Native + OpenFreeMap**, sin claves Google Maps ni cuenta de facturación para el mapa. El mapa empieza en Madrid (40.4168, -3.7038), zoom 14.5. La red es necesaria para descargar el estilo/teselas; las fichas y fotografías se empaquetan con la app.

Los puntos azules y la lista horizontal abren las fichas de WC Review. Las etiquetas del mapa base son contexto geográfico y no representan fichas disponibles. El catálogo inicial contiene **Casa Labra** y **Sobrino de Botín**, no todos los establecimientos de Madrid. La ficha ocupa como máximo el 50% de altura útil, permite scroll, muestra autor/licencia de la foto y la fuente de información. Mi ubicación solicita permiso solo al pulsar, sin seguimiento continuo.

## Compilar después del cambio

MapLibre es un módulo nativo; no funciona en Expo Go ni en el binario anterior con react-native-maps. No basta con recargar Metro ni con publicar una OTA al binario antiguo.

```sh
npm ci
npx expo prebuild --clean
npm run ios
# O bien, para Android:
npm run android
```

Para EAS, usa `npx eas-cli@latest build --profile development` con tu perfil configurado. El plugin está en app.config.ts. Detén Metro y reinícialo con `npx expo start --dev-client --clear` si estaba abierto durante el cambio: el proceso anterior puede conservar el plugin react-native-maps en memoria. Las variables GOOGLE_MAPS_IOS_API_KEY, GOOGLE_MAPS_ANDROID_API_KEY, PLACES_DETAILS_URL y PLACES_PHOTO_URL ya no se leen y pueden eliminarse del entorno local/EAS. Firebase Authentication y su login Google mantienen sus archivos/OAuth existentes; esa configuración es independiente del mapa.

No hay servicio Places/Functions ni Storage para las fichas. No se han desplegado servicios ni cambiado cuentas o facturación remotas.

## Error iOS: no se encuentra MapLibre.xcframework

MapLibre Native se resuelve como paquete binario Swift. Si Xcode muestra `There is no XCFramework found` dentro de `DerivedData/.../SourcePackages/artifacts/maplibre-gl-native-distribution/`, vuelve a resolver las dependencias del workspace y repite la compilación:

```sh
xcodebuild -resolvePackageDependencies -workspace ios/WCReview.xcworkspace -scheme WCReview
npm run ios
```

El workspace debe existir: si es una instalación nueva sin ios/, ejecuta primero `npx expo prebuild`. No sustituyas el framework copiándolo desde otro DerivedData ni edites Pods/proyectos generados. La resolución usa la versión/checksum declarados por MapLibre. Las advertencias de fases de scripts con dependencias ambiguas no son la causa de este error.

## Añadir establecimientos y fotografías

1. Edita `src/features/main-screen/repository/catalogue.ts`. Cada entrada requiere id estable/único (letras, números, guiones/guion bajo; máximo 256), nombre, coordenadas válidas y attributions. Dirección y descripción son opcionales. Escribe información verificada; deja ausente lo que no se conozca.
2. Para una foto, añade un JPEG en `repository/photos/` (recomendado hasta 960px de ancho), registra su require estático en `bundled-places-repository.ts` y utiliza esa clave en photo.asset. No se construyen rutas require dinámicas, para que Metro pueda empaquetar el recurso.
3. Incluye en photo.authors el autor, enlace al original, licencia y modificaciones cuando corresponda. Para fotos propias basta el crédito que proceda. No copies fotos de Google Places u otros sitios sin derechos de reutilización.
4. Verifica con `npm test`, `npm run check` y `npm run export`, y distribuye una versión/bundle compatible con el módulo MapLibre. Un cambio de catálogo no exige regenerar código nativo; cambiar dependencias/plugins sí.

Ejemplo de entrada sin foto:

```ts
{
  id: 'mi-local',
  name: 'Mi establecimiento',
  coordinate: { latitude: 40.4168, longitude: -3.7038 },
  address: 'Dirección verificada',
  description: 'Descripción propia y verificada.',
  attributions: [{ name: 'Información facilitada por el establecimiento' }],
}
```

El catálogo es público dentro del bundle. El acceso a la pantalla sigue protegido por sesión, pero no hay permisos de edición ni sincronización remota. Aportaciones desde la app y gestión multiusuario requieren otra feature. No se afirma que los ejemplos tengan baños accesibles ni se inventan reseñas.

## Fuentes del catálogo inicial

Las descripciones son breves textos propios basados en [Casa Labra](https://www.esmadrid.com/restaurantes/casa-labra) y [Botín](https://www.esmadrid.com/restaurantes/botin), del portal oficial Turismo de Madrid. Las coordenadas de referencia se comprobaron en las categorías Commons [Casa Labra](https://commons.wikimedia.org/wiki/Category:Casa_Labra,_Madrid) y [Sobrino de Botín](https://commons.wikimedia.org/wiki/Category:Sobrino_de_Bot%C3%ADn).

Fotos **Tamorlan**, 2009, **CC BY 3.0**, reducidas a 960px; la presentación cover encuadra la imagen. Son fotografías históricas, no una garantía del aspecto actual:

- [Casa Labra-2009.jpg](https://commons.wikimedia.org/wiki/File:Casa_Labra-2009.jpg).
- [Casa Botín-Madrid-2009.jpg](https://commons.wikimedia.org/wiki/File:Casa_Bot%C3%ADn-Madrid-2009.jpg).
- [Licencia CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).

## Proveedor y atribuciones

Estilo: `https://tiles.openfreemap.org/styles/liberty`. [OpenFreeMap](https://openfreemap.org/) ofrece una instancia pública sin registro, clave ni límites de solicitudes anunciados, sin SLA. Mantén visibles las atribuciones incluidas en el estilo (OpenStreetMap/OpenMapTiles). La app coloca los controles de atribución por encima de la ficha y no los desactiva. No descarga áreas para uso offline ni usa los servidores públicos raster de OSM.

Referencias: [MapLibre con Expo](https://maplibre.org/maplibre-react-native/docs/setup/expo/), [OpenFreeMap](https://openfreemap.org/quick_start/), [ubicación Expo 57](https://docs.expo.dev/versions/v57.0.0/sdk/location/).

## Aceptación en dispositivos

Comprobar en ambas plataformas: mapa sin claves, toque de marcador y botón accesible, foto/créditos/fuente, selección rápida A→B, cierre sin perder viewport, pantalla pequeña y texto grande, atribuciones visibles, mapa sin red con error/reintento, catálogo vacío, ubicación concedida/denegada, logout y cambio de usuario. Las pruebas con dobles, bundles y compilaciones no sustituyen esta aceptación; consultar verification.md del cambio OpenSpec para resultados y límites reales.
