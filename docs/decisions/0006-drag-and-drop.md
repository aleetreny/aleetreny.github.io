# ADR 0006: dnd-kit para drag and drop

- Estado: aceptada e implementada
- Fecha: 2026-08-04

## Contexto

El editor necesita reordenar bloques con ratón, táctil y teclado sin romper accesibilidad.

## Opciones consideradas

- HTML5 Drag and Drop nativo;
- react-beautiful-dnd/forks;
- dnd-kit;
- botones únicamente.

## Decisión y razones

Usar dnd-kit sortable con sensores de puntero/teclado, más botones subir/bajar. API componible y soporte de accesibilidad superior al DnD nativo.

## Consecuencias

Añade dependencia y lógica de estado optimista. El editor la carga de forma diferida únicamente en modo propietario, por lo que no penaliza el bundle inicial público.

## Cómo cambiar

La normalización del orden está aislada en `src/lib/editor.ts`; se puede sustituir la librería conservando esa función, los botones y los tests.
