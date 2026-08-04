# Autenticación y autorización

## Sistema elegido

Managed Better Auth de Neon, declarado con `auth: true` en `neon.ts`. La sesión del navegador usa cookie segura administrada por el SDK; el JWT de acceso identifica al usuario ante Data API y la función de almacenamiento.

## Configuración repetible

1. `neon deploy` sobre la rama correcta.
2. En Neon Auth, añade como dominios de confianza `http://localhost:5173` y `https://aleetreny.github.io` (más el dominio personalizado si aparece).
3. Habilita correo/contraseña y verificación de correo. No habilites proveedores OAuth sin registrar callbacks exactos.
4. Configura las URLs públicas en `.env.local`/GitHub Variables.
5. Aplica migraciones.
6. Crea la cuenta del propietario y allowlist mediante `pnpm db:owner`.

## Estado verificado

El proyecto definitivo es `aleetreny-portfolio` (`divine-queen-66854519`). En la rama aislada `codex-integration` (`br-tiny-art-ayb43loi`) están provisionados Auth y Data API, y se verificaron sesión allowlisted, lectura anónima, rechazo de escritura para una cuenta no propietaria y el ciclo editorial completo. Producción permanece sin migrar.

En integración, `allow_localhost` permite `http://localhost:5173`; antes de activar Pages se debe añadir exactamente `https://aleetreny.github.io` a los orígenes de confianza. No documentar usuarios, contraseñas, tokens ni UUID temporales de las pruebas.

## Distinción crítica

`authenticated` significa “JWT válido”, no “administrador”. `public.is_owner()` solo devuelve verdadero si `auth.user_id()` coincide con una fila habilitada en `app_private.owner_accounts`. Todas las escrituras editoriales dependen de esa función mediante RLS.

## JWT y función de almacenamiento

La función exige `Authorization: Bearer <JWT>`, valida:

- algoritmo EdDSA;
- firma desde `NEON_AUTH_JWKS_URL`;
- `issuer` y `audience` iguales al origen de `NEON_AUTH_BASE_URL`;
- expiración;
- `sub` presente;
- `sub` habilitado en la allowlist.

El JWT expira aproximadamente en minutos y no se guarda en el repositorio/logs. La UI debe solicitarlo al SDK inmediatamente antes de invocar la función.

## Crear, revocar y recuperar propietario

```bash
pnpm db:owner -- --user-id <uuid> --email <correo>
```

Para revocar sin perder trazabilidad:

```sql
update app_private.owner_accounts set enabled = false where auth_user_id = '<uuid>';
```

La recuperación de contraseña ocurre en Neon Auth. Si se pierde acceso completo, crea/verifica una nueva cuenta con control del correo, añádela mediante conexión administrativa y deshabilita la anterior.

## Verificación manual mínima

- sin sesión: leer publicado, no borradores ni escribir;
- sesión no allowlisted: mismo resultado;
- sesión allowlisted: leer borradores y escribir;
- usuario deshabilitado: pierde escritura en la siguiente consulta;
- JWT alterado/expirado: función devuelve 401;
- origen no allowlisted: función devuelve 403.

Managed Better Auth y Data API siguen en beta; revisa documentación oficial antes de actualizar `@neondatabase/neon-js`.
