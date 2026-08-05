# Handoff entre ordenadores

Actualizado: 2026-08-05 (Atlantic/Canary).

## Punto estable y ramas

- repositorio: `aleetreny/aleetreny.github.io`;
- rama principal de despliegue: `main`;
- rama de trabajo: `codex/portable-architecture`;
- backup remoto de la web anterior: `backup/static-terminal-2025`;
- commit original de rollback: `df975cda5ff8b2390a0ad72e316ecda5eb9fcf9c`;
- último commit remoto anterior al rediseño: `c5b48c82bb57f2133f5678391359924f62bf253c`.

Actualizar este último SHA después de publicar el rediseño. GitHub Pages debe conservar **Settings > Pages > Source: GitHub Actions**.

## Estado funcional actual

El frontend es un archivo de investigación sobre corcho, no una cuadrícula convencional. Tiene diez zonas, índice fijo, pan/zoom/pellizco/teclado, coordenadas, dossiers expandibles y 24 entradas públicas. La identidad visual usa tinta, hueso, óxido y amarillo señal, sin post-its pastel ni grandes radios. `docs/design-direction.md` contiene la lista de mejoras ya implementadas.

El modo propietario en `/?owner=1` usa la misma estética. Incluye signup/login, allowlist independiente, inventario, CRUD, nueve destinos editoriales, señales, enlaces, seis bloques, reordenación accesible, imágenes, historial y papelera recuperable.

La cuenta real existe y está habilitada como propietaria. No se versionó ni documentó su contraseña, correo o sesión. Los Secrets de provisión existen en los environments cifrados de GitHub. Los planes development `#2` y production `#3` terminaron correctamente después de corregir la invocación del CLI local.

El catálogo está en fixtures y en ambas ramas Neon: 24 entradas publicadas, 9 secciones de contenido y 16 bloques activos. El seed desactiva primero los bloques anteriores del fixture y actualiza `entry_id` durante el upsert, por lo que es idempotente incluso cuando cambia la composición.

## Primeros comandos en otra máquina

```bash
git clone git@github.com:aleetreny/aleetreny.github.io.git
cd aleetreny.github.io
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm check
pnpm build
pnpm dev
```

Para continuar una rama publicada distinta de `main`, ejecutar `git switch <rama>` después del clon. No recuperar archivos de este ordenador.

## Neon disponible

- proyecto: `divine-queen-66854519`, región `aws-us-east-2`, base `neondb`;
- producción: `production` / `br-blue-dawn-ay0e37ed`;
- integración: `codex-integration` / `br-tiny-art-ayb43loi`;
- Auth, Data API, migraciones 0001–0004, Storage, Function y bucket `portfolio-assets` activos en ambas;
- matriz RLS y ciclo completo de Storage verificados previamente;
- catálogo ampliado sincronizado en ambas ramas el 2026-08-05;
- producción usa `NEON_PROTECT_DEFAULT_BRANCH=false` por limitación del plan; el workflow restringe producción a `main` y exige `APPLY_PRODUCTION` para aplicar.

En otra máquina hay que repetir `pnpm exec neon auth`; nunca copiar tokens, cadenas de conexión, contraseñas o sesiones al chat o al repositorio.

## GitHub Actions

Environments:

- `development`: Secrets `NEON_API_KEY`, `DATABASE_URL`; Variables `NEON_PROJECT_ID`, `NEON_BRANCH`, `NEON_PROTECT_DEFAULT_BRANCH`, `ALLOWED_ORIGINS`;
- `production`: los mismos nombres, restringido a `main`.

`.github/workflows/provision-neon.yml` usa `pnpm exec neon`. Ejecutar primero `plan`; `apply` en producción requiere la confirmación literal documentada. `.github/workflows/deploy-pages.yml` construye y publica sin depender de este ordenador.

## Próximos pasos concretos

1. Publicar los commits del rediseño en `main` y en la rama de trabajo relevante.
2. Esperar CI y Deploy GitHub Pages.
3. Auditar online las diez secciones, enlaces, gestos, teclado, modal, contacto y `?owner=1`.
4. Ejecutar `pnpm portability:verify` desde el commit publicado.
5. Actualizar aquí el SHA estable y crear `portfolio-v0.2.0`.

## Errores y limitaciones conocidas

- Neon JS/Auth/Data API/Storage/Functions están en beta.
- Storage/Functions requieren `aws-us-east-2` en esta arquitectura.
- Un PUT correcto seguido de fallo SQL puede dejar un objeto huérfano.
- Git local de este ordenador temporal no tiene credencial GitHub; la publicación usa el conector autorizado.
- Pages puede volver a una fuente de rama mediante configuración manual; comprobar que `index.html` público referencia `/assets/index-*.js`, nunca `/src/main.tsx`.
- Las posiciones de sección son deliberadamente explícitas; ampliar el índice requiere revisar composición y móvil.

## Decisiones aún cambiables

- textos finales y orden del catálogo;
- proveedor de storage si Neon beta/región deja de encajar;
- dominio y proveedor OAuth;
- política de retención/versiones;
- una futura vista filtrable adicional al lienzo, siempre que no elimine la identidad del archivo.

## Puntos delicados

No mover secretos a `VITE_*`; no conceder escritura por autenticación simple; no exponer `app_private`; no desactivar RLS; no borrar el backup terminal; no editar migraciones aplicadas; no hacer públicos detalles de repositorios privados; no promover producción sin plan y confirmación.
