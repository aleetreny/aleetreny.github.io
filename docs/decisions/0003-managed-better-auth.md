# ADR 0003: Managed Better Auth + allowlist

- Estado: aceptada
- Fecha: 2026-08-04

## Contexto

El portfolio tiene un único propietario, pero el proveedor permite signup general por defecto. Autenticación por sí sola no concede administración.

## Opciones consideradas

- contraseña embebida/client-only (insegura);
- OAuth externo;
- Better Auth autoalojado;
- Managed Better Auth con allowlist Postgres.

## Decisión y razones

Managed Better Auth emite sesión/JWT y `app_private.owner_accounts` decide autorización. RLS consulta `auth.user_id()`.

## Consecuencias

Hay que provisionar Auth antes de migrar y verificar cookies cross-origin. Cuentas no allowlisted solo leen público.

## Cómo cambiar

Configurar un IdP externo en Data API y adaptar verificación JWKS/claim `sub`; mantener la allowlist como frontera estable.
