# Estado del proyecto

Actualizado: 2026-08-04. Rama: `codex/portable-architecture`.

## Terminado y verificado

- tablero de corcho público a pantalla completa con pan ilimitado, zoom, soporte táctil/teclado y controles visibles;
- stickers de proyectos, trayectoria, formación, perfil y contacto con resumen y ampliación sobre un segundo tablero de corcho;
- metadatos Open Graph/Twitter y tarjeta social propia;
- modo propietario con recuperación de sesión, inventario, alta, edición, publicación, archivo, borrado lógico y papelera restaurable;
- alta de cuenta desde la propia ruta propietaria sin conceder permisos automáticamente ni compartir contraseñas;
- editor de bloques `text`, `heading`, `list`, `metric`, `quote` e `image`;
- drag and drop con puntero/teclado y alternativa explícita subir/bajar;
- subida de imágenes mediante URL firmada y registro seguro de metadata;
- guardado transaccional, bloqueo optimista, snapshots e historial restaurable;
- esquema SQL, índices, JSONB, estados, permisos, RLS y cuatro migraciones reproducibles;
- Auth/Data API/Storage/Function declarados en `neon.ts`;
- scripts de migración, seed, propietario, verificación, backup/import DB y storage;
- CI, GitHub Pages, provisión Neon manual, Dependabot, ADRs y guías de recuperación;
- backup remoto `backup/static-terminal-2025` de la web anterior;
- validación local actual: repo scan, lint, tipos, 14 tests y build con los endpoints públicos productivos;
- validación anterior desde clon temporal limpio: instalación frozen, repo scan, lint, tipos, 10 tests y build;
- revisión visual local desktop/móvil a 390 px sin overflow; pan, zoom, apertura y cierre verificados en navegador;
- proyecto Neon definitivo `divine-queen-66854519` creado en `aws-us-east-2` y rama aislada `codex-integration` (`br-tiny-art-ayb43loi`) conectada;
- Auth y Data API provisionadas en la rama aislada; migraciones 0001–0004 y fixtures públicos se probaron allí antes de modificar producción;
- matriz real de permisos verificada: lectura anónima, rechazo de escritura para no-owner, CRUD/versiones/conflicto/borrado/papelera/restore para owner;
- inicio de sesión del editor probado desde cero; la carga inicial de la papelera ya espera a la propagación efectiva del token;
- Auth, Data API, migraciones 0001–0004 y diez fixtures públicos desplegados también en producción;
- producción verificada con cinco tablas bajo RLS, siete índices esperados y lectura anónima limitada a 10 entradas/8 bloques;
- `https://aleetreny.github.io` añadido y validado como origen de confianza de Auth productiva;
- workflow Pages conectado a los endpoints públicos productivos, con override por Variables y fallback local de fixtures;
- verificación final de portabilidad superada desde un clon limpio del commit estable: instalación frozen, scan, lint, tipos, 11 tests y build;
- E2E editorial productivo superado con una cuenta temporal allowlisted: login, alta, bloques, reordenación, versiones, borrado, papelera, restauración y logout; la cuenta y datos de prueba se eliminaron;
- auditoría pública online superada sobre un artefacto compilado: seis stickers, cinco paneles, enlaces, zoom, centrado, teclado, Escape y retorno de foco;
- confirmaciones destructivas propias, accesibles y con estética de papel sustituyen los diálogos nativos del navegador;
- broker de Storage endurecido para firmar el tamaño esperado y no filtrar errores internos;
- Neon CLI autorizada mediante OAuth sin copiar tokens al repositorio ni al chat;
- buckets públicos `portfolio-assets` y Functions `storage` desplegados en integración y producción;
- ciclo real de Storage superado en ambas ramas: signup sintético, allowlist temporal, presign, PUT, lectura pública, registro por Data API, export, delete, import, delete y limpieza;
- producción e integración quedaron limpias tras las pruebas: 10 entradas, 8 bloques, 0 assets y 0 cuentas temporales;
- contrato TypeScript de cinco tablas y seis RPC cotejado contra `information_schema` de producción;
- GitHub Pages configurado manualmente para usar GitHub Actions como única fuente de publicación;
- auditoría final sobre el despliegue compilado: assets 200, cinco secciones, presentación, zoom, centrado, teclado, Escape, foco, contactos, signup, error de login, sesión, inventario, estados vacíos y editor;
- flujo editorial online final: seis tipos de bloque, reordenación por botones/teclado, borrado de bloque, preview de imagen, guardado, publicación visible sin redeploy, historial, restauración de versión, archivado, papelera, recuperación y logout;
- la auditoría detectó y corrigió el scroll retenido tras autenticar y la incompatibilidad entre el timestamp `+00:00` de Postgres y el validador del cliente;
- comprobación visual sin overlay, alertas inesperadas ni imágenes rotas; la cuenta, entrada, bloques y versiones sintéticos se eliminaron y producción volvió a 10 entradas, 8 bloques, 0 assets y 0 cuentas.

## Parcialmente implementado

| Elemento | Estado | Archivos | Dependencia | Criterio de finalización |
| --- | --- | --- | --- | --- |
| Modo propietario | E2E real superado en integración y producción con usuarios temporales; falta el propietario definitivo | `OwnerMode.tsx`, `components/editor/`, repositorio | signup del propietario + allowlist | el propietario real entra y completa una escritura controlada en Pages |
| Contenido | portfolio público coherente en fixtures | `fixtures/demo-content.json` | revisión final del propietario | textos/periodos/assets aprobados y sembrados en Neon |

## Pendiente

| Descripción | Archivos relacionados | Dependencia | Completado cuando |
| --- | --- | --- | --- |
| Crear y allowlistar propietario real | `OwnerMode.tsx`, `docs/authentication.md`, `scripts/db/create-owner.mjs` | el propietario crea la cuenta en `?owner=1` y facilita solo el UUID | login/CRUD/logout productivo pasan sin credenciales compartidas |
| Configurar GitHub Secrets de provisión | workflows, `.env.example` | `NEON_API_KEY` y `DATABASE_URL` en entornos seguros | Actions puede provisionar sin valores locales |
| Etiquetar release | `main`, GitHub Pages | propietaria definitiva y comprobación final | tag `portfolio-v*` apunta al commit estable documentado |

## Bloqueado externamente

No hay bloqueos técnicos. La única acción personal pendiente es que la propietaria cree su cuenta definitiva en `?owner=1` con una contraseña que Codex no vea y comparta únicamente el UUID para la allowlist.

Producción contiene el esquema versionado y los fixtures públicos. Las cuentas, entradas y versiones temporales usadas en el E2E productivo se eliminaron al terminar. El proyecto existente “C2 Practice Log” no se tocó.

## Opcional

- dominio personalizado;
- OAuth Google/GitHub;
- analytics respetuosa con privacidad;
- previews por PR con ramas Neon TTL;
- CSP/reporting y rate limiting avanzado.

## Deuda técnica

- `@neondatabase/neon-js`, Auth, Data API, Storage y Functions están en beta;
- `src/types/database.ts` se mantiene manual porque la Neon CLI actual no genera tipos de Data API; está cotejado contra producción y debe revisarse tras cada migración;
- falta reconciliación automática de objetos huérfanos;
- no hay política automática de retención de `entry_versions`;
- el plan Neon actual admite cero ramas protegidas; producción usa `NEON_PROTECT_DEFAULT_BRANCH=false` y la promoción queda compensada por aprobación obligatoria en el environment `production` hasta ampliar el plan;

## No romper

- GitHub Pages no puede recibir secretos;
- autenticado no equivale a owner;
- RLS debe seguir habilitada en todas las tablas expuestas;
- `app_private` nunca se expone al Data API;
- las URLs de subida caducan y solo el broker conoce credenciales S3;
- migraciones aplicadas son inmutables;
- `backup/static-terminal-2025` conserva la vuelta atrás;
- Notion permanece solo lectura y fuera del runtime/repositorio.
