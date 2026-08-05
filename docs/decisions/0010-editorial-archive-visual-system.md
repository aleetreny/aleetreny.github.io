# ADR 0010: archivo editorial adulto y sistema visual compartido

- Estado: aceptado
- Fecha: 2026-08-05

## Contexto

El tablero de corcho era una metáfora adecuada, pero las notas pastel, el redondeo y la baja densidad transmitían una estética infantil y ocultaban la amplitud real del trabajo. Además, el modo propietario parecía una aplicación distinta.

## Opciones consideradas

1. Abandonar el corcho y usar un portfolio editorial convencional.
2. Mantener los post-its y limitar el cambio a colores y tipografía.
3. Reinterpretar el corcho como archivo de investigación y aplicar el mismo sistema al frontend y al editor.

## Decisión

Se adopta la tercera opción. El lienzo infinito se conserva, pero su vocabulario pasa a dossiers, fichas, cuadrícula, coordenadas, sellos y recortes. La paleta es corcho ahumado, negro, hueso, óxido y amarillo señal. Los radios grandes y sombras suaves dejan de ser recursos base. El editor usa los mismos tokens, materiales y jerarquías.

El contenido se organiza en nueve archivos temáticos más contacto. `metadata.section` mantiene la relación entre entrada y archivo sin crear una nueva tabla ni cerrar el modelo de contenido.

## Razones

- mantiene la interacción distintiva que ya funcionaba;
- expresa mejor investigación, método y amplitud profesional;
- hace navegable un catálogo mayor mediante índice fijo;
- evita una segunda identidad visual para administración;
- sigue siendo una SPA estática compatible con GitHub Pages;
- toda la textura se reproduce con CSS versionado.

## Consecuencias

- la composición usa posiciones explícitas y debe revisarse al añadir secciones;
- los títulos bilingües forman parte deliberada de la voz visual;
- el alto contraste requiere comprobar tamaños pequeños al alejar;
- una entrada sin `metadata.section` usa un fallback por tipo;
- el editor debe evolucionar junto con los metadatos públicos.

## Cómo cambiarlo

Crear un ADR que sustituya este documento, migrar o mapear `metadata.section`, actualizar `sectionBlueprints`, `docs/design-direction.md`, fixtures y tests. Si se abandona el lienzo, conservar pan/zoom solo cuando siga aportando y mantener rutas/URLs de contenido compatibles.
