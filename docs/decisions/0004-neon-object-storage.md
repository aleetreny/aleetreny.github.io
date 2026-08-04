# ADR 0004: Neon Object Storage y broker

- Estado: aceptada con riesgo beta
- Fecha: 2026-08-04

## Contexto

GitHub Pages no puede firmar subidas ni guardar credenciales. Los assets deben ser públicos y recuperables.

## Opciones consideradas

- Cloudflare R2 + Worker;
- Cloudinary;
- assets siempre en Git;
- Neon Object Storage + Neon Function.

## Decisión y razones

Usar Storage/Function de Neon: backend declarativo único, ramas coherentes con DB y S3 estándar. El broker valida JWT/owner y firma PUT.

## Consecuencias

Beta y `aws-us-east-2`; lectura pública por URL; operaciones/backup usan credenciales server-side. Se necesita reconciliar objetos huérfanos.

## Cómo cambiar

Conservar tabla `assets` y contrato del broker. Implementar endpoints equivalentes sobre R2/S3, copiar objetos, actualizar provider/URLs y abrir ADR de migración.
