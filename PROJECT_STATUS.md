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
- validación desde clon temporal limpio: instalación frozen, repo scan, lint, tipos, 10 tests y build;
- revisión visual local desktop/móvil a 390 px sin overflow; pan, zoom, apertura y cierre verificados en navegador.

“Terminado en código” no significa verificado contra servicios reales.

## Parcialmente implementado

| Elemento | Estado | Archivos | Dependencia | Criterio de finalización |
| --- | --- | --- | --- | --- |
| Integración Neon | contrato completo; sin proyecto definitivo | `neon.ts`, `src/lib/neon.ts`, `db/` | proyecto `aws-us-east-2` | deploy + migrate + pruebas de rol |
| Modo propietario | flujo completo compilado; sin E2E real | `OwnerMode.tsx`, `components/editor/`, repositorio | Neon Auth + owner | login, CRUD, conflicto, restore y logout E2E |
| Storage | broker y UI completos; sin bucket desplegado | `functions/`, `BlockEditor.tsx`, `scripts/storage/` | Storage/Function real | upload, registro, render, export/import y delete verificados |
| Deploy | workflows listos; `main` aún sirve la web anterior | `.github/workflows/` | endpoints/variables de Neon | rama promovida y URL pública nueva verificada |
| Contenido | portfolio público coherente en fixtures | `fixtures/demo-content.json` | revisión final del propietario | textos/periodos/assets aprobados y sembrados en Neon |

## Pendiente

| Descripción | Archivos relacionados | Dependencia | Completado cuando |
| --- | --- | --- | --- |
| Crear proyecto Neon en Ohio (`aws-us-east-2`) | `neon.ts`, `docs/handoff.md` | acción en Neon Console | project ID disponible y región confirmada |
| Provisionar rama aislada | `neon.ts`, `db/migrations/` | proyecto correcto | Auth, Data API, Storage y Function activos |
| Ejecutar pruebas de integración | `scripts/db/verify.mjs`, editor | rama Neon aislada | anon/no-owner/owner, conflicto y restore pasan |
| Verificar ciclo de imágenes | function, editor, scripts storage | bucket/function | presign, PUT, registro, lectura, export/import y borrado pasan |
| Generar/revisar tipos oficiales de DB | `src/types/database.ts` | Data API real | tipos generados y diff revisado |
| Configurar GitHub Variables/Secrets | workflows, `.env.example` | endpoints y project ID | Actions puede construir y provisionar sin valores locales |
| Clon limpio total con servicios | `scripts/verify-portability.mjs`, `docs/recovery.md` | rama Neon aislada | los 10 pasos documentados pasan desde cero |
| Publicar y etiquetar release | `main`, GitHub Pages | verificaciones anteriores | nueva web visible, workflow manual probado y tag `portfolio-v*` |

## Bloqueado externamente

| Bloqueo | Impacto | Desbloqueo |
| --- | --- | --- |
| El conector Neon crea proyectos en `us-west-2` y no expone selector de región | Storage/Functions no se pueden desplegar | crear `aleetreny-portfolio` manualmente en `aws-us-east-2` |
| Aún no existen endpoints del proyecto definitivo | no se pueden completar variables GitHub ni E2E | provisionar el proyecto correcto |

Se creó únicamente para comprobar la región un proyecto vacío en `us-west-2`; al resultar incompatible se eliminó de inmediato. El proyecto existente “C2 Practice Log” no se tocó.

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
