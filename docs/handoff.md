# Handoff entre ordenadores

Actualizado: 2026-08-04 (Atlantic/Canary).

## Punto estable y ramas

- `main`: web terminal actualmente publicada; commit base `df975cda5ff8b2390a0ad72e316ecda5eb9fcf9c`.
- backup remoto: `backup/static-terminal-2025`.
- rama de trabajo publicada: `codex/portable-architecture`.
- último commit remoto estable de código: `64af8dc85f7a865330e9eb8336d1586da1b4c346` (`fix: stabilize owner session handoff`).

No promover todavía a `main`: Auth, Data API y el editor ya están verificados en integración, pero faltan Storage/Function, la promoción controlada a producción y las variables de Pages.

## Estado funcional actual

Funciona desde un clon sin servicios mediante diez fixtures públicos. La web es un tablero de corcho a pantalla completa: pan ilimitado, zoom por rueda/pellizco/botones, stickers con elementos principales y ampliaciones que conservan el corcho. Se verificó a 390 px y escritorio, incluida la apertura de Formación.

El modo propietario contiene login, recuperación de sesión, inventario, CRUD, papelera recuperable, seis tipos de bloque, drag and drop accesible, subida de imágenes, bloqueo optimista, snapshots y restauración. El E2E real ya pasó en una rama Neon aislada: alta, edición, reordenación, conflicto obsoleto, borrado, papelera, restauración, historial, registro de metadata y logout. El primer inventario espera la propagación del token para no degradarse accidentalmente a lectura anónima.

Última validación: `pnpm check` (11 tests) y `pnpm build` con la variable de Pages vacía pasan; además se probó en navegador el foco inicial, el ciclo de tabulación, Escape, el retorno al sticker y un login propietario desde cero con inventario privado correcto. La validación anterior `pnpm portability:verify` también pasó desde un clon temporal limpio.

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
- rama productiva intacta: `br-blue-dawn-ay0e37ed`;
- rama de integración: `codex-integration` (`br-tiny-art-ayb43loi`);
- Auth y Data API: activos en integración;
- migraciones 0001–0004 y fixtures: activos solo en integración;
- Storage/Function: pendientes de `neon config plan/deploy`.

No copiar cadenas de conexión, tokens ni cuentas temporales al repositorio. El proyecto existente “C2 Practice Log” no se tocó.

Para completar Storage/Function hay que autorizar la Neon CLI una vez mediante OAuth; no pegar cadenas de conexión ni claves en el chat.

## Servicios por conectar

1. rama productiva del proyecto Neon ya creado;
2. orígenes/callbacks de Managed Better Auth para Pages;
3. Object Storage bucket público `portfolio-assets`;
4. Neon Function `storage` con `ALLOWED_ORIGINS`;
5. GitHub Actions Variables/Secrets;
6. GitHub Pages (ya publica `main`; falta promover la nueva versión).

Notion no forma parte del runtime. Solo se consulta en lectura si una tarea futura necesita contexto y nunca se copia el diario al repositorio.

## Variables pendientes

Todas las variables de `.env.example` están deliberadamente vacías. Tras provisionar Neon se necesitan los endpoints públicos `VITE_NEON_AUTH_URL`, `VITE_NEON_DATA_API_URL`, `VITE_STORAGE_FUNCTION_URL` y `VITE_STORAGE_PUBLIC_BASE_URL`; en GitHub, además, `VITE_ENABLE_REMOTE_DATA=true`.

Las variables operativas privadas (`NEON_API_KEY`, `DATABASE_URL`) van solo a secrets seguros. `OWNER_AUTH_USER_ID` se usa localmente al crear la allowlist. Nunca convertirlas en `VITE_*`.

## Próximos pasos concretos

1. Autorizar Neon CLI/Console en esta sesión y desplegar Storage/Function sobre integración.
2. Probar subida/render/export/import/delete de una imagen pública de prueba.
3. Preparar de nuevo la migración productiva con un lote aceptado; verificar su rama temporal y pedir aprobación justo antes de promoverla.
4. Aplicar fixtures públicos y crear/allowlistar al propietario real en producción.
5. Regenerar o cotejar tipos de Data API.
6. Configurar Variables/Secrets de GitHub y ejecutar workflows manuales.
7. Ejecutar la verificación desde clon limpio contra una rama Neon aislada.
8. Promover la rama a `main`, revisar online cada control/pantalla y crear tag estable.

## Errores y limitaciones conocidas

- Neon JS/Auth/Data API/Storage/Functions están en beta.
- Storage/Functions requieren `aws-us-east-2` en esta arquitectura.
- Si el PUT de imagen funciona y el registro SQL falla, queda un objeto huérfano hasta reconciliación.
- Storage/Functions aún no se han desplegado; el resto del E2E de Neon sí pasó en integración.
- La preparación automática del lote completo de producción devolvió `INVALID_ARGUMENT` antes de crear una migración; no hubo cambios productivos.
- Git local en esta máquina temporal no tiene credencial GitHub; los commits se publican mediante el conector autorizado.

## Decisiones aún cambiables

- proveedor de storage si Neon beta/región deja de encajar;
- dominio personalizado y proveedor OAuth;
- política de retención/versiones;
- textos y periodos definitivos del contenido público.

## Puntos delicados

No mover secretos a `VITE_*`; no conceder escritura por el mero hecho de estar autenticado; no exponer `app_private`; no desactivar RLS; no eliminar el backup terminal; no editar una migración ya aplicada; no cambiar el bucket a privado sin implementar URLs GET firmadas; no promover producción sin revisar el plan y pasar la matriz de permisos.
