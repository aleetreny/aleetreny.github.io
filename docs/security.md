# Seguridad

## Modelo de amenazas

Activos principales: cuenta del propietario, contenido no publicado, datos Postgres, credenciales administrativas, objetos y workflows. La web pública y sus variables Vite se consideran observables por cualquiera.

## Controles

- RLS y `GRANT` en Postgres, no confianza en ocultar botones;
- allowlist privada separada de Auth;
- schema privado sin grants a roles API;
- JWT EdDSA validado con JWKS/issuer/audience/expiración;
- storage secrets solo en función/CI/local;
- URLs firmadas breves y por objeto;
- CORS de origen exacto;
- Content-Type y tamaño limitados;
- borrado lógico e historial preparado;
- Actions con permisos mínimos;
- environments para aprobación de producción;
- `.gitignore`, `.env.example` sin valores y escáner básico `validate:repo`.

## Secretos

Privados: `DATABASE_URL`, `NEON_API_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`. Deben vivir en `.env.local`, Neon-injected env o GitHub Secrets. Los endpoints `VITE_*`, project ID y branch name son configuración pública.

No imprimir variables completas. En errores, redactar hosts si la URL contiene credenciales. Los backups no son secretos técnicos, pero pueden contener datos personales y necesitan cifrado.

## Contenido

No renderizar HTML arbitrario desde JSONB. Validar blocks con Zod y escapar texto por React. SVG no está permitido como subida por riesgo de contenido activo. Imágenes informativas requieren alt text.

## Supply chain

Lockfile obligatorio, Dependabot semanal, `pnpm install --frozen-lockfile` en CI y revisión manual de upgrades beta. Una actualización de Neon JS/Auth/Data API exige test RLS end-to-end.

## Respuesta a incidente

1. revocar secreto/sesión afectado;
2. deshabilitar owner si procede;
3. preservar logs sin copiar tokens;
4. rotar y actualizar stores;
5. revisar accesos y objetos;
6. corregir, probar y documentar;
7. si un secreto entró en Git, asumirlo comprometido aunque se borre del último commit.

## Comprobaciones pendientes de producción

Pen-test ligero de Data API, prueba de usuario no owner, cookies cross-origin/Safari, rate limiting del broker, protección contra objetos huérfanos y cabeceras CSP en Pages.
