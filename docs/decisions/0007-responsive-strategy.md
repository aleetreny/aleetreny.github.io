# ADR 0007: Responsive mobile-first

- Estado: aceptada
- Fecha: 2026-08-04

## Contexto

Portfolio público y editor deben funcionar desde móvil hasta escritorio, con preferencias de accesibilidad.

## Opciones consideradas

- breakpoints desktop-first;
- framework utility CSS;
- CSS-in-JS;
- CSS nativo mobile-first con fluid type/grid y media/container queries cuando aporten valor.

## Decisión y razones

CSS nativo, tokens en `:root`, `clamp`, grid flexible, breakpoint mínimo y `prefers-reduced-motion`. Reduce dependencia y produce build portable.

## Consecuencias

Se requiere disciplina de componentes/clases y pruebas visuales. El editor podrá añadir container queries sin cambiar stack.

## Cómo cambiar

Introducir design system o utilities tras inventariar tokens; migrar progresivamente y verificar regresión visual.
