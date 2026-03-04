# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

MikroORM is a TypeScript ORM for Node.js based on Data Mapper, Unit of Work, and Identity Map patterns. Supports
MongoDB, MySQL, MariaDB, PostgreSQL, SQLite, libSQL, and MSSQL databases.

## Essential Commands

**IMPORTANT: These commands take significant time. Set appropriate timeouts and never cancel them.**

| Command                | Purpose                         | Timeout |
|------------------------|---------------------------------|---------|
| `yarn build`           | Build all packages              | 180s    |
| `yarn tsc-check-tests` | TypeScript validation for tests | 90s     |
| `yarn format`          | Code formatting (oxfmt)         | 30s     |
| `yarn lint`            | ESLint validation               | 120s    |
| `yarn test`            | Full test suite (all databases) | 1800s   |
| `yarn bench`           | Simple CRUD benchmark           | 180s    |
| `yarn bench:types`     | Type system benchmark           | 120s    |

### Setup

```bash
corepack enable
yarn install
docker compose up -d --wait
```

### Single Package Build

Don't use `tsc` directly or via `npx tsc`, always use `yarn build`, either from project root or from package directory.

```bash
cd packages/[name] && yarn build
```

### Running Specific Tests

```bash
yarn test sqlite
yarn test EntityManager.sqlite.test.ts
```

### Validation Before Commit

Always run these before committing (run this from project root):

1. `yarn build` - if package source changed
2. `yarn format` - always (also runs automatically via lint-staged pre-commit hook)
3. `yarn lint` - always
4. `yarn tsc-check-tests` - if test files changed
5. `yarn test` - always run the **full** test suite before declaring work done; do not rely solely on targeted test runs

## Project Structure

**Monorepo with 19 packages** in `packages/`:

- **Core**: `core` (main ORM), `decorators`, `reflection`, `migrations`, `migrations-mongodb`, `entity-generator`,
  `seeder`
- **Drivers**: `postgresql`, `mysql`, `mariadb`, `sqlite`, `libsql`, `mssql`, `mongodb`
- **Support**: `knex-compat` (`raw` helper supporting knex), `cli`, `sql` (shared SQL driver base, built on top of
  `kysely`)

### Key Source Locations

- `packages/core/src/EntityManager.ts` - Main ORM interface
- `packages/core/src/unit-of-work/` - Change tracking and persistence
- `packages/core/src/metadata/` - Entity metadata and discovery
- `packages/core/src/entity/` - Entity utilities including `defineEntity` helper
- `packages/core/src/typings.ts` - Core type definitions

### Test Entity Sets

- `tests/entities/` - Main test entities
- `tests/entities-sql/` - SQL-specific entities
- `tests/entities-schema/` - EntitySchema examples (no decorators)
- `tests/features/` - Feature-specific integration tests
- `tests/issues/` - Regression tests for GitHub issues

## Architecture

### Core Patterns

- **Unit of Work**: Tracks entity changes, batches database operations in transactions
- **Identity Map**: Ensures each entity loaded once per EntityManager context
- **Data Mapper**: Separates domain objects from database persistence logic

### Entity Definition Options

1. **defineEntity**: Helper with full type inference from property builders
2. **Decorators** (recommended): `@Entity()`, `@Property()`, `@ManyToOne()`, etc.
3. **EntitySchema**: Class-less schema definition for vanilla JS

### Type System

Heavy use of TypeScript generics. Key types in `packages/core/src/typings.ts`:

- `EntityName<T>` - Entity class, constructor, or schema reference
- `EntityData<T>` - Data for creating/updating entities
- `InferEntity<Schema>` - Extracts entity type from EntitySchema
- `Loaded<T, P>` - Entity with specific relations populated

## Code Style

- 2-space indentation, semicolons, single quotes
- No `public` keyword (except constructors)
- Prefer `const` over `let`, no `var`
- Conventional commits: `feat(core):`, `fix(mysql):`, `refactor:`, etc.
