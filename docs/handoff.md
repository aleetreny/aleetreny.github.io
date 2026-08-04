# Handoff entre ordenadores

Actualizado: 2026-08-04 (Atlantic/Canary).

## Punto estable y rama

- Último commit estable remoto previo a esta fase: `df975cda5ff8b2390a0ad72e316ecda5eb9fcf9c` (`main`, web terminal).
- Backup remoto: `backup/static-terminal-2025`.
- Rama de trabajo: `codex/portable-architecture`.
- El SHA publicado de esta fase debe sustituir esta nota al cerrar la sesión.

## Estado funcional

Funciona localmente sin servicios mediante fixtures. Existe frontend React, modo propietario de login/inventario, cliente Neon, esquema/RLS, function broker de storage, scripts DB/storage, CI/Pages/provisión y documentación. La integración real con Neon no se ha ejecutado porque no se proporcionó un proyecto/branch.

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

## Servicios por conectar

1. GitHub Pages (source: Actions).
2. Neon project en `aws-us-east-2`.
3. Managed Better Auth y trusted origins.
4. Data API.
5. Neon Function `storage`.
6. Neon Object Storage bucket `portfolio-assets`.
7. Notion solo lectura, únicamente si una tarea futura necesita contexto.

## Variables pendientes

Todas las variables de `.env.example` carecen deliberadamente de valores reales. Para producción se necesitan como mínimo los endpoints públicos `VITE_*`; para provisionar, `NEON_API_KEY`, `DATABASE_URL`, `NEON_PROJECT_ID`, `NEON_BRANCH`, `ALLOWED_ORIGINS`; para allowlist, `OWNER_AUTH_USER_ID` local.

## Próximos pasos concretos

1. Obtener acceso a Neon y confirmar/create proyecto en región compatible.
2. Ejecutar `neon plan/deploy` en rama dev.
3. Migrar, seed, crear propietario y verificar RLS con tres identidades.
4. Configurar storage/function y probar upload/delete.
5. Implementar editor transaccional, snapshots y dnd-kit.
6. Migrar contenido público definitivo.
7. Configurar GitHub Variables/Secrets, desplegar branch de prueba y después `main`.
8. Ejecutar clon limpio con rama Neon aislada y etiquetar release.

## Errores/limitaciones conocidas

- Storage/Functions y Neon JS/Auth/Data API están en beta.
- Storage/Functions requieren `aws-us-east-2`.
- No hay editor persistente ni UI de uploads todavía.
- No hay pruebas end-to-end con Neon real.
- El cliente Git local de la máquina temporal no tiene credencial GitHub; se usa el conector autorizado para publicar. Una máquina nueva debe configurar SSH/token normalmente.
- El repositorio es privado; GitHub Pages privado requiere un plan compatible.

## Decisiones aún cambiables

- migrar storage/broker a otro proveedor si Neon beta/región no encaja;
- diseño visual definitivo y tipos de bloque;
- proveedor OAuth adicional;
- dominio personalizado;
- política de retención/versiones.

## Puntos delicados

No mover secretos a `VITE_*`; no conceder escritura a `authenticated` sin RLS/allowlist; no eliminar el backup terminal; no editar una migración aplicada; no cambiar el bucket a privado sin implementar URLs GET firmadas; no desplegar `production apply` sin revisar el plan.
