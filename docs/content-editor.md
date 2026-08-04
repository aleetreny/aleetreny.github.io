# Editor de contenido

## Alcance

El modo propietario está en `/?owner=1`. La fase actual implementa acceso, comprobación de allowlist e inventario de entradas; todavía no existe edición visual persistente. Esta separación evita confundir un scaffold con una herramienta terminada.

## Diseño previsto

- panel de entradas con filtros por estado/tipo;
- formulario de metadatos (título, slug, resumen, publicación);
- lienzo de bloques tipados;
- inspector de propiedades y layout;
- drag and drop accesible por puntero y teclado;
- subida de imágenes a través del storage broker;
- autosave explícito con estado visible;
- historial y restauración de versiones;
- preview responsive antes de publicar.

## Contrato de bloques

Cada bloque conserva identidad UUID, tipo, posición, `props`, `layout`, versión y borrado lógico. El renderer debe mantener un registry exhaustivo por `block_type`; un tipo desconocido debe mostrar fallback seguro, no ejecutar HTML arbitrario.

## Guardado transaccional

Una edición completa debe persistirse como operación atómica o RPC controlada:

1. validar Zod en cliente;
2. verificar versión esperada;
3. insertar snapshot de la versión anterior;
4. actualizar entrada;
5. upsert/reordenar bloques;
6. marcar bloques eliminados con `deleted_at`;
7. incrementar versión;
8. devolver snapshot canónico.

No se debe guardar HTML sin sanitizar en JSONB. Texto enriquecido requiere un formato estructurado y un renderer/sanitizador documentado.

## Drag and drop

La decisión es usar dnd-kit con sensores de teclado y puntero, overlay y estrategia sortable vertical. Aún no está instalado para evitar una dependencia muerta. El criterio de finalización exige reordenar, persistir, recargar y conservar orden; además debe existir alternativa por botones “subir/bajar”.

## Publicación

Publicar exige `published_at`, validación de bloques y alt text para imágenes informativas. La UI debe diferenciar guardar borrador de publicar; nunca publicar automáticamente por autosave.

## Tests requeridos

- validación de cada bloque;
- conflicto de versión;
- reorder con teclado/puntero y alternativa de botones;
- RLS con propietario/no propietario;
- carga fallida/reintento de imagen;
- preview móvil/tablet/desktop;
- restauración de versión.
