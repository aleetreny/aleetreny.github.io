# Estado del proyecto

Actualizado: 2026-08-08. Rama: `claude/design-handoff-board-tour-ak4tp2`.

## Recorrido guiado y fondo editable (2026-08)

- La pizarra deja de ser el viewport y pasa a ser un **objeto finito colgado de una pared**: `.desk__plate` con marco, cuatro tornillos, grano de yeso y viñeta. Con `theme.backdrop.plate = false` vuelve exactamente al tablero anterior (la textura llena el viewport), así que nada se pierde.
- **Recorrido guiado** en `src/components/DeskBoard.tsx` (fases `pre` → `tour` → `live`): la pizarra se estampa contra la pared y el visitante avanza parada a parada mientras cada pieza se clava encima. La lógica pura vive en `src/lib/tour.ts` (rutas, cámaras, revelados, curvas) y la barra en `src/components/desk/TourBar.tsx`.
- Todo es editable en caliente desde el panel *tour* (`src/components/desk/TourPanel.tsx`), guardado en `site_settings['board.tour']`: nueve formas de recorrido, tres maneras de avanzar (manual, automático con dwell, rueda), ocho movimientos de cámara con nueve curvas, nueve aterrizajes de pieza con orden y escalonado, cinco llegadas de la pizarra, y la barra completa con sus textos. El editor de paradas permite crear, renombrar, reordenar, borrar y componer pieza a pieza.
- El fondo se edita desde el panel *theme*: siete paredes (más una personalizada de dos colores), grano, viñeta, margen, marco, sombra, tornillos y el patrón de la pizarra (`plate`, `viewport` o ninguno) con su escala.
- Correcciones que el recorrido dejó a la vista: topes de filas por cajón con `+ N more` (`work` 4, `edu` 4, `lab` 6, `vol` 4, `hack` 4, `repos` 5, `travel` 8, `random` 5) y tres posiciones (`travel`, `contact`, `note-1`) que eliminaban la colisión de tarjetas.
- Accesibilidad: con `prefers-reduced-motion: reduce` no hay recorrido y el tablero aparece completo; la barra son botones reales navegables con Tab; `Escape` siempre sale; ninguna pieza depende del recorrido para ser accesible.
- **Requiere reseed**: `board.tour` es una clave nueva de `site_settings` y `theme` gana `backdrop`. Ejecutar `seed-content.yml` en development y después en production con `production_confirmation=APPLY_PRODUCTION`.

## Rediseño "working board" (2026-08)

- Se reemplazó la estética de archivo de corcho por el **working board** de la pizarra: `src/components/DeskBoard.tsx` + `src/components/desk/*` + `src/styles/global.css` (Bricolage Grotesque + IBM Plex Mono, acentos oklch óxido/ámbar/azul, cuatro texturas de fondo).
- Contenido real (los dossiers de trabajo, estudios, laboratorio, voluntariado, hackathones, código, viajes, obsesiones y contacto) versionado en `content/source/` y compilado a `fixtures/demo-content.json` + `fixtures/site-settings.json` con `pnpm content:build`.
- Edición total desde la web sin tocar código: texto en línea, posición (drag/tidy/scatter/reset), colores y tipografías (panel *theme*), fotos (Neon Object Storage) y alta/baja de dossiers. Persistencia en `content_entries`/`content_blocks` (RPC) y `site_settings` (tema y layout, ya con RLS de propietario existente).
- Nuevo workflow `seed-content.yml` para cargar el catálogo y los ajustes en Neon desde GitHub Actions.

Lo que sigue documenta la arquitectura reproducible, que se mantiene.

## Terminado y verificado

- archivo público sobre corcho a pantalla completa con pan, zoom, pellizco, teclado, controles visibles, índice de diez archivos y centrado por sección;
- dirección visual adulta documentada: corcho ahumado, dossiers rectos, sombras duras, tipografía editorial, coordenadas y amarillo señal;
- 24 entradas públicas verificables agrupadas en investigación, IA, inteligencia cívica, productos, experimentos, carrera, educación, comunidad y perfil;
- dossiers expandidos con organización, periodo, señal, bloques, temas y enlaces públicos a proyecto/código;
- modo propietario con la misma identidad visual, recuperación de sesión, inventario, alta, edición, estados, papelera e historial;
- editor de metadatos de archivo: sección, señal, organización, periodo, temas, URL pública y repositorio;
- bloques `text`, `heading`, `list`, `metric`, `quote` e `image`, drag and drop accesible y botones alternativos;
- guardado transaccional, bloqueo optimista, snapshots, restauración y borrado lógico;
- Neon Auth, Data API, Postgres, RLS, Object Storage y Function desplegados en `production` y `codex-integration`;
- cuenta propietaria real creada y habilitada en `app_private.owner_accounts` sin compartir contraseña;
- catálogo sincronizado en ambas ramas Neon: 24 entradas, 9 valores de sección y 16 bloques activos;
- GitHub Environments `development` y `production` con `DATABASE_URL`, `NEON_API_KEY` y cuatro Variables públicas;
- workflow de provisión corregido para ejecutar el CLI local con `pnpm exec neon`;
- planes de Neon exitosos en GitHub Actions: development `#2` (`31030803954`) y production `#3` (`31031757861`);
- GitHub Pages configurado con GitHub Actions y rollback conservado en `backup/static-terminal-2025`;
- rediseño publicado en `https://aleetreny.github.io/` y servido con el catálogo vivo de Neon;
- auditoría online de escritorio: diez fichas, diez dossiers, perfil, índice, zoom, teclado, Escape, retorno de foco, cierre por fondo, scroll interno y contacto;
- auditoría online móvil a `390 × 844`: composición, navegación inferior, dossier, scroll y contacto sin errores de consola o de página;
- 21 enlaces únicos inspeccionados; se corrigió la capitalización de `/Cabicity/` y todos los destinos HTTP públicos responden correctamente;
- modo propietario online verificado con usuario desechable: alta, allowlist, login, inventario, papelera vacía, creación, seis tipos de bloque, edición, orden, borrado de bloque, guardado y snapshot de versión; usuario y datos QA eliminados al terminar;
- la captura de gestos del lienzo ya no bloquea el cierre ni el scroll de los dossiers;
- comprobación local del rediseño: scan de repositorio, lint, tipos, 15 tests y build;
- `pnpm portability:verify` completado desde un clon limpio con 15 tests y build;
- documentación de arquitectura, datos, autenticación, editor, storage, despliegue, seguridad, recuperación, handoff y ADRs.

## Parcialmente implementado

| Elemento | Estado | Archivos | Dependencia | Criterio de finalización |
| --- | --- | --- | --- | --- |
| Contenido público | 24 entradas sembradas en Neon | `fixtures/demo-content.json`, `scripts/db/seed.mjs` | revisión subjetiva posterior del propietario | textos y enlaces aprobados o ajustados desde el editor |

## Pendiente

No quedan tareas obligatorias de implementación, despliegue, portabilidad o QA para esta fase. La aprobación subjetiva de textos se mantiene como revisión editorial, no como bloqueo técnico.

## Bloqueado

No hay bloqueos externos ni técnicos activos.

## Opcional

- dominio personalizado;
- OAuth Google/GitHub;
- analytics respetuosa con privacidad;
- previews por PR con ramas Neon TTL;
- CSP/reporting y rate limiting avanzado;
- reconciliación automática de objetos huérfanos.

## Deuda técnica

- `@neondatabase/neon-js`, Auth, Data API, Storage y Functions siguen en beta;
- `src/types/database.ts` es manual y debe cotejarse tras migraciones;
- no existe política automática de retención de `entry_versions`;
- el plan Neon no permite proteger la rama productiva y se compensa con environment limitado a `main` más `APPLY_PRODUCTION`;
- el plan GitHub del repositorio privado no ofrece revisores obligatorios de environment;
- el layout del tablero usa posiciones explícitas: una undécima sección requiere diseño y prueba responsive.

## No romper

- GitHub Pages no puede recibir secretos;
- autenticado no equivale a propietario;
- RLS permanece forzada en todas las tablas expuestas;
- `app_private` nunca se expone al Data API;
- las URLs de subida caducan y solo la Function conoce credenciales S3;
- migraciones aplicadas son inmutables;
- `backup/static-terminal-2025` conserva la vuelta atrás;
- Notion permanece solo lectura y fuera del runtime/repositorio;
- los repositorios privados no se describen en el portfolio público.
