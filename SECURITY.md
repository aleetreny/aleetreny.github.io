# Security policy

No publiques vulnerabilidades ni credenciales en issues. Contacta al propietario mediante el correo público del portfolio y elimina cualquier secreto expuesto antes de compartir contexto.

Si un secreto llega al historial:

1. revócalo inmediatamente en el proveedor;
2. crea una credencial nueva con el alcance mínimo;
3. actualiza GitHub Secrets/Variables o Neon;
4. revisa logs y uso;
5. limpia el historial solo después de coordinarlo, porque reescribirlo afecta a todos los clones.

El script `pnpm validate:repo` detecta patrones evidentes, pero no sustituye una revisión manual ni un escáner especializado.
