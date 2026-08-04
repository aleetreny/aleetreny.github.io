# Editor de contenido

## Alcance implementado

El modo propietario está en `/?owner=1`. Recupera una sesión existente o muestra login; después exige que `public.is_owner()` confirme la allowlist antes de leer borradores o escribir.

El estudio editorial incluye:

- inventario de entradas y creación de nuevas entradas;
- título, slug, resumen, tipo, estado y metadatos de presentación;
- bloques `text`, `heading`, `list`, `metric`, `quote` e `image`;
- anchura y alineación por bloque;
- reordenación por puntero, teclado y botones subir/bajar;
- subida de imágenes con alt text mediante el storage broker;
- guardado explícito, mensajes de error/éxito, borrado lógico y papelera recuperable;
- carga y restauración de versiones anteriores.

## Contrato de bloques

Cada bloque conserva UUID, tipo, posición, `props` y `layout`. La posición se normaliza antes de persistir. El renderer público ofrece un fallback de texto para tipos desconocidos y nunca interpreta HTML arbitrario.

## Guardado transaccional

`public.save_content_entry` realiza en una sola transacción:

1. comprobación de propietario;
2. validación de versión esperada;
3. snapshot de la versión que se abandona;
4. alta o actualización de la entrada;
5. desactivación temporal de bloques para permitir swaps sin violar el índice único;
6. upsert y reordenación de bloques;
7. borrado lógico de bloques retirados;
8. incremento de versión y devolución del documento canónico.

El cliente valida el documento con Zod y traduce un conflicto `40001` a una instrucción de recarga. No existe autosave: publicar sigue siendo una elección explícita mediante el campo de estado.

## Imágenes

El bloque pide una URL firmada a `POST /uploads/presign` con el JWT efímero de Neon Auth, ejecuta el `PUT` directo y registra metadata mediante `public.register_uploaded_asset`. Esta función vuelve a comprobar propietario, prefijo, bucket, MIME y tamaño; el navegador nunca recibe credenciales del bucket.

## Historial

Antes de cada actualización, restauración o borrado lógico se guarda un snapshot inmutable en `entry_versions`. Restaurar una versión o recuperar desde la papelera conserva primero una instantánea completa y genera una versión nueva; nunca reescribe el historial.

## Pruebas pendientes con infraestructura

- sesión real y refresh de JWT;
- RLS con visitante, usuario autenticado no propietario y propietario;
- conflicto simultáneo entre dos pestañas;
- reorder persistido después de recarga;
- subida fallida, reintento y reconciliación de objeto huérfano;
- restauración de versión, borrado lógico y recuperación desde papelera reales.
