# ADR 0005: Modelo flexible de bloques

- Estado: aceptada
- Fecha: 2026-08-04

## Contexto

Proyectos, experiencia y casos requieren composiciones distintas sin migrar columnas por cada variante.

## Opciones consideradas

- HTML completo por entrada;
- una tabla por tipo de contenido;
- documento JSONB único;
- entrada relacional + bloques ordenados con JSONB tipado.

## Decisión y razones

Separar `content_entries` y `content_blocks`; identidad/orden/estado relacionales, propiedades/layout extensibles en JSONB.

## Consecuencias

El frontend necesita registry/validación por tipo. JSONB no debe convertirse en almacén sin esquema; versiones capturan snapshots.

## Cómo cambiar

Añadir columnas para campos consultados frecuentemente o migrar tipos concretos con scripts que transformen `props`; mantener fallback de lectura durante transición.
