# ADR 0001: Vite, React y TypeScript

- Estado: aceptada
- Fecha: 2026-08-04

## Contexto

GitHub Pages exige salida estática. El portfolio necesita UI interactiva y un futuro editor, pero no SSR obligatorio.

## Opciones consideradas

- HTML/JS sin framework: mínimo, pero editor y estado escalarían mal.
- Next.js: ecosistema amplio, pero Pages obliga export estático y muchas capacidades server quedan inutilizadas.
- Astro: gran contenido estático, más complejidad al convertir casi todo el editor en islas.
- Vite + React + TypeScript.

## Decisión y razones

Usar Vite/React/TypeScript: build estática directa, tipado compartido, testing simple y compatibilidad natural con SDK browser de Neon.

## Consecuencias

No hay SSR ni rutas API. SEO depende de HTML base/metadatos y contenido renderizado cliente; el backend debe vivir fuera de Pages.

## Cómo cambiar

Mantener `types`, fixtures y repositorio de contenido desacoplados; migrar render a Astro/otro generador conservando contratos y Data API.
