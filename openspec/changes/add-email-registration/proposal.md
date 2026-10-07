## Why

El login solo permite acceder a cuentas existentes y falta crear una cuenta desde la app. Añadir el registro por email completa el flujo de acceso dentro de la feature auth.

## What Changes

- Añadir una pantalla Crear cuenta accesible desde login, con email, contraseña y confirmación.
- Validar email, contraseña de al menos seis caracteres y coincidencia antes de enviar.
- Crear la cuenta mediante un caso de uso inyectado y el repositorio Firebase; entrar en la pantalla autenticada al recibir la sesión.
- Mostrar progreso y errores en español, evitando envíos duplicados.

## Capabilities

### New Capabilities
Ninguna.

### Modified Capabilities
- `user-auth`: Registro por email y navegación entre login y registro.

## Impact

Feature auth: domain, use-cases, repository y ui; adaptadores de Expo Router, pruebas y documentación. Sin dependencias ni cambios nativos nuevos. El registro exige Email/Password habilitado en Firebase. No incluye recuperación de contraseña, verificación de email ni creación automática de cuentas durante las pruebas.
