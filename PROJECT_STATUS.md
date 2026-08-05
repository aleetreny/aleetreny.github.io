# Estado del proyecto

Actualizado: 2026-08-05. Rama local: `codex/portable-architecture`.

## Terminado y verificado

- archivo público sobre corcho a pantalla completa con pan, zoom, pellizco, teclado, controles visibles, índice de diez archivos y centrado por sección;
- dirección visual adulta documentada: corcho ahumado, dossiers rectos, sombras duras, tipografía editorial, coordenadas y amarillo señal;
- 24 entradas públicas verificables agrupadas en investigación, IA, inteligencia cívica, productos, experimentos, carrera, educación, comunidad y perfil;
- dossiers expandidos con organización, periodo, señal, bloques, temas y enlaces públicos a proyecto/código;
- modo propietario con la misma identidad visual, recuperación de sesión, inventario, alta, edición, estados, papelera e historial;
- editor de metadatos de archivo: sección, señal, organización, periodo, temas, URL pública y repositorio;
- bloques `text`, `heading`, `list`, `metric`, `quote` e `image`, drag and drop accesible y botones alternativos;
- guardado transaccional, bloqueo optimista, snapshots, restauración y borrado lógico;
- Neon Auth, Data API, Postgres, RLS, Object Storage y Function desplegados en `production` y `codex-integration`;
- cuenta propietaria real creada y habilitada en `app_private.owner_accounts` sin compartir contraseña;
- catálogo sincronizado en ambas ramas Neon: 24 entradas, 9 valores de sección y 16 bloques activos;
- GitHub Environments `development` y `production` con `DATABASE_URL`, `NEON_API_KEY` y cuatro Variables públicas;
- workflow de provisión corregido para ejecutar el CLI local con `pnpm exec neon`;
- planes de Neon exitosos en GitHub Actions: development `#2` (`31030803954`) y production `#3` (`31031757861`);
- GitHub Pages configurado con GitHub Actions y rollback conservado en `backup/static-terminal-2025`;
- comprobación local del rediseño: scan de repositorio, lint, tipos, 14 tests y build;
- inspección visual local del tablero, dossier expandido y superficie administrativa;
- documentación de arquitectura, datos, autenticación, editor, storage, despliegue, seguridad, recuperación, handoff y ADRs.

## Parcialmente implementado

| Elemento | Estado | Archivos | Dependencia | Criterio de finalización |
| --- | --- | --- | --- | --- |
| Rediseño público/editor | implementado y revisado localmente | `CorkboardPortfolio.tsx`, `EntryEditor.tsx`, `global.css`, fixtures | despliegue de `main` | auditoría completa del artefacto online en escritorio/móvil |
| Contenido público | 24 entradas sembradas en Neon | `fixtures/demo-content.json`, `scripts/db/seed.mjs` | revisión subjetiva posterior del propietario | textos y enlaces aprobados o ajustados desde el editor |

## Pendiente

| Descripción | Archivos relacionados | Dependencia | Completado cuando |
| --- | --- | --- | --- |
| Publicar el rediseño | frontend, fixtures, docs | commits remotos + Actions | Pages sirve los nuevos bundles y CI/deploy pasan |
| Auditoría online final | web pública y `?owner=1` | despliegue actualizado | se prueban todas las secciones, controles, enlaces y pantallas sin hallazgos abiertos |
| Portabilidad final | repositorio completo | commit estable | `pnpm portability:verify` pasa desde clon limpio y `git status` queda limpio |
| Etiqueta estable | `main` | auditoría y portabilidad | tag `portfolio-v0.2.0` apunta al commit estable publicado |

## Bloqueado

No hay bloqueos externos ni técnicos activos.

## Opcional

- dominio personalizado;
- OAuth Google/GitHub;
- analytics respetuosa con privacidad;
- previews por PR con ramas Neon TTL;
- CSP/reporting y rate limiting avanzado;
- reconciliación automática de objetos huérfanos.

## Deuda técnica

- `@neondatabase/neon-js`, Auth, Data API, Storage y Functions siguen en beta;
- `src/types/database.ts` es manual y debe cotejarse tras migraciones;
- no existe política automática de retención de `entry_versions`;
- el plan Neon no permite proteger la rama productiva y se compensa con environment limitado a `main` más `APPLY_PRODUCTION`;
- el plan GitHub del repositorio privado no ofrece revisores obligatorios de environment;
- el layout del tablero usa posiciones explícitas: una undécima sección requiere diseño y prueba responsive.

## No romper

- GitHub Pages no puede recibir secretos;
- autenticado no equivale a propietario;
- RLS permanece forzada en todas las tablas expuestas;
- `app_private` nunca se expone al Data API;
- las URLs de subida caducan y solo la Function conoce credenciales S3;
- migraciones aplicadas son inmutables;
- `backup/static-terminal-2025` conserva la vuelta atrás;
- Notion permanece solo lectura y fuera del runtime/repositorio;
- los repositorios privados no se describen en el portfolio público.
