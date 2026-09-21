-- Canonical psql restore entrypoint. The migration files remain the source of truth.
\set ON_ERROR_STOP on
\ir migrations/0001_initial_schema.sql
\ir migrations/0002_data_api_permissions.sql
\ir migrations/0003_editor_functions.sql
\ir migrations/0004_trash_restore.sql
\ir migrations/0005_allow_heic_uploads.sql
\ir migrations/0006_allow_video_uploads.sql
\ir migrations/0007_increase_video_upload_limit.sql
\ir migrations/0008_visitor_world.sql
\ir migrations/0009_garden_water_on_demand.sql
\ir migrations/0010_empty_entry_trash.sql
