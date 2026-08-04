# Alejandro Treny — portfolio reproducible

Portfolio personal presentado como un tablero de corcho digital: una superficie arrastrable y ampliable donde proyectos, experiencia, formación, perfil y contacto aparecen como notas pegadas que se pueden abrir. El repositorio es la fuente principal: una máquina nueva debe poder clonar, instalar, configurar servicios, migrar y desplegar sin recuperar archivos locales anteriores.

La web pública es una SPA estática con pan, zoom, controles de teclado/táctiles y secciones expandibles dentro de la misma estética de corcho. Con `VITE_ENABLE_REMOTE_DATA=false` usa fixtures públicos versionados; con Neon configurado lee únicamente contenido publicado. El modo propietario vive en `?owner=1`: autentica con Managed Better Auth y obtiene permisos editoriales solo si el UUID está en `app_private.owner_accounts`. Incluye CRUD de entradas, editor de bloques reordenable, subida de imágenes, bloqueo optimista e historial restaurable.

## Arquitectura resumida

- GitHub Pages sirve la build estática generada por Vite.
- React + TypeScript renderizan el portfolio y el modo propietario.
- Managed Better Auth emite la sesión/JWT.
- Neon Data API consulta Postgres y aplica `GRANT` + RLS.
- Neon Object Storage guarda imágenes en el bucket público de lectura `portfolio-assets`.
- Una Neon Function valida el JWT y la allowlist antes de firmar cada subida o borrado; las credenciales S3 nunca llegan al navegador.
- GitHub Actions ejecuta CI, despliega Pages y permite provisionar Neon manualmente.

El diagrama y los límites de confianza están en [docs/architecture.md](docs/architecture.md).

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | Vite 8, React 19, TypeScript 5.9, CSS mobile-first |
| Validación | Zod, ESLint, Vitest, TypeScript strict |
| Persistencia | Neon Postgres, SQL versionado en `db/migrations/` |
| API | Neon Data API con `@neondatabase/neon-js` |
| Autenticación | Neon Managed Better Auth + allowlist propia + RLS |
| Archivos | Neon Object Storage + AWS S3 SDK + función firmante Hono/Jose |
| Infraestructura | `neon.ts` + Neon CLI |
| Despliegue | GitHub Pages mediante GitHub Actions |
| Contexto temporal | Notion solo lectura; no es fuente de datos ni dependencia de runtime |

Auth, Data API, Functions y Object Storage están sujetos al estado/limitaciones vigentes de Neon. Functions y Storage requieren actualmente un proyecto `aws-us-east-2`; consulta [docs/storage.md](docs/storage.md) antes de crear el proyecto.

## Instalación desde cero

### Requisitos

- Git 2.40 o posterior.
- Node.js 24 LTS recomendado (mínimo soportado por el proyecto: 22).
- pnpm 11.9 (`corepack enable && corepack prepare pnpm@11.9.0 --activate`).
- Cuenta y acceso al repositorio privado `aleetreny/aleetreny.github.io`.
- Para modo remoto: acceso a Neon y permisos para crear proyecto/rama/servicios.

### Clonar e instalar

```bash
git clone git@github.com:aleetreny/aleetreny.github.io.git
cd aleetreny.github.io
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
```

El archivo `.env.local` nunca se versiona. Para arrancar sin servicios, conserva:

```dotenv
VITE_ENABLE_REMOTE_DATA=false
```

### Desarrollo, comprobaciones y build

```bash
pnpm dev
pnpm check
pnpm build
pnpm preview
```

`pnpm check` valida archivos de portabilidad y secretos evidentes, ejecuta lint, typecheck y tests. `pnpm portability:verify` repite instalación, pruebas y build desde un clon local limpio de la rama ya confirmada en Git.

## Configurar Neon

### Crear o enlazar el proyecto

1. Crea o selecciona un proyecto Neon en `aws-us-east-2` si se usarán Object Storage y Functions.
2. Instala/autentica el CLI: `pnpm exec neon auth`.
3. Enlaza sin versionar el contexto: `pnpm exec neon link --project-id <project-id>`.
4. Crea una rama aislada: `pnpm exec neon checkout development` (las ramas nuevas expiran en siete días por la política de `neon.ts`).
5. Revisa el plan: `pnpm neon:plan`.
6. Despliega Auth, Data API, bucket y función: `pnpm neon:deploy`.
7. Recupera variables locales: `pnpm exec neon env pull --file .env.local`.

`neon.ts` marca la rama principal como protegida. No uses `--allow-protected` fuera del flujo de producción consciente.

### Aplicar o restaurar el esquema

Con `DATABASE_URL` privada configurada:

```bash
pnpm db:migrate
pnpm db:verify
```

Alternativa con `psql` para una restauración completa:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

Las migraciones exigen que `neon deploy` haya creado los roles `anonymous`, `authenticated` y `auth.user_id()`.

### Crear el propietario

1. Configura dominios de confianza y verificación de correo en Neon Auth.
2. Crea la cuenta mediante el flujo de signup de la rama correspondiente.
3. Obtén el UUID del usuario de Auth.
4. Añádelo a la allowlist con una conexión administrativa:

```bash
pnpm db:owner -- --user-id <uuid-auth> --email <correo>
```

El correo es metadato privado y no debe añadirse al repositorio ni a GitHub Variables. Una cuenta autenticada que no esté en la allowlist conserva únicamente la lectura pública.

### Datos de demostración y permisos

```bash
pnpm db:seed
pnpm db:verify
```

Después de una migración, refresca la caché del esquema desde Neon Console > Data API o mediante la API de Neon. Verifica además:

- anónimo: solo entradas publicadas, bloques asociados, assets públicos y settings públicos;
- autenticado no propietario: la misma lectura, sin escritura;
- propietario allowlisted: CRUD editorial y acceso a versiones;
- esquema `app_private`: sin permisos para roles API.

Más detalles: [docs/authentication.md](docs/authentication.md) y [docs/data-model.md](docs/data-model.md).

## Almacenamiento de imágenes

El proveedor elegido es Neon Object Storage para mantener archivos y base de datos en la misma rama. `neon.ts` crea `portfolio-assets` con acceso `public_read`: las lecturas son públicas y las escrituras requieren credencial.

La subida prevista es:

1. el propietario obtiene un JWT de Neon Auth;
2. solicita `POST /uploads/presign` a la Neon Function;
3. la función valida EdDSA/JWKS, comprueba `app_private.owner_accounts`, tipo y tamaño;
4. devuelve una URL PUT de cinco minutos;
5. el navegador sube directamente al bucket y persiste metadatos en `assets` mediante Data API.

No coloques `AWS_ACCESS_KEY_ID` ni `AWS_SECRET_ACCESS_KEY` en variables `VITE_*`. Para recuperar archivos:

```bash
pnpm storage:export -- --output=backups/storage-safe-copy
pnpm storage:import -- --input=backups/storage-safe-copy
```

Los backups se crean con permisos locales restrictivos y están ignorados por Git; deben guardarse cifrados fuera de este ordenador. Consulta [docs/storage.md](docs/storage.md).

## Despliegue

### GitHub Pages

1. En Settings > Pages, selecciona **GitHub Actions** como fuente.
2. Configura las Actions Variables descritas abajo.
3. Un push a `main` ejecuta CI/build y `.github/workflows/deploy-pages.yml` publica `dist/`.
4. `workflow_dispatch` permite repetir el despliegue manualmente.

Variables de repositorio o del environment `github-pages` (públicas):

- `VITE_ENABLE_REMOTE_DATA`
- `VITE_NEON_AUTH_URL`
- `VITE_NEON_DATA_API_URL`
- `VITE_STORAGE_FUNCTION_URL`
- `VITE_STORAGE_PUBLIC_BASE_URL`

El dominio previsto es `https://aleetreny.github.io/`. No hay dominio personalizado configurado ni archivo `CNAME`. Si se añade, debe configurarse también en Settings > Pages, DNS, Auth trusted origins y `ALLOWED_ORIGINS`.

### Provisionar Neon desde GitHub

El workflow manual `.github/workflows/provision-neon.yml` admite `plan` y `apply`. Crea GitHub Environments `development` y `production` con:

- Secrets: `NEON_API_KEY`, `DATABASE_URL`.
- Variables: `NEON_PROJECT_ID`, `NEON_BRANCH`, `ALLOWED_ORIGINS`.

Usa primero `plan`. `apply` despliega `neon.ts`, migra y verifica. Protege el environment `production` con aprobación manual.

Si Pages falla, descarga los logs de Actions, vuelve a ejecutar `pnpm check && pnpm build` desde un clon limpio y relanza el workflow. La reversión completa a la web anterior está documentada en [docs/recovery.md](docs/recovery.md).

## Backup e importación

```bash
# Solo contenido público y metadatos; nunca exporta credenciales
pnpm db:export -- --output=backups/public.json
OWNER_AUTH_USER_ID=<uuid-destino> pnpm db:import -- --input=backups/public.json

# Bytes del bucket
pnpm storage:export -- --output=backups/storage
pnpm storage:import -- --input=backups/storage
```

Los exports de contenido privado no forman parte de estos scripts. No uses el repositorio como almacén de backups.

## Continuar el trabajo

- Estado por funcionalidad y criterio de finalización: [PROJECT_STATUS.md](PROJECT_STATUS.md).
- Handoff operativo para otra máquina: [docs/handoff.md](docs/handoff.md).
- Decisiones y alternativas: [docs/decisions/](docs/decisions/).
- Recuperación y rollback: [docs/recovery.md](docs/recovery.md).

La fase actual deja terminados el frontend público, el editor visual, la persistencia versionada, el broker de imágenes y la automatización. Falta crear/conectar el proyecto Neon definitivo en `aws-us-east-2`, probar Auth/RLS/Storage extremo a extremo, configurar los endpoints públicos en GitHub y promover la rama a `main`. No declares estable una release hasta completar la prueba de clon limpio con una rama aislada real de Neon.

## Contexto de Notion

Notion solo puede consultarse temporalmente en modo lectura para comprender contexto de diseño o contenido. No se sincroniza, no es fuente de runtime, no se guardan fragmentos del diario y no se realizan escrituras. El registro exacto está en [docs/notion-readonly-context.md](docs/notion-readonly-context.md).

## Licencia y seguridad

Código bajo licencia MIT; consulta [LICENSE](LICENSE) y [ATTRIBUTIONS.md](ATTRIBUTIONS.md). Las pautas de reporte y rotación están en [SECURITY.md](SECURITY.md) y [docs/security.md](docs/security.md).
