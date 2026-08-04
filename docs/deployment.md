# Despliegue

## GitHub Pages

Workflow: `.github/workflows/deploy-pages.yml`.

- trigger automático: push a `main`;
- trigger manual: Actions > Deploy GitHub Pages > Run workflow;
- build: `pnpm check` y `pnpm build`;
- artefacto: `dist/` mediante `upload-pages-artifact`;
- despliegue: environment `github-pages` con `pages:write` e identidad OIDC.

En Settings > Pages debe seleccionarse GitHub Actions. No se sube `dist/` al repositorio.

La selección manual inicial en Settings es obligatoria porque cambiar un sitio existente desde la fuente legacy requiere permiso administrativo. Comprueba el resultado con:

```bash
curl -fsSL -H 'Cache-Control: no-cache' https://aleetreny.github.io/index.html \
  | grep -E 'assets/index|src/main'
```

El resultado correcto contiene `/assets/index-*.js`. Si aparece `/src/main.tsx`, Pages está sirviendo el repositorio sin compilar y hay que corregir la fuente antes de continuar.

## Variables de Pages

Todas son públicas porque se incorporan al bundle:

- `VITE_ENABLE_REMOTE_DATA=true`
- `VITE_NEON_AUTH_URL`
- `VITE_NEON_DATA_API_URL`
- `VITE_STORAGE_FUNCTION_URL`
- `VITE_STORAGE_PUBLIC_BASE_URL`

El workflow incluye como fallback los endpoints públicos de producción ya verificados y activa el contenido remoto aunque se pierdan las Variables del repositorio. Las Variables siguen teniendo prioridad y permiten migrar de proyecto sin editar el workflow. Si Neon falla en ejecución, el frontend muestra automáticamente los fixtures versionados; para una recuperación deliberadamente aislada, define `VITE_ENABLE_REMOTE_DATA=false`.

No crear una variable `VITE_DATABASE_URL`, `VITE_NEON_API_KEY` ni `VITE_AWS_SECRET_ACCESS_KEY`.

## Backend Neon

Workflow manual: `.github/workflows/provision-neon.yml`.

GitHub Environments recomendados:

| Entorno | Secrets | Variables | Protección |
| --- | --- | --- | --- |
| development | `NEON_API_KEY`, `DATABASE_URL` de rama dev | `NEON_PROJECT_ID`, `NEON_BRANCH`, `ALLOWED_ORIGINS` | opcional |
| production | `NEON_API_KEY`, `DATABASE_URL` producción | mismas y `NEON_PROTECT_DEFAULT_BRANCH` | solo `main` + confirmación `APPLY_PRODUCTION` |

Ejecuta `plan` antes de `apply`. `apply` despliega `neon.ts`, migra y verifica. No apunta automáticamente a producción en cada push.

La política protege la rama predeterminada salvo que el plan admita cero ramas protegidas. En ese caso usa `NEON_PROTECT_DEFAULT_BRANCH=false`, limita el environment `production` a la rama `main` y exige `production_confirmation=APPLY_PRODUCTION` para `apply`; vuelve a `true` en cuanto el plan lo permita. El plan GitHub actual del repositorio privado no ofrece revisores obligatorios, por lo que esta compensación queda documentada y no debe presentarse como aprobación humana.

## Dominio

Dominio actual previsto: `aleetreny.github.io`. No hay `CNAME`. Para añadir dominio:

1. configura DNS y Settings > Pages;
2. verifica HTTPS;
3. añade origen y callbacks a Neon Auth;
4. actualiza `ALLOWED_ORIGINS`;
5. actualiza URLs canónicas/metadata;
6. documenta el rollback DNS.

## Recuperación de un despliegue fallido

1. inspecciona el job exacto y conserva URL/log relevante;
2. reproduce desde clon limpio con `pnpm install --frozen-lockfile && pnpm check && pnpm build`;
3. corrige en rama y no desactives verificaciones;
4. relanza manualmente si el commit ya contiene la corrección;
5. para rollback, revierte el commit en Git y vuelve a desplegar;
6. para emergencia visual, usa `backup/static-terminal-2025` según `docs/recovery.md`.

## Release

Solo etiqueta una versión estable cuando CI, Pages, Auth, RLS, Storage y clon limpio estén verificados. Formato propuesto: `portfolio-v0.1.0`.
