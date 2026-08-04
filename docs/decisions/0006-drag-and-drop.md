# ADR 0006: dnd-kit para drag and drop

- Estado: aceptada, implementación pendiente
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

Añade dependencia y lógica de estado optimista. No se instalará hasta construir el editor para evitar código muerto.

## Cómo cambiar

Encapsular reordenación como `moveBlock(entryId, from, to)` independiente de UI; sustituir librería conservando comandos y tests.
