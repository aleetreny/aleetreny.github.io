# ADR 0002: Neon como backend de datos

- Estado: aceptada
- Fecha: 2026-08-04

## Contexto

Se necesita Postgres reproducible, ramas aisladas, Auth/Data API y migraciones versionadas sin servidor propio en Pages.

## Opciones consideradas

- Supabase completo;
- Postgres gestionado + API propia;
- contenido solo en Git;
- Neon Postgres + Data API.

## Decisión y razones

Usar Neon: requisito del proyecto, Postgres estándar, branching copy-on-write, Auth y Data API integrables desde SPA.

## Consecuencias

Data API/Auth están en beta; RLS/GRANT son críticos. Los datos reales no quedan en Git, solo schema/scripts/fixtures.

## Cómo cambiar

Postgres y SQL son portables. Sustituir cliente Data API por una API propia y migrar identidad/claims conservando RLS equivalente.
