# Handoff entre ordenadores

Actualizado: 2026-08-04 (Atlantic/Canary).

## Punto estable y ramas

- `main`: web terminal actualmente publicada; commit base `df975cda5ff8b2390a0ad72e316ecda5eb9fcf9c`.
- backup remoto: `backup/static-terminal-2025`.
- rama de trabajo publicada: `codex/portable-architecture`.
- último commit remoto estable de código: `84b3aaf841e378d2e3a249b77de79f5fd7769cce` (`feat: add recoverable editor trash`).

No promover todavía a `main`: el frontend está listo, pero la integración real de Neon no se ha ejecutado.

## Estado funcional actual

Funciona desde un clon sin servicios mediante diez fixtures públicos. La web es un tablero de corcho a pantalla completa: pan ilimitado, zoom por rueda/pellizco/botones, stickers con elementos principales y ampliaciones que conservan el corcho. Se verificó a 390 px y escritorio, incluida la apertura de Formación.

El modo propietario contiene login, recuperación de sesión, inventario, CRUD, papelera recuperable, seis tipos de bloque, drag and drop accesible, subida de imágenes, bloqueo optimista, snapshots y restauración. Todo compila y está cubierto por pruebas unitarias básicas, pero requiere Neon real para un E2E.

Última validación: `pnpm check` y `pnpm build` pasan; además se probó en navegador el foco inicial, el ciclo de tabulación, Escape y el retorno al sticker tras cerrar. La validación anterior `pnpm portability:verify` también pasó desde un clon temporal limpio. Todavía no incluye servicios externos porque falta el proyecto Neon correcto.

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

## Acción externa necesaria

Crear manualmente en Neon Console:

- nombre: `aleetreny-portfolio`;
- organización: `Alejandro Treny`;
- región: AWS US East 2 / Ohio (`aws-us-east-2`);
- base inicial: `neondb`.

El conector disponible no acepta región y crea en `us-west-2`. Se hizo una creación vacía para comprobarlo y se eliminó inmediatamente. El proyecto existente “C2 Practice Log” no se tocó.

Cuando exista el proyecto correcto, conectar esta sesión o facilitar acceso mediante el conector; no pegar cadenas de conexión ni claves en el chat.

## Servicios por conectar

1. proyecto Neon correcto y una rama de desarrollo TTL;
2. Managed Better Auth con orígenes/callbacks local y Pages;
3. Data API vinculada a Neon Auth;
4. Object Storage bucket público `portfolio-assets`;
5. Neon Function `storage` con `ALLOWED_ORIGINS`;
6. GitHub Actions Variables/Secrets;
7. GitHub Pages (ya publica `main`; falta promover la nueva versión).

Notion no forma parte del runtime. Solo se consulta en lectura si una tarea futura necesita contexto y nunca se copia el diario al repositorio.

## Variables pendientes

Todas las variables de `.env.example` están deliberadamente vacías. Tras provisionar Neon se necesitan los endpoints públicos `VITE_NEON_AUTH_URL`, `VITE_NEON_DATA_API_URL`, `VITE_STORAGE_FUNCTION_URL` y `VITE_STORAGE_PUBLIC_BASE_URL`; en GitHub, además, `VITE_ENABLE_REMOTE_DATA=true`.

Las variables operativas privadas (`NEON_API_KEY`, `DATABASE_URL`) van solo a secrets seguros. `OWNER_AUTH_USER_ID` se usa localmente al crear la allowlist. Nunca convertirlas en `VITE_*`.

## Próximos pasos concretos

1. Crear y conectar el proyecto `aws-us-east-2`.
2. Crear rama `codex-integration` y ejecutar `neon config plan/deploy`.
3. Aplicar migraciones 0001–0004, cargar demo y crear propietario.
4. Verificar anon/no-owner/owner, conflicto de versión y restore.
5. Probar subida/render/export/import/delete de una imagen no privada.
6. Regenerar o cotejar tipos de Data API.
7. Configurar Variables/Secrets de GitHub y ejecutar workflows manuales.
8. Ejecutar la verificación desde clon limpio contra una rama Neon aislada.
9. Promover la rama a `main`, verificar Pages y crear tag estable.

## Errores y limitaciones conocidas

- Neon JS/Auth/Data API/Storage/Functions están en beta.
- Storage/Functions requieren `aws-us-east-2` en esta arquitectura.
- Si el PUT de imagen funciona y el registro SQL falla, queda un objeto huérfano hasta reconciliación.
- No hay E2E con servicios reales todavía.
- Git local en esta máquina temporal no tiene credencial GitHub; los commits se publican mediante el conector autorizado.

## Decisiones aún cambiables

- proveedor de storage si Neon beta/región deja de encajar;
- dominio personalizado y proveedor OAuth;
- política de retención/versiones;
- textos y periodos definitivos del contenido público.

## Puntos delicados

No mover secretos a `VITE_*`; no conceder escritura por el mero hecho de estar autenticado; no exponer `app_private`; no desactivar RLS; no eliminar el backup terminal; no editar una migración ya aplicada; no cambiar el bucket a privado sin implementar URLs GET firmadas; no promover producción sin revisar el plan y pasar la matriz de permisos.
