# Estado del proyecto

Actualizado: 2026-08-04. Rama: `codex/portable-architecture`.

## Terminado en código

- scaffold Vite/React/TypeScript con lockfile reproducible;
- portfolio público responsive con fixtures validados;
- configuración pública/privada documentada en `.env.example`;
- cliente Neon con modo remoto opt-in;
- login de propietario, comprobación de allowlist e inventario de entradas;
- `neon.ts` para Auth, Data API, Storage y Function;
- esquema SQL, índices, JSONB, estados, versiones, soft delete, grants y RLS;
- migración, seed, owner, verificación, export/import DB;
- export/import de objetos S3-compatible;
- storage broker con JWT/JWKS, CORS exacto, límites y URLs firmadas;
- CI, Pages, provisión Neon manual, Dependabot;
- documentación, ADRs, recuperación y snapshot de la web anterior.
- clon limpio del código verificado con instalación frozen, 7 tests y build.

“Terminado en código” no significa verificado contra servicios reales.

## Parcialmente implementado

| Elemento | Estado | Archivos | Dependencia | Criterio de finalización |
| --- | --- | --- | --- | --- |
| Integración Neon | SDK/esquema listos; sin proyecto real | `neon.ts`, `src/lib/neon.ts`, `db/` | proyecto/branch y variables | deploy + migrate + tres pruebas de rol |
| Modo propietario | login e inventario; no edita | `OwnerMode.tsx`, `content-repository.ts` | Neon Auth real | sesión, refresh, CRUD seguro y logout E2E |
| Storage | broker/scripts listos; UI ausente | `functions/`, `scripts/storage/` | Storage/Function real | upload, registro asset, render y delete E2E |
| Versiones | tabla presente; snapshots no automáticos | migración, `content-editor.md` | editor/operación transaccional | guardar/restaurar/conflicto probado |
| Deploy | workflows listos; Pages no configurado | `.github/workflows/` | Settings/Variables/Secrets | URL pública verificada y rerun manual |

## Pendiente

| Descripción | Archivos relacionados | Dependencia | Completado cuando |
| --- | --- | --- | --- |
| Editor visual de entradas/bloques | `src/components/`, `docs/content-editor.md` | integración Neon | CRUD, validación, errores y reload conservan estado |
| Drag and drop accesible | futuro módulo editor, ADR 0006 | editor | puntero/teclado/botones persisten orden |
| UI de imágenes | `functions/storage.ts`, futura UI | broker desplegado | presign/PUT/asset/alt/delete verificados |
| Snapshots y optimistic locking | `entry_versions`, repositorio | operación DB/RPC | conflicto no sobrescribe y restore funciona |
| Tipos de DB generados | `src/types/database.ts` | Data API real | generación oficial y diff revisado en CI |
| Tests integración/E2E | `src/**/*.test.ts`, futuros e2e | branch Neon aislada | matriz anon/no-owner/owner en CI seguro |
| Contenido definitivo | fixtures/DB | revisión propietaria | contenido aprobado, assets/licencias completos |
| Clon limpio total con servicios | `scripts/verify-portability.mjs`, `docs/recovery.md` | Neon aislado | prueba local ya pasa; faltan migración/Auth/Storage/deploy reales |
| Release estable | Git tag/Pages | todo lo anterior crítico | tag `portfolio-v*`, Pages y rollback probados |

## Bloqueado externamente

| Bloqueo | Impacto | Desbloqueo |
| --- | --- | --- |
| No hay credenciales/ID de proyecto Neon en esta sesión | no se puede desplegar ni probar RLS/storage real | conectar Neon y elegir branch/región |
| Pages/Secrets/Variables aún no configurados | no hay deploy nuevo verificable | configurar Settings/Environments en GitHub |

## Opcional

- dominio personalizado;
- OAuth Google/GitHub;
- analytics respetuosa con privacidad;
- previews por PR con ramas Neon TTL;
- CSP/reporting y rate limiting avanzado;
- migración de Storage si sale de beta o cambia región.

## Deuda técnica

- `@neondatabase/neon-js` está fijado en beta y requiere revisión al actualizar;
- `src/types/database.ts` es un contrato manual mínimo;
- el broker devuelve mensajes de error demasiado descriptivos para producción; endurecer tras observabilidad;
- falta reconciliación de objetos huérfanos;
- no hay automatización de retención de `entry_versions`.

## No romper

- GitHub Pages no puede recibir secretos;
- autenticado no equivale a owner;
- RLS debe seguir habilitada en todas las tablas expuestas;
- `app_private` nunca se expone al Data API;
- migraciones aplicadas son inmutables;
- `backup/static-terminal-2025` conserva la vuelta atrás;
- Notion permanece solo lectura y fuera del runtime/repositorio.
