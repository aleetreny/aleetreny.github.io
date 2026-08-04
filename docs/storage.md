# Almacenamiento

## Proveedor y límites

Proveedor elegido: Neon Object Storage, S3-compatible y ramificable junto con Postgres. Bucket: `portfolio-assets`, acceso `public_read`. En el estado actual del servicio, Storage y Functions son beta y requieren `aws-us-east-2`.

Si el proyecto Neon existente no está en esa región, no muevas producción a ciegas: abre un ADR sustituyendo proveedor o crea un proyecto compatible y planifica migración.

## Creación

`neon.ts` declara el bucket y la función. Ejecuta:

```bash
pnpm exec neon link --project-id <id>
pnpm neon:plan
pnpm neon:deploy
pnpm exec neon env pull --file .env.local
```

La función recibe automáticamente `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, `AWS_REGION`, `DATABASE_URL`, `NEON_AUTH_BASE_URL` y `NEON_AUTH_JWKS_URL`. `ALLOWED_ORIGINS` y `STORAGE_BUCKET` se inyectan desde `neon.ts`.

## Estructura de objetos

```text
portfolio-assets/
└── <auth-user-id>/
    └── <uuid>-<filename-normalizado>
```

No se aceptan keys elegidas completamente por el cliente. La función crea el prefijo/UUID y solo permite AVIF, GIF, JPEG, PNG y WebP hasta 10 MiB.

## Políticas de acceso

- lectura: pública por URL para assets publicados;
- subida: URL PUT firmada cinco minutos, solo owner allowlisted;
- borrado: función, solo bajo el prefijo del mismo `sub`;
- credenciales S3: únicamente servidor/operador, nunca frontend;
- CORS de función: orígenes exactos en `ALLOWED_ORIGINS`.

Object Storage usa nivel de acceso, no bucket policies S3 arbitrarias. Verifica el estado desde Neon Console después de `deploy`.

## Flujo de subida

`POST /uploads/presign` recibe `filename`, `contentType`, `byteSize`. Tras el PUT exitoso, el editor llama a `public.register_uploaded_asset` para registrar URL/key/MIME/bytes/alt. La función comprueba de nuevo owner, bucket, prefijo, tipo y tamaño. Si falla esa segunda operación, el objeto queda huérfano; una tarea de mantenimiento futura debe comparar bucket y tabla antes de borrar.

Para verificar el ciclo real sobre una rama aislada, carga localmente las variables de esa rama, define `STORAGE_FUNCTION_URL` y ejecuta:

```bash
pnpm storage:verify-live
```

El script crea una cuenta sintética con contraseña aleatoria, la allowlista temporalmente, firma y sube `public/og.jpg`, comprueba la lectura pública, registra metadata por Data API, ejecuta los scripts reales de exportación e importación, borra el objeto mediante la Function y elimina cuenta, allowlist, fila y backup temporal en un bloque `finally`. No imprime credenciales ni deja datos de demostración en Auth, Postgres o el bucket.

Por seguridad rechaza la rama `production` salvo que el operador defina explícitamente `STORAGE_VERIFY_ALLOW_PRODUCTION=true` después de revisar el plan y confirmar que la limpieza sintética es aceptable.

## Backup y restauración

```bash
pnpm storage:export -- --output=backups/storage-YYYYMMDD
pnpm storage:import -- --input=backups/storage-YYYYMMDD
```

El manifest conserva key, tipo y metadata; los bytes usan nombres hash para evitar path traversal. El destino se toma de las variables locales, por lo que puede restaurarse en otra rama/proyecto. Después, importa metadatos DB y actualiza URLs si cambia el endpoint.

Los backups pueden contener información personal: cifrar, limitar acceso y no versionar.

## Rotación

Las credenciales inyectadas por Neon siguen la rama. Para credenciales manuales: crear nueva, actualizar secret store, verificar, revocar anterior. Nunca confiar solo en expiración beta.
