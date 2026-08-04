# ADR 0009: tablero de corcho infinito

- Estado: aceptada e implementada
- Fecha: 2026-08-04

## Contexto

El portfolio no debe sentirse como una landing vertical convencional. La metáfora principal es un tablero personal donde cada área aparece como una nota física, se descubre explorando y se amplía sin abandonar el lenguaje de corcho/papel.

## Opciones consideradas

- landing vertical por secciones;
- grid de tarjetas con modales convencionales;
- canvas/WebGL;
- superficie DOM transformada con pan, zoom y notas posicionadas.

## Decisión

Usar una superficie DOM fija sobre un fondo de corcho repetible. El mundo de notas se mueve con `translate3d` y `scale`; puntero/touch controlan pan y pinch, la rueda y los botones controlan zoom, y el teclado ofrece flechas y `+/-`. Las notas resumen elementos principales y abren un diálogo que vuelve a usar corcho y fichas pegadas.

## Razones

- conserva texto semántico, enlaces, foco y lectura asistida;
- evita la pérdida de accesibilidad de un canvas dibujado;
- funciona en GitHub Pages sin runtime adicional;
- permite que el contenido siga viniendo del mismo modelo de entradas/bloques;
- el fondo repetible hace que el desplazamiento pueda continuar sin un borde visual.

## Consecuencias

- las posiciones iniciales son una decisión editorial y deben revisarse al añadir secciones;
- el contenido importante necesita un resumen corto para la nota y detalle para la ampliación;
- cada interacción debe probarse con mouse, touch, teclado y `prefers-reduced-motion`;
- el modo propietario permanece en una vista estructurada separada para no mezclar edición con navegación espacial.

## Cómo cambiar

Mantener `PortfolioEntry` y `ContentBlocks` independientes del lienzo. Una futura estrategia de layout puede sustituir posiciones/transformaciones sin migrar contenido ni backend.
