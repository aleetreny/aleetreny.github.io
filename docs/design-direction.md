# Dirección visual: archivo de investigación

## Objetivo

Conservar la idea memorable del tablero de corcho sin parecer una colección infantil de post-its. La identidad se plantea como un archivo vivo de investigación: dossiers, fichas técnicas, coordenadas, sellos, marcas de registro y materiales de estudio. El contraste entre negro, hueso, óxido y amarillo señal sustituye los pasteles; las aristas, recortes y sombras duras sustituyen las cápsulas y esquinas suaves.

La interfaz pública y `?owner=1` son dos estados del mismo lugar. El público explora el archivo; la persona propietaria trabaja dentro del estudio editorial.

## Mejoras propuestas e implementadas

1. **Jerarquía más adulta.** Tipografía condensada de alto contraste, serif para lectura y monoespaciada para datos de archivo.
2. **Menos redondeo.** Paneles rectos, esquinas recortadas, bordes visibles y sombras desplazadas.
3. **Una paleta propia.** Corcho ahumado, tinta, papel hueso, óxido y amarillo señal; no se usan tarjetas pastel.
4. **Un tablero con sistema.** Rejilla, ejes, coordenadas, registros y un índice fijo convierten el lienzo infinito en un espacio navegable.
5. **Composición asimétrica.** Diez archivos distribuidos en tres bandas, con rotaciones mínimas y densidad controlada.
6. **Más profundidad profesional.** El contenido pasa de cinco categorías genéricas a investigación, IA, inteligencia cívica, productos, experimentos, carrera, educación, comunidad, perfil y contacto.
7. **Pruebas, no eslóganes.** Cada ficha puede mostrar una señal breve, periodo, organización, tecnologías y enlaces directos al proyecto o al código.
8. **Expansión coherente.** Los modales son subtableros de archivo con cabecera registral, dossiers numerados y los mismos materiales.
9. **Administrador integrado.** Login, inventario, formularios, bloques, versiones y confirmaciones comparten textura, tipografía, paleta y geometría con el portfolio.
10. **Movimiento funcional.** Pan, zoom, pellizco, teclado, enfoque de sección desde el índice y retorno de foco; la animación no es decorativa.
11. **Accesibilidad visible.** Foco amarillo de alto contraste, diálogo con trampa de foco, Escape, alternativas a drag and drop y reducción de movimiento.
12. **Dependencias mínimas.** La textura y los recortes se generan con CSS; no dependen de una imagen local ni de fuentes remotas para funcionar.

## Contenido y privacidad

El catálogo se derivó del LinkedIn público y de repositorios públicos del perfil `aleetreny`. Los repositorios privados no se describen ni enlazan. No se copió contenido privado de Notion. Toda afirmación pública debe mantener una fuente pública verificable o ser revisada explícitamente por el propietario.

## Reglas para ampliar el sistema

- una nueva sección necesita una ficha de índice, una posición de tablero y un valor estable de `metadata.section`;
- una entrada destacada debe ofrecer contexto o evidencia, no solo una lista de tecnologías;
- no introducir sombras difusas, gradientes brillantes, grandes radios ni cápsulas salvo que una función lo justifique;
- el editor debe recibir cualquier nuevo metadato que el frontend haga visible;
- comprobar siempre el lienzo general, el dossier expandido y `?owner=1` en escritorio y móvil.
