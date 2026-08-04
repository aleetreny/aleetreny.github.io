# Modelo de datos

## Tablas

### `app_private.owner_accounts`

Allowlist no expuesta por Data API. `auth_user_id` referencia lógicamente `neon_auth.user.id`; no hay FK entre esquemas administrados para evitar acoplar migraciones a internals de Auth. `enabled` permite revocar sin borrar historial.

### `content_entries`

Unidad editorial principal. Incluye `slug`, título, resumen, tipo, estado, asset de portada, metadatos JSONB, versión y fechas. Estados válidos:

- `draft`: solo propietario;
- `published`: visible públicamente y exige `published_at`;
- `archived`: solo propietario hasta que se restaure o elimine lógicamente.

Tipos iniciales: `project`, `case-study`, `experience`, `education`, `note`, `custom`. Son `text` con `CHECK`, más fácil de migrar que un enum Postgres.

### `content_blocks`

Bloques ordenados por `position` dentro de una entrada. `block_type` discrimina el renderizador; `props` contiene contenido específico y `layout` decisiones visuales. Ambos deben ser objetos JSONB. El índice parcial impide dos bloques activos en la misma posición.

Ejemplos:

```json
{
  "block_type": "text",
  "props": { "text": "..." },
  "layout": { "width": "wide", "align": "start" }
}
```

```json
{
  "block_type": "image",
  "props": { "assetId": "...", "caption": "..." },
  "layout": { "aspect": "16:9", "bleed": false }
}
```

### `assets`

Metadatos de cada objeto: proveedor, bucket, key, URL pública, MIME, bytes, dimensiones, texto alternativo, JSONB e indicador público. Los bytes no viven en Postgres.

### `entry_versions`

Snapshots JSONB inmutables por `(entry_id, version)`, con motivo y autor. `save_content_entry`, `soft_delete_content_entry`, `restore_content_entry_version` y `restore_deleted_content_entry` conservan una versión completa antes de abandonar cada estado. La restauración desde papelera recupera entrada y bloques de la última instantánea de borrado y avanza la versión optimista.

### `site_settings`

Configuración clave/JSONB. Solo filas con `is_public` son legibles por visitantes; el resto queda para propietario.

## Relaciones

- una entrada tiene cero o muchos bloques;
- una entrada puede referenciar un asset de portada;
- una entrada tiene cero o muchas versiones;
- assets y entradas guardan `owner_id` para trazabilidad, aunque la política actual es de propietario único.

## Borrado lógico

`content_entries`, `content_blocks` y `assets` usan `deleted_at`. Las políticas públicas excluyen filas borradas. El borrado físico solo debe ejecutarse durante mantenimiento/retención y después de comprobar referencias y backups.

## Índices

- feed público por `published_at desc`;
- inventario propietario por `(owner_id, status, updated_at)`;
- bloques activos por `(entry_id, position)`;
- posición única parcial de bloque;
- assets públicos y por propietario;
- versiones por entrada/version descendente.

## Versionado

`version` empieza en 1; el editor usa 0 únicamente para una entrada nueva aún no persistida. La operación de guardado:

1. leer versión actual;
2. insertar snapshot anterior en `entry_versions`;
3. bloquea la fila y compara la versión esperada;
4. incrementar versión;
5. devuelve un documento canónico; los conflictos se muestran en UI y nunca sobrescriben silenciosamente.

## RLS

Las políticas están en `0002_data_api_permissions.sql`. Son permisivas por operación: lectura pública limitada y política `owner_all` para autenticados allowlisted. El esquema `app_private` no concede uso a roles API.

## Tipos TypeScript

`src/types/database.ts` refleja el contrato que consume la app. El 2026-08-04 se cotejaron sus cinco tablas y seis funciones contra `information_schema` de producción. La Neon CLI actual no genera tipos de Data API, por lo que el contrato se mantiene manualmente: después de cada migración hay que volver a cotejarlo y revisar el diff; nunca aceptar cambios que relajen `status`, RLS o nulabilidad sin ADR/migración.
