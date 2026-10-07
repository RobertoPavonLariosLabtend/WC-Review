# Mapa principal y establecimientos OpenStreetMap

La pantalla autenticada utiliza **MapLibre Native + OpenFreeMap** para dibujar el mapa y **OpenStreetMap mediante Overpass** para obtener establecimientos. No necesita claves Google Maps ni cuenta de facturación. El mapa empieza en Madrid (40.4168, -3.7038), zoom 14.5.

## Buscar y abrir fichas

Al entrar se consultan sitios del centro de Madrid. Después, mueve/acerca el mapa y pulsa **Buscar en esta zona**. Los puntos azules y la lista horizontal abren fichas de los resultados. Los nombres del mapa base son contexto geográfico: una etiqueta sin punto azul no implica una ficha cargada.

Se buscan restaurantes, cafeterías, bares, pubs, comida rápida, zonas de restauración, gasolineras, bibliotecas, cines, teatros, comercios, hoteles/alojamientos, museos, lugares de interés y baños. Los negocios requieren nombre en OSM; los baños pueden no tenerlo. Se usan nodos y centros de vías/relaciones. La cobertura depende de lo registrado en OSM y no es un directorio exhaustivo.

- Máximo **300 resultados por consulta**. Acerca el mapa para consultar una zona más concreta si llegas al límite.
- Máximo 0.05 grados de latitud y longitud por zona; las zonas mayores piden acercar el mapa. No se admiten bounds que cruzan el antimeridiano.
- Caché en memoria por sesión durante cinco minutos, hasta 16 zonas. Intervalo mínimo de cinco segundos entre consultas nuevas y un minuto tras HTTP 429/406. No hay reintentos automáticos ni consultas por cada movimiento del mapa.
- La lista horizontal virtualiza todos los resultados. Todos los puntos cargados pueden abrirse en el mapa.
- Se muestran cargas, vacíos y errores con reintento; los puntos anteriores se conservan si una nueva consulta falla. Búsqueda/fotos se cancelan al salir y las respuestas tardías no cambian otra sesión.

La ficha ocupa como máximo el 50% de altura útil y permite scroll. Muestra nombre, categoría, dirección, horario y enlace HTTPS del establecimiento cuando OSM los tiene. La descripción usa description:es/description; si falta, lo indica. Horarios y detalles pueden estar desactualizados.

La información del baño usa toilets y toilets:access/wheelchair/fee; para elementos amenity=toilets también utiliza los tags propios de acceso/accesibilidad/pago. La ausencia de datos se muestra como **Sin datos**, nunca como confirmación de que un negocio tenga baño. Las atribuciones enlazan al elemento original y a la licencia ODbL.

## Fotografías

Las fotos se cargan al abrir una ficha siguiendo las asociaciones del propio lugar: archivo File: JPEG/PNG/WebP en wikimedia_commons/image, imagen P18 de su entidad wikidata y categoría Commons explícita (wikimedia_commons o P373 de esa entidad). Se consulta la API de Commons para resolver una miniatura de 960px y metadatos de autor/licencia. La categoría devuelve como máximo seis archivos con metadatos en una petición y se elige el primer raster admitido con créditos completos. No se recorren subcategorías ni se buscan fotos por proximidad/nombres; brand:wikidata no se usa para fotografiar locales concretos.

Solo se aceptan hosts HTTPS upload.wikimedia.org/thumb.wikimedia.org y licencias Creative Commons BY, BY-SA, CC0 o dominio público identificadas mediante su URL. Se muestran autor, original y licencia; la presentación cover encuadra la foto. Los archivos inexistentes o sin metadatos admitidos permiten probar la siguiente asociación; cancelación/rate-limit detienen el proceso. La caché guarda hasta 32 fotos por identidad completa de la asociación dentro de la sesión.

Enlaces arbitrarios, sitios sin ninguna asociación admitida o fotos sin metadatos/licencia no generan una imagen. Una imagen ausente o que falla muestra **Foto no disponible** sin impedir leer el resto de la ficha. La primera versión solo detectaba una foto directa entre 300 sitios porque ignoraba categorías/Wikidata; esta ampliación aprovecha ambas. Se han comprobado fotos reales de Teatro Alfil y Lhardy. La cobertura sigue siendo parcial y no equivale a Google Places.

El catálogo editorial anterior (Casa Labra/Botín) y sus dos fotos locales siguen en repository como adapter alternativo, pero la pantalla usa OSM. Sus fotos son de Tamorlan (2009), CC BY 3.0, reducidas y encuadradas: [Casa Labra](https://commons.wikimedia.org/wiki/File:Casa_Labra-2009.jpg), [Botín](https://commons.wikimedia.org/wiki/File:Casa_Bot%C3%ADn-Madrid-2009.jpg), [licencia](https://creativecommons.org/licenses/by/3.0/). No se mezclan silenciosamente con fichas OSM.

## Proveedores y red

Overpass: https://overpass-api.de/api/interpreter. Peticiones POST identificadas con User-Agent WCReview/1.0 y la URL del proyecto. Son servidores compartidos con capacidad limitada: la política cuenta las consultas de todos los usuarios de una app y recomienda servidor propio/proveedor comercial para uso comercial o volumen alto. Esta integración no ofrece SLA ni capacidad ilimitada. Referencias: [instancias y política Overpass](https://wiki.openstreetmap.org/wiki/Overpass_API), [Overpass QL](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL), [atribución/licencia OSM](https://www.openstreetmap.org/copyright).

Commons: https://commons.wikimedia.org/w/api.php. [API de metadatos de imagen](https://www.mediawiki.org/wiki/API:Imageinfo), [categorías](https://www.mediawiki.org/wiki/API:Categorymembers). Wikidata: https://www.wikidata.org/w/api.php, [acceso a datos](https://www.wikidata.org/wiki/Wikidata:Data_access). Las consultas envían el archivo/categoría/ID enlazado y no una ubicación GPS.

Estilo: https://tiles.openfreemap.org/styles/liberty. [OpenFreeMap](https://openfreemap.org/quick_start/) sirve estilo/teselas sin clave. Mantén visibles sus atribuciones OpenStreetMap/OpenMapTiles. Los controles se colocan por encima de la ficha. No hay descarga de áreas offline ni uso del servidor raster público de OSM.

La red es necesaria para mapa, búsquedas y fotos; la caché no es persistente/offline. Overpass recibe los límites geográficos de la zona consultada. **Mi ubicación** solicita permiso solo al pulsar y centra el mapa; no dispara automáticamente una consulta de establecimientos. Si después pulsas Buscar en esta zona, se enviarán los bounds visibles. Firebase Authentication y sus tokens no se envían a estos proveedores. No hay servicio Places/Functions/Storage, editor móvil, aportaciones ni reseñas propias en esta iteración.

## Compilar y actualizar

El binario debe tener MapLibre Native; no funciona en Expo Go ni en el binario anterior con react-native-maps. Para instalar el cambio nativo inicial desde Google:

```sh
npm ci
npx expo prebuild --clean
npm run ios
# O bien:
npm run android
```

Si ya tienes el development build MapLibre, este cambio OSM solo modifica JavaScript: recarga con Metro actualizado, sin regenerar ni recompilar nativo. Reinicia Metro con `npx expo start --dev-client --clear` si quedó con configuración antigua. Las variables GOOGLE_MAPS_IOS_API_KEY, GOOGLE_MAPS_ANDROID_API_KEY, PLACES_DETAILS_URL y PLACES_PHOTO_URL no se leen y pueden eliminarse del entorno. El login Google mantiene su configuración OAuth/Firebase independiente del mapa.

Para EAS: `npx eas-cli@latest build --profile development` con perfil configurado. Antes de entregar cambios: `npm test`, `npm run check`, `npm run export`. Cambiar dependencias/plugins nativos requiere verificar compilaciones de las plataformas afectadas.

## Error iOS: no se encuentra MapLibre.xcframework

MapLibre Native es un paquete binario Swift. Si Xcode muestra There is no XCFramework found dentro de DerivedData/.../SourcePackages/artifacts/maplibre-gl-native-distribution/, resuelve dependencias y vuelve a compilar:

```sh
xcodebuild -resolvePackageDependencies -workspace ios/WCReview.xcworkspace -scheme WCReview
npm run ios
```

El workspace debe existir; si falta ios/, ejecuta primero `npx expo prebuild`. No copies el framework desde otro DerivedData ni edites Pods/proyectos generados. Las advertencias de fases de scripts con dependencias ambiguas no causan ese error.

## Aceptación

Consultar verification.md de add-osm-establishments para proveedor real e iOS verificados, checks y límites. Quedan escenarios generales de aceptación en Android, texto grande/pantalla pequeña, red caída en dispositivo, permisos de ubicación y logout/cambio de usuario. Las pruebas con dobles y exports no sustituyen esas comprobaciones.
