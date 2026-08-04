# Base de datos

`db/migrations/` es la fuente de verdad ordenada. `db/schema.sql` permite restaurar el esquema con `psql`; los scripts de `scripts/db/` aplican y registran migraciones sin depender de `psql`.

Orden obligatorio:

1. desplegar `neon.ts` para crear Auth, Data API y los roles `anonymous`/`authenticated`;
2. ejecutar `pnpm db:migrate` con `DATABASE_URL` privada;
3. crear el usuario en Neon Auth y ejecutar `pnpm db:owner -- --user-id <uuid> --email <correo>`;
4. opcionalmente ejecutar `pnpm db:seed`;
5. ejecutar `pnpm db:verify` y refrescar la caché del Data API.

Las migraciones no contienen IDs de proyecto, credenciales ni datos personales.
