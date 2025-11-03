# Database Migrations Guide

## Overview

This project uses **Alembic** for database schema migrations. Migrations track changes to your database structure over time and can be applied, rolled back, or regenerated.

## Migration Flow

```
init.sql → Creates schema (one-time)
    ↓
Alembic migrations → Creates/updates tables
    ↓
Server starts → Ready to use
```

## For Docker Users (Automatic)

When using Docker Compose, migrations run **automatically**:

```bash
docker-compose up --build
```

The entrypoint script (`server/entrypoint.sh`) automatically:
1. ✅ Waits for database to be ready
2. ✅ Runs `alembic upgrade head` (applies all migrations)
3. ✅ Starts the FastAPI server

## For Local Development (Manual)

### 1. Run Migrations Before Starting Server

```bash
cd server

# Apply all pending migrations
alembic upgrade head

# Then start the server
python run_server.py
```

### 2. Creating New Migrations

When you modify database models:

```bash
cd server

# Auto-generate migration from model changes
alembic revision --autogenerate -m "description of changes"

# Review the generated file in alembic/versions/
# Then apply it
alembic upgrade head
```

### 3. Common Migration Commands

```bash
# Show current migration version
alembic current

# Show migration history
alembic history

# Upgrade to latest
alembic upgrade head

# Upgrade one version
alembic upgrade +1

# Downgrade one version
alembic downgrade -1

# Downgrade to specific revision
alembic downgrade <revision_id>

# Show pending migrations
alembic heads
```

## Migration Files Explained

### `server/init.sql`
- **Purpose:** One-time PostgreSQL initialization
- **When it runs:** First database startup only (empty volume)
- **What it does:** Creates the `image_clustering` schema
- **Used by:** Docker Compose (mounted to postgres container)

### `server/alembic/versions/*.py`
- **Purpose:** Schema change history (tables, columns, indexes)
- **When they run:** On `alembic upgrade head`
- **What they do:** Create/modify database structure
- **Examples:**
  - `bb0ac39a2a27_add_imagebatch_table.py` - Creates batch table
  - `ba650b8c5046_create_association_table_and_migrate_.py` - Links images to batches
  - `cc526443c54f_add_ranking_fields_to_association_table.py` - Adds quality ranking

## Current Migrations (in order)

1. `bb0ac39a2a27` - Add ImageBatch table
2. `ba650b8c5046` - Create association table and migrate
3. `c69c13026fe2` - Add missing columns to images table
4. `c910e59362f6` - Add missing columns to images table
5. `f20a4b6a74f4` - Add image hash
6. `487c42b05f95` - Add metadata
7. `b8c2e1c76ce3` - Add thumbnail
8. `0c40df432af5` - Add image quality fields
9. `cc526443c54f` - Add ranking fields to association table

## Troubleshooting

### Migration fails with "relation already exists"

The database has tables but Alembic doesn't know about them:

```bash
# Mark current state as migrated (dangerous!)
alembic stamp head

# Or start fresh (WARNING: destroys data)
docker-compose down -v
docker-compose up --build
```

### Migration fails with "column already exists"

A migration ran partially. Check the error and either:
1. Fix the migration file
2. Manually fix the database
3. Start fresh (see above)

### Want to start fresh

```bash
# Docker: Remove database volume
docker-compose down -v
docker-compose up --build

# Local: Drop and recreate database
psql -U postgres
DROP SCHEMA image_clustering CASCADE;
CREATE SCHEMA image_clustering;
\q

# Then run migrations
cd server
alembic upgrade head
```

## Best Practices

1. ✅ **Always review** auto-generated migrations before applying
2. ✅ **Test migrations** on a copy of production data
3. ✅ **Backup database** before running migrations in production
4. ✅ **Commit migrations** to version control
5. ✅ **Never modify** already-applied migration files
6. ✅ **Use descriptive names** for new migrations

## Development Workflow

```bash
# 1. Modify models in database/models.py
vim server/database/models.py

# 2. Generate migration
cd server
alembic revision --autogenerate -m "add user avatar field"

# 3. Review the generated file
cat alembic/versions/<new_file>.py

# 4. Apply migration
alembic upgrade head

# 5. Test your changes
python run_server.py

# 6. Commit both model and migration
git add database/models.py alembic/versions/<new_file>.py
git commit -m "Add user avatar field"
```

## Production Deployment

```bash
# 1. Pull latest code
git pull

# 2. Backup database
docker-compose exec db pg_dump -U postgres image_clustering > backup.sql

# 3. Run migrations
docker-compose exec backend alembic upgrade head

# 4. Restart if needed
docker-compose restart backend
```
