## 1. Contratos y casos de uso

- [x] 1.1 Definir los modelos de selección/detalles/foto/atribución y contratos PlacesRepository y LocationRepository dentro de main-screen/domain.
- [x] 1.2 Implementar casos de uso inyectados para selección válida, detalles/foto y ubicación opcional; probar entradas inválidas y errores sin SDKs.
- [x] 1.3 Extender las comprobaciones de arquitectura a main-screen, preservando el contrato y el estado global de auth.

## 2. Servicio de establecimientos

- [x] 2.1 Añadir la base de functions y endpoints autenticados Firebase para detalles y fotos con validación de ID token, parámetros y errores controlados.
- [x] 2.2 Integrar Places Details con máscara explícita y español, normalizar respuestas incompletas y entregar fotos acotadas con atribución sin exponer la clave de servidor.
- [x] 2.3 Implementar límites compartidos por usuario, cuotas configurables, tiempos de espera y validación de pertenencia de fotos; probar acceso no autenticado, parámetros inválidos, límites, respuestas parciales y fallos del proveedor.
- [x] 2.4 Documentar APIs de Google, facturación, secreto de Places, región/endpoints y pasos de despliegue. Preparar el despliegue sin modificar servicios remotos hasta su autorización explícita.

## 3. Integración móvil y configuración

- [ ] 3.1 Instalar react-native-maps y expo-location con Expo 57; configurar Google en ambas plataformas usando claves restringidas por plataforma y entorno.
- [x] 3.2 Implementar adaptadores de servicio Firebase y ubicación dentro de repository, manteniendo tokens/SDKs fuera de domain, use-cases y UI.
- [x] 3.3 Crear la composición MainScreenFeature con dependencias inyectadas y utilizar el AuthProvider existente para identidad, sesión y logout.

## 4. Mapa y ficha superpuesta

- [x] 4.1 Construir MainScreen con mapa navegable, región inicial Madrid, controles de usuario/logout y centrado opcional que solicita permiso solo al pulsar.
- [x] 4.2 Conectar selección de POI por placeId, indicación del lugar elegido y cámara/insets que mantienen visibles el punto seleccionado y atribuciones del mapa.
- [x] 4.3 Crear tarjeta inferior cerrable con nombre, foto, descripción, atribución y composición extensible; limitarla al 50% de altura útil y permitir scroll/accesibilidad.
- [x] 4.4 Añadir carga, reintento, placeholders, mensajes de configuración y fallos de ubicación. Invalidar resultados al cambiar lugar, cerrar, desmontar o cambiar usuario; verificar las carreras y el aislamiento entre sesiones.
- [x] 4.5 Sustituir CounterFeature en index y retirar el contador y sus pruebas/composición sin alterar login/registro ni los guards de sesión.

## 5. Verificación y entrega

- [x] 5.1 Ejecutar pruebas relevantes de app y servicio, npm run check, exportaciones móviles y compilaciones nativas iOS/Android; documentar resultados.
- [ ] 5.2 Con APIs y servicio configurados, comprobar en ambas plataformas selección real de POIs, fotos/atribuciones, descripción ausente, tarjeta en pantalla pequeña/texto grande, cierre/reintento, selección rápida, ubicación denegada y logout.
- [x] 5.3 Actualizar README y docs/architecture.md con la nueva pantalla, sus dependencias, configuración y límites de cobertura; verificar OpenSpec contra la implementación.
- [ ] 5.4 Registrar verificación, sincronizar specs y archivar solo cuando la implementación esté completa; crear commits y subir feature/main-screen sin integrar en main ni incluir el cambio local ajeno de appleTeamId.

## Estado de continuación (2026-10-07)

La instalación y los plugins de 3.1 están implementados. La tarea permanece abierta hasta configurar claves reales restringidas por plataforma/entorno. 5.2 necesita esas claves y el servicio desplegado; no se acepta con fixtures ni una clave de compilación sin validez. 5.4 permanece abierta: la verificación se registra en verification.md, pero no se sincroniza ni archiva mientras falte la aceptación. No se modifica main ni se incluye el cambio local appleTeamId.
