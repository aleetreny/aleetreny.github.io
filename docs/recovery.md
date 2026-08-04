# Recuperación

## Reconstrucción total

1. clona GitHub y selecciona la rama/tag estable;
2. instala Node/pnpm y `pnpm install --frozen-lockfile`;
3. copia `.env.example` a `.env.local`;
4. crea/enlaza proyecto Neon compatible;
5. crea una rama aislada;
6. ejecuta `neon config plan` y `neon deploy`;
7. configura `DATABASE_URL` y `pnpm db:migrate`;
8. crea/allowlist propietario;
9. importa DB pública y objetos si existen backups;
10. `pnpm db:verify`, `pnpm check`, `pnpm build`;
11. configura GitHub Variables/Secrets y Pages;
12. verifica login, RLS, subida y página pública antes de producción.

## Restaurar esquema sin historial de migraciones

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

Después registra/contrasta `app_private.schema_migrations` usando una base nueva preferentemente; no marques migraciones manualmente en una base existente sin verificar checksums.

## Recuperar datos

- error reciente en Neon: crea rama desde un punto anterior/instant restore dentro de la ventana del plan;
- export lógico: `pnpm db:import` con owner de destino;
- objetos: `pnpm storage:import` y después reconciliar `assets.public_url`;
- datos personales: usa backup privado aprobado, nunca fixtures Git.

## Volver a la web anterior

La versión terminal está preservada en:

- rama remota `backup/static-terminal-2025`;
- snapshot `legacy/terminal-portfolio/index.html`;
- commit original `df975cda5ff8b2390a0ad72e316ecda5eb9fcf9c`.

Rollback seguro: crea una rama desde el backup, abre/revisa el cambio hacia `main` o cambia temporalmente la fuente de Pages. No borres historial. Valida que el backup no dependa de assets locales (usa CDNs externos como antes).

## Fallo de Auth/Data API

Desactiva temporalmente `VITE_ENABLE_REMOTE_DATA` y despliega fixtures solo si se acepta mostrar contenido demo; esto no recupera borradores ni habilita edición. Investiga URLs de rama, trusted origins, roles, caché de esquema y RLS.

## Fallo de Storage

El contenido textual sigue funcionando si las URLs de imagen no son esenciales. No expongas credenciales como atajo. Restaura en rama, verifica objetos y luego cambia URLs/configuración.

## Evidencia de recuperación

Registra fecha, commit, rama Neon, backup utilizado, comandos y verificaciones en un issue/documento operativo sin secretos; actualiza `docs/handoff.md`.
