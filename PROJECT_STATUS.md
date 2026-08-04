# Estado del proyecto

Actualizado: 2026-08-04. Rama: `codex/portable-architecture`.

## Terminado en código

- tablero de corcho público a pantalla completa con pan ilimitado, zoom, soporte táctil/teclado y controles visibles;
- stickers de proyectos, trayectoria, formación, perfil y contacto con resumen y ampliación sobre un segundo tablero de corcho;
- metadatos Open Graph/Twitter y tarjeta social propia;
- modo propietario con recuperación de sesión, inventario, alta, edición, publicación, archivo, borrado lógico y papelera restaurable;
- alta de cuenta desde la propia ruta propietaria sin conceder permisos automáticamente ni compartir contraseñas;
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
- segunda verificación de portabilidad superada desde un clon limpio: instalación frozen, scan, lint, tipos, 11 tests y build;
- E2E editorial productivo superado con una cuenta temporal allowlisted: login, alta, bloques, reordenación, versiones, borrado, papelera, restauración y logout; la cuenta y datos de prueba se eliminaron;
- auditoría pública online superada sobre un artefacto compilado: seis stickers, cinco paneles, enlaces, zoom, centrado, teclado, Escape y retorno de foco;
- confirmaciones destructivas propias, accesibles y con estética de papel sustituyen los diálogos nativos del navegador;
- broker de Storage endurecido para firmar el tamaño esperado y no filtrar errores internos.

“Terminado en código” no significa verificado contra servicios reales.

## Parcialmente implementado

| Elemento | Estado | Archivos | Dependencia | Criterio de finalización |
| --- | --- | --- | --- | --- |
| Integración Neon | Auth, Data API, esquema, permisos y contenido público verificados en integración y producción | `neon.ts`, `src/lib/neon.ts`, `db/` | Storage/Function | ciclo de archivos superado |
| Modo propietario | E2E real superado en integración y producción con usuarios temporales; falta el propietario definitivo | `OwnerMode.tsx`, `components/editor/`, repositorio | signup del propietario + allowlist | el propietario real entra y completa una escritura controlada en Pages |
| Storage | broker y UI completos; sin bucket desplegado | `functions/`, `BlockEditor.tsx`, `scripts/storage/` | Storage/Function real | upload, registro, render, export/import y delete verificados |
| Deploy | `main` contiene la nueva web y Actions genera un artefacto correcto, pero Pages sigue además en modo legacy y termina sirviendo los fuentes sin compilar | `.github/workflows/`, Settings > Pages | sesión administrativa de GitHub | Source queda en GitHub Actions y una comprobación posterior nunca vuelve a servir `/src/main.tsx` |
| Contenido | portfolio público coherente en fixtures | `fixtures/demo-content.json` | revisión final del propietario | textos/periodos/assets aprobados y sembrados en Neon |

## Pendiente

| Descripción | Archivos relacionados | Dependencia | Completado cuando |
| --- | --- | --- | --- |
| Desplegar Storage y Function en la rama aislada | `neon.ts`, `functions/` | autorizar Neon CLI/Console en esta sesión | bucket y endpoint activos |
| Verificar ciclo de imágenes | function, editor, scripts storage | bucket/function | presign, PUT, registro, lectura, export/import y borrado pasan |
| Generar/revisar tipos oficiales de DB | `src/types/database.ts` | Data API real | tipos generados y diff revisado |
| Crear y allowlistar propietario real | `OwnerMode.tsx`, `docs/authentication.md`, `scripts/db/create-owner.mjs` | el propietario crea la cuenta en `?owner=1` y facilita solo el UUID | login/CRUD/logout productivo pasan sin credenciales compartidas |
| Configurar GitHub Secrets de provisión | workflows, `.env.example` | `NEON_API_KEY` y `DATABASE_URL` en entornos seguros | Actions puede provisionar sin valores locales |
| Clon limpio total con servicios | `scripts/verify-portability.mjs`, `docs/recovery.md` | rama Neon aislada | los 10 pasos documentados pasan desde cero |
| Fijar la fuente de Pages | Settings > Pages, `.github/workflows/deploy-pages.yml` | sesión GitHub administrativa | solo GitHub Actions despliega y la URL conserva el bundle compilado |
| Publicar y etiquetar release | `main`, GitHub Pages | verificaciones anteriores | nueva web estable, workflow manual probado y tag `portfolio-v*` |

## Bloqueado externamente

| Bloqueo | Impacto | Desbloqueo |
| --- | --- | --- |
| La Neon CLI local todavía no está autorizada | no se pueden desplegar Storage/Functions declarados por `neon.ts` | completar una vez el acceso OAuth en Neon Console |
| GitHub Pages conserva la fuente legacy `main`/root | el job legacy sobrescribe el artefacto de Actions y la URL pública puede quedar en blanco | iniciar sesión en GitHub y elegir Settings > Pages > Source: GitHub Actions |

Producción contiene el esquema versionado y los fixtures públicos. Las cuentas, entradas y versiones temporales usadas en el E2E productivo se eliminaron al terminar. El proyecto existente “C2 Practice Log” no se tocó.

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
