## Context

Cambio existente en feature/main-screen. El usuario ha sustituido el requisito de Google Maps/Places por MapLibre y fichas propias para evitar facturación. Expo 57, React Native 0.86.3, arquitectura nueva; MapLibre RN 11.5.0 soporta React >=19.1/RN >=0.80/Expo >=54 y exige un nuevo development build.

## Goals / Non-Goals

Mapa sin clave y catálogo editorial propio con fotos/descripciones; conservar autenticación, ubicación opcional y tarjeta. No añadir búsqueda, filtros, reseñas de baños, subida de fotos ni editor móvil en esta iteración. El catálogo es un archivo versionado y documentado, ampliable por el propietario del proyecto.

## Decisions

### Map and selection

MapLibre Native con el estilo Liberty de OpenFreeMap: https://tiles.openfreemap.org/styles/liberty. Madrid (40.4168, -3.7038), zoom 14.5. GeoJSONSource con IDs propios, Layer circle/symbol para marcadores y nombres, evento onPress de la fuente que solo acepta IDs presentes en el catálogo. Los POIs del mapa base son contexto; no originan consultas ni prometen fotos. Una lista horizontal accesible permite seleccionar los mismos registros. Camera inicial y easeTo para selección/ubicación; padding y posiciones de atribución/compass sitúan controles fuera de las superposiciones. Cerrar conserva el viewport.

### Catalogue and layers

PlacesRepository añade listPlaces; el caso de uso valida IDs, nombres y coordenadas. CatalogueRecord dentro de repository contiene id propio, nombre, coordenadas, dirección/descripción opcionales, foto local y créditos. El adapter copia datos para evitar mutaciones, rechaza registros desconocidos y fotos de otros lugares, respeta abort y resuelve imágenes solo al abrir la ficha. bundled-places-repository encapsula Image.resolveAssetSource y require de assets; UI recibe únicamente URI y créditos. Sin clave Places, transporte autenticado, Functions, Storage ni despliegue de backend. El contenido editorial es público, empaquetado con la aplicación y disponible tras autenticación en la UI; no se presenta como contenido confidencial.

Se incluyen Casa Labra y Sobrino de Botín con fuentes Turismo de Madrid; fotos Tamorlan (2009), CC BY 3.0, reducidas a 960px. Créditos de autor, origen, licencia y adaptación aparecen en la tarjeta. No se inventan datos sobre baños. No existe actualización automática de establecimientos ni scraping en runtime. Nuevos registros/fotos necesitan entrega de una nueva versión/bundle.

### Session and card

Auth conserva su listener/modelo. Composition crea dependencias por user.id. Loader de selección mantiene invalidación por generación y AbortController al seleccionar otro lugar, cerrar, desmontar o logout. La tarjeta conserva ScrollView, placeholders, fallos de imagen, créditos y extensibilidad por children; elimina atribución Google fija. La regresión onLayout mantiene captura síncrona de height antes del actualizador de estado.

### Errors and optional location

Carga/reintento del estilo y del catálogo independientes. Sin red el mapa muestra error; las fichas/fotos empaquetadas siguen accesibles mediante la lista. expo-location se mantiene; permiso foreground solo al pulsar Mi ubicación, sin seguimiento continuo. Errores no eliminan navegación manual ni logout.

## Risks / Trade-offs

OpenFreeMap requiere red y es una instancia pública sin SLA; puede reemplazarse el estilo/proveedor sin cambiar dominio. La cobertura inicial son dos fichas, no un catálogo de comercios completo. MapLibre exige recompilar el binario; una OTA sobre un binario antiguo no incorpora el módulo. Fotografías históricas no garantizan aspecto actual. El catálogo empaquetado no sincroniza cambios ni permite aportaciones desde la app.

## Migration Plan

Actualizar artefactos existentes con la decisión del usuario, instalar con expo install, sustituir plugin y mapa/repositorio, eliminar servicio Google no desplegado, probar, exportar y regenerar/compilar ambos targets. Mantener el cambio abierto si falta aceptación en dispositivos. Conservar app.json/appleTeamId y no integrar main sin petición expresa.

## References

- https://docs.expo.dev/versions/v57.0.0/
- https://maplibre.org/maplibre-react-native/docs/setup/expo/
- https://maplibre.org/maplibre-react-native/docs/components/map/
- https://maplibre.org/maplibre-react-native/docs/components/camera/
- https://openfreemap.org/quick_start/
