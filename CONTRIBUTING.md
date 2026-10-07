# Flujo de ramas

`main` contiene la versión integrada para producción. No utilizamos `develop`.

Cada cambio comienza desde `main` en una rama `feature/<nombre>`, `fix/<nombre>` o `chore/<nombre>`. Mantén los commits centrados en un cambio y utiliza prefijos como `feat:`, `fix:`, `docs:` o `chore:`.

```sh
git switch main
git pull --ff-only origin main
git switch -c feature/nombre
```

Antes de integrar, ejecuta:

```sh
npm ci
npm test
npm run check
npm run export
```

Para cambios nativos, regenera y compila la plataforma afectada. Documenta las comprobaciones que requieren configuración externa o cuentas reales. Registra y archiva los cambios OpenSpec cuando corresponda.

Sube la rama para revisión. Después de comprobarla, intégrala en `main` con un commit de merge para conservar la historia de la feature:

```sh
git push -u origin feature/nombre
git switch main
git pull --ff-only origin main
git merge --no-ff feature/nombre
npm test
npm run check
git push origin main
```

La primera feature es `feature/firebase-login`. Se conserva en el remoto como referencia. No hagas force push a `main`.

Integrar en `main` no publica automáticamente la app en las tiendas. La compilación y distribución se gestionan aparte. Este flujo es una convención del repositorio; no configura protección de ramas en GitHub.
