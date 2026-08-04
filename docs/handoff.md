# Handoff entre ordenadores

Actualizado: 2026-08-04 (Atlantic/Canary).

## Punto estable y ramas

- `main`: contiene la nueva arquitectura y se actualiza desde la rama de trabajo tras cada verificación estable.
- backup remoto: `backup/static-terminal-2025`.
- rama de trabajo publicada: `codex/portable-architecture`.
- commit original de rollback: `df975cda5ff8b2390a0ad72e316ecda5eb9fcf9c`.

GitHub Pages ya tiene seleccionada **Settings > Pages > Source: GitHub Actions**. No se debe volver a elegir una rama como fuente porque publicaría los fuentes Vite sin compilar.

## Estado funcional actual

Funciona desde un clon sin servicios mediante diez fixtures públicos. La web es un tablero de corcho a pantalla completa: pan ilimitado, zoom por rueda/pellizco/botones, stickers con elementos principales y ampliaciones que conservan el corcho. Se verificó a 390 px y escritorio, incluida la apertura de Formación.

El modo propietario contiene signup, login, recuperación de sesión, inventario, CRUD, papelera recuperable, seis tipos de bloque, drag and drop accesible, subida de imágenes, bloqueo optimista, snapshots y restauración. El E2E real pasó en una rama Neon aislada y después en producción con una cuenta temporal: alta, edición, reordenación, borrado, papelera, restauración, historial y logout. La cuenta y los datos temporales productivos se eliminaron. El primer inventario espera la propagación del token para no degradarse accidentalmente a lectura anónima.

Última validación local: `pnpm check` (14 tests) y build con endpoints productivos pasan. `pnpm portability:verify` se repitió después del guard de producción y pasó desde clon limpio: instalación frozen, scan, lint, tipos, 14 pruebas y build, sin archivos locales anteriores. El commit posterior solo registra esta evidencia documental.

El trigger manual de `.github/workflows/deploy-pages.yml` también se verificó: ejecución de Actions `#11`/`30959042031`, jobs `build` y `deploy` correctos. Tras ella, `index.html` siguió referenciando `/assets/index-*.js`, nunca `/src/main.tsx`, y los assets JS/CSS respondieron HTTP 200.

La auditoría final del artefacto online compilado cubrió presentación, cinco stickers, todos los paneles, enlaces, zoom, centrado, pan por teclado, Escape, retorno de foco, login/signup, inventario, seis bloques, reordenación, preview de imagen, guardado, publicación visible en el tablero, historial, restore, archivado, papelera, recuperación y logout. No aparecieron overlays, alertas inesperadas ni imágenes rotas. Se corrigieron durante la auditoría el scroll retenido al autenticar y el timestamp `+00:00` devuelto por Postgres. La cuenta y el contenido sintéticos se eliminaron; producción quedó en 10 entradas, 8 bloques, 0 assets y 0 cuentas.

## Primeros comandos en otra máquina

```bash
git clone git@github.com:aleetreny/aleetreny.github.io.git
cd aleetreny.github.io
git switch codex/portable-architecture
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm check
pnpm build
pnpm dev
```

## Neon disponible

- proyecto: `aleetreny-portfolio` (`divine-queen-66854519`);
- región: AWS US East 2 / Ohio (`aws-us-east-2`);
- base: `neondb`;
- rama productiva: `br-blue-dawn-ay0e37ed`, con Auth, Data API, migraciones 0001–0004 y fixtures públicos;
- rama de integración: `codex-integration` (`br-tiny-art-ayb43loi`);
- Auth y Data API: activos en integración y producción;
- migraciones 0001–0004 y fixtures: verificados en ambas ramas;
- Storage/Function: desplegados y verificados en ambas ramas;
- bucket público en ambas ramas: `portfolio-assets`;
- ciclo live verificado con `pnpm storage:verify-live`; producción requiere además `STORAGE_VERIFY_ALLOW_PRODUCTION=true` como confirmación explícita;
- el plan actual permite cero ramas protegidas: se desplegó producción con `NEON_PROTECT_DEFAULT_BRANCH=false`; el environment GitHub `production` solo acepta `main` y el workflow exige `APPLY_PRODUCTION` como compensación temporal.

No copiar cadenas de conexión, tokens ni cuentas temporales al repositorio. El proyecto existente “C2 Practice Log” no se tocó.

La Neon CLI quedó autorizada por OAuth en este ordenador temporal. En otro equipo debe repetirse `neon auth` en el navegador; nunca se pegan tokens, cadenas de conexión ni contraseñas en el chat.

## Servicios por conectar

1. cuenta Auth real allowlisted como propietaria;
2. GitHub Actions Secrets para provisión administrativa;
3. mantener `production` restringido a `main` y la confirmación `APPLY_PRODUCTION` mientras la rama Neon no pueda protegerse; el plan privado actual no ofrece revisores obligatorios.

Notion no forma parte del runtime. Solo se consulta en lectura si una tarea futura necesita contexto y nunca se copia el diario al repositorio.

## Variables pendientes

Los valores secretos de `.env.example` están deliberadamente vacíos. Los endpoints públicos `VITE_NEON_AUTH_URL`, `VITE_NEON_DATA_API_URL`, `VITE_STORAGE_FUNCTION_URL` y `VITE_STORAGE_PUBLIC_BASE_URL` tienen fallback productivo versionado en el workflow de Pages y pueden sobreescribirse con Variables; `VITE_ENABLE_REMOTE_DATA` queda activo por defecto en ese workflow.

Las variables operativas privadas (`NEON_API_KEY`, `DATABASE_URL`) van solo a secrets seguros. `OWNER_AUTH_USER_ID` se usa localmente al crear la allowlist. Nunca convertirlas en `VITE_*`.

## Próximos pasos concretos

1. Crear/allowlistar al propietario real en producción sin compartir credenciales.
2. Configurar Secrets operativos de GitHub.
3. Crear el tag estable después de completar las dos acciones anteriores.

## Errores y limitaciones conocidas

- Neon JS/Auth/Data API/Storage/Functions están en beta.
- Storage/Functions requieren `aws-us-east-2` en esta arquitectura.
- Si el PUT de imagen funciona y el registro SQL falla, queda un objeto huérfano hasta reconciliación.
- El plan Neon actual no permite proteger ramas; no promover producción fuera de `main` ni sin `APPLY_PRODUCTION`, y volver a `NEON_PROTECT_DEFAULT_BRANCH=true` al ampliar el plan.
- El preparador de migraciones de lenguaje natural no aceptó el lote completo; la aplicación productiva se completó después como una única transacción de las 76 sentencias versionadas ya verificadas en integración.
- Git local en esta máquina temporal no tiene credencial GitHub; los commits se publican mediante el conector autorizado.
- El selector administrativo de Pages ya se corrigió a GitHub Actions; esta decisión no queda versionada por GitHub y debe revisarse si la URL vuelve a servir `/src/main.tsx`.

## Decisiones aún cambiables

- proveedor de storage si Neon beta/región deja de encajar;
- dominio personalizado y proveedor OAuth;
- política de retención/versiones;
- textos y periodos definitivos del contenido público.

## Puntos delicados

No mover secretos a `VITE_*`; no conceder escritura por el mero hecho de estar autenticado; no exponer `app_private`; no desactivar RLS; no eliminar el backup terminal; no editar una migración ya aplicada; no cambiar el bucket a privado sin implementar URLs GET firmadas; no promover producción sin revisar el plan y pasar la matriz de permisos.
