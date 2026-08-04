# Estado del proyecto

Actualizado: 2026-08-04. Rama: `codex/portable-architecture`.

## Terminado en código

- tablero de corcho público a pantalla completa con pan ilimitado, zoom, soporte táctil/teclado y controles visibles;
- stickers de proyectos, trayectoria, formación, perfil y contacto con resumen y ampliación sobre un segundo tablero de corcho;
- metadatos Open Graph/Twitter y tarjeta social propia;
- modo propietario con recuperación de sesión, inventario, alta, edición, publicación, archivo, borrado lógico y papelera restaurable;
- editor de bloques `text`, `heading`, `list`, `metric`, `quote` e `image`;
- drag and drop con puntero/teclado y alternativa explícita subir/bajar;
- subida de imágenes mediante URL firmada y registro seguro de metadata;
- guardado transaccional, bloqueo optimista, snapshots e historial restaurable;
- esquema SQL, índices, JSONB, estados, permisos, RLS y cuatro migraciones reproducibles;
- Auth/Data API/Storage/Function declarados en `neon.ts`;
- scripts de migración, seed, propietario, verificación, backup/import DB y storage;
- CI, GitHub Pages, provisión Neon manual, Dependabot, ADRs y guías de recuperación;
- backup remoto `backup/static-terminal-2025` de la web anterior;
- validación local actual: repo scan, lint, tipos, 11 tests y build con variables de Pages vacías;
- validación anterior desde clon temporal limpio: instalación frozen, repo scan, lint, tipos, 10 tests y build;
- revisión visual local desktop/móvil a 390 px sin overflow; pan, zoom, apertura y cierre verificados en navegador;
- proyecto Neon definitivo `divine-queen-66854519` creado en `aws-us-east-2` y rama aislada `codex-integration` (`br-tiny-art-ayb43loi`) conectada;
- Auth y Data API provisionadas en la rama aislada; migraciones 0001–0004 y fixtures públicos se probaron allí antes de modificar producción;
- matriz real de permisos verificada: lectura anónima, rechazo de escritura para no-owner, CRUD/versiones/conflicto/borrado/papelera/restore para owner;
- inicio de sesión del editor probado desde cero; la carga inicial de la papelera ya espera a la propagación efectiva del token;
- Auth, Data API, migraciones 0001–0004 y diez fixtures públicos desplegados también en producción;
- producción verificada con cinco tablas bajo RLS, siete índices esperados y lectura anónima limitada a 10 entradas/8 bloques;
- `https://aleetreny.github.io` añadido y validado como origen de confianza de Auth productiva;
- workflow Pages conectado a los endpoints públicos productivos, con override por Variables y fallback local de fixtures;
- segunda verificación de portabilidad superada desde un clon limpio: instalación frozen, scan, lint, tipos, 11 tests y build.

“Terminado en código” no significa verificado contra servicios reales.

## Parcialmente implementado

| Elemento | Estado | Archivos | Dependencia | Criterio de finalización |
| --- | --- | --- | --- | --- |
| Integración Neon | Auth, Data API, esquema, permisos y contenido público verificados en integración y producción | `neon.ts`, `src/lib/neon.ts`, `db/` | Storage/Function | ciclo de archivos superado |
| Modo propietario | E2E real superado en rama aislada; falta cuenta productiva | `OwnerMode.tsx`, `components/editor/`, repositorio | Auth productiva + owner | repetir login, CRUD, restore y logout en Pages |
| Storage | broker y UI completos; sin bucket desplegado | `functions/`, `BlockEditor.tsx`, `scripts/storage/` | Storage/Function real | upload, registro, render, export/import y delete verificados |
| Deploy | workflow conectado a Neon producción; `main` aún sirve la web anterior | `.github/workflows/` | promoción de rama | rama promovida y URL pública nueva verificada |
| Contenido | portfolio público coherente en fixtures | `fixtures/demo-content.json` | revisión final del propietario | textos/periodos/assets aprobados y sembrados en Neon |

## Pendiente

| Descripción | Archivos relacionados | Dependencia | Completado cuando |
| --- | --- | --- | --- |
| Desplegar Storage y Function en la rama aislada | `neon.ts`, `functions/` | autorizar Neon CLI/Console en esta sesión | bucket y endpoint activos |
| Verificar ciclo de imágenes | function, editor, scripts storage | bucket/function | presign, PUT, registro, lectura, export/import y borrado pasan |
| Generar/revisar tipos oficiales de DB | `src/types/database.ts` | Data API real | tipos generados y diff revisado |
| Crear y allowlistar propietario real | `docs/authentication.md`, `scripts/db/create-owner.mjs` | cuenta elegida por el propietario | login/CRUD/logout productivo pasan sin credenciales compartidas |
| Configurar GitHub Secrets de provisión | workflows, `.env.example` | `NEON_API_KEY` y `DATABASE_URL` en entornos seguros | Actions puede provisionar sin valores locales |
| Clon limpio total con servicios | `scripts/verify-portability.mjs`, `docs/recovery.md` | rama Neon aislada | los 10 pasos documentados pasan desde cero |
| Publicar y etiquetar release | `main`, GitHub Pages | verificaciones anteriores | nueva web visible, workflow manual probado y tag `portfolio-v*` |

## Bloqueado externamente

| Bloqueo | Impacto | Desbloqueo |
| --- | --- | --- |
| La Neon CLI local todavía no está autorizada | no se pueden desplegar Storage/Functions declarados por `neon.ts` | completar una vez el acceso OAuth en Neon Console |

Producción contiene únicamente el esquema versionado y los fixtures públicos; las cuentas y escrituras editoriales temporales siguen confinadas a `codex-integration`. El proyecto existente “C2 Practice Log” no se tocó.

## Opcional

- dominio personalizado;
- OAuth Google/GitHub;
- analytics respetuosa con privacidad;
- previews por PR con ramas Neon TTL;
- CSP/reporting y rate limiting avanzado.

## Deuda técnica

- `@neondatabase/neon-js`, Auth, Data API, Storage y Functions están en beta;
- `src/types/database.ts` es un contrato manual hasta conectarlo a una API real;
- falta reconciliación automática de objetos huérfanos;
- no hay política automática de retención de `entry_versions`;

## No romper

- GitHub Pages no puede recibir secretos;
- autenticado no equivale a owner;
- RLS debe seguir habilitada en todas las tablas expuestas;
- `app_private` nunca se expone al Data API;
- las URLs de subida caducan y solo el broker conoce credenciales S3;
- migraciones aplicadas son inmutables;
- `backup/static-terminal-2025` conserva la vuelta atrás;
- Notion permanece solo lectura y fuera del runtime/repositorio.
