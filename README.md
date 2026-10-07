# WC Review

Repositorio: [WC-Review](https://github.com/RobertoPavonLariosLabtend/WC-Review). `main` es la rama de producción; cada cambio se desarrolla y verifica en su rama de feature antes de integrarse, sin `develop`. Consulta [CONTRIBUTING.md](CONTRIBUTING.md).

Aplicación React Native con Expo 57, TypeScript y Firebase Authentication. Login con email y contraseña, Google; sesión persistente, pantalla autenticada con contador y cierre de sesión.

## Requisitos y arranque

- Node.js 22.13 o superior y npm.
- iOS: macOS, Xcode 26.4 o superior y CocoaPods. Con Xcode 27 se conserva el soporte de escenas requerido por iOS 27.
- Android: Android Studio, SDK, emulador o dispositivo y JDK compatible con Gradle. Configura `ANDROID_HOME`.

```sh
npm ci
npm run ios
# O bien:
npm run android
```

Estos comandos generan y compilan la app nativa. Firebase y los proveedores utilizan módulos nativos: esta aplicación necesita su propia compilación, no Expo Go. `npm start` inicia Metro para una app de desarrollo ya instalada.

```sh
npm test
npm run check          # Lint, TypeScript y versiones compatibles con Expo
npx expo-doctor
npm run export         # Bundles de producción iOS y Android
npm run ios:release    # App nativa con bundle incorporado, sin necesitar Metro
openspec validate add-firebase-auth --strict
```

## Firebase

Proyecto: `wc-review-11c48`. Identificador Android y bundle iOS: `com.wcreview.app`.

Los archivos están en:

- `config/firebase/GoogleService-Info.plist`
- `config/firebase/google-services.json`

`app.config.ts` comprueba que pertenecen al mismo proyecto y a los identificadores configurados, configura los plugins nativos y extrae los clientes OAuth. No necesita credenciales de servidor. Las contraseñas y tokens no se guardan manualmente: la sesión se mantiene mediante el SDK nativo de Firebase.

En Firebase Console → Authentication → Sign-in method, habilita los métodos que vayas a utilizar.

### Email y contraseña

Activa **Email/Password**. La pantalla permite acceder a cuentas existentes; puedes crear una cuenta propia desde Authentication → Users → Add user. Este cambio no incluye formulario de registro ni recuperación de contraseña.

### Google: configuración OAuth incorporada

Los archivos actualizados incluyen `CLIENT_ID` y `REVERSED_CLIENT_ID` para iOS y el cliente OAuth web (`client_type: 3`) para Android. La app resuelve los IDs automáticamente y habilita Google en ambas plataformas. El acceso real requiere que el proveedor Google esté activo en Firebase y que Android tenga registrada la huella de la firma utilizada.

1. Habilita **Google** en Firebase Authentication.
2. En Project settings → Your apps, configura los certificados SHA-1 y SHA-256 de las firmas Android que vayas a usar. Usa el certificado de desarrollo para pruebas locales y el certificado de Play App Signing para la versión distribuida.
3. Si cambias la configuración en Firebase, descarga de nuevo los archivos afectados y sustituye los de `config/firebase/`.
4. El plist iOS debe incluir `CLIENT_ID` y `REVERSED_CLIENT_ID`. El cliente Android correspondiente a `com.wcreview.app` debe incluir un cliente OAuth de tipo 3, usado como `webClientId`.
5. Regenera y recompila. Una recarga de JavaScript no incorpora cambios de configuración nativa:

```sh
npx expo prebuild --clean
npm run ios
# o npm run android
```

El esquema de retorno de Google se incorpora automáticamente cuando existe `REVERSED_CLIENT_ID`. No se inventan identificadores OAuth ni se incluyen secretos de cliente en la aplicación.

Documentación: [Google en Firebase iOS](https://firebase.google.com/docs/auth/ios/google-signin) y [Google Sign-In con Expo](https://react-native-google-signin.github.io/docs/setting-up/expo).

Apple está retirado temporalmente de la app por petición del usuario.

## Estructura

- `app.config.ts`: integración nativa y lectura de los clientes OAuth.
- `app.json`: identidad y presentación de la app.
- `src/services/auth/`: servicio y lógica de validación, errores y proveedores.
- `src/context/AuthProvider.tsx`: observación y restauración de la sesión.
- `src/app/_layout.tsx`: rutas protegidas que esperan la inicialización.
- `src/app/login.tsx`: pantalla de acceso.
- `src/app/index.tsx`: usuario autenticado, contador y logout.
- `tests/auth.test.mjs`: pruebas de validación, errores, cancelación, disponibilidad Google y token Google.
- `openspec/changes/add-firebase-auth/`: requisitos, diseño y tareas del cambio.

Los directorios `ios/` y `android/` son generados e ignorados por Git. Modifica la configuración Expo y los archivos Firebase, y utiliza prebuild para regenerarlos. Se conserva `package-lock.json` para instalaciones reproducibles. La integración usa CocoaPods con frameworks estáticos y los módulos RNFB enlazados estáticamente, compatibles con el core precompilado de React Native.

## Validación y límites

Las 8 pruebas de lógica, lint, TypeScript, compatibilidad Expo, los 21 controles de Expo Doctor y la exportación de bundles iOS/Android pasan. La compilación iOS Release se completó con cero errores y tres advertencias. Los resultados de compilación, comprobación visual y límites de las pruebas están en [verification.md](openspec/changes/archive/2026-10-07-add-firebase-auth/verification.md).

La actualización OAuth también se ha compilado, instalado y abierto como APK de desarrollo Android. Consulta [la verificación OAuth](docs/verification/google-oauth.md). El éxito de login, la persistencia y el logout con una cuenta real deben comprobarse con cuentas propias después de habilitar los proveedores. Durante este trabajo no se crean cuentas en el proyecto Firebase.

`npm audit` informa de 35 avisos de dependencias (10 moderados y 25 altos). No se han aplicado cambios forzados de versión que rompan la compatibilidad del SDK.
