# ADR 0008: GitHub Pages como frontera estática

- Estado: aceptada
- Fecha: 2026-08-04

## Contexto

El dominio/repo de User Pages debe ser fuente de despliegue y el ordenador local es temporal.

## Opciones consideradas

- deploy manual de archivos;
- Vercel/Netlify como hosting principal;
- Pages desde rama `gh-pages`;
- Pages con artefacto de GitHub Actions.

## Decisión y razones

Actions construye y publica `dist` en Pages al hacer push a `main`, con ejecución manual disponible. No se versiona build.

## Consecuencias

Nada server-side puede vivir en el mismo origen; Auth/API/Storage son externos. Variables Vite son públicas. Se evitan rutas SPA profundas usando query de owner.

## Cómo cambiar

Otro hosting puede consumir la misma build. Si se adopta SSR, crear backend/hosting separado, conservar Pages como fallback o documentar retirada y DNS.
