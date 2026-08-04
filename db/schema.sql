-- Canonical psql restore entrypoint. The migration files remain the source of truth.
\set ON_ERROR_STOP on
\ir migrations/0001_initial_schema.sql
\ir migrations/0002_data_api_permissions.sql
\ir migrations/0003_editor_functions.sql
