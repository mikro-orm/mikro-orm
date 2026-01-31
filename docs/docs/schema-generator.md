---
title: Schema Generator
---

> SchemaGenerator can do harm to your database. It will drop or alter tables, indexes, sequences and such. Please use this tool with caution in development and not on a production server. It is meant for helping you develop your Database Schema, but NOT with migrating schema from A to B in production. A safe approach would be generating the SQL on development server and saving it into SQL Migration files that are executed manually on the production server.

> SchemaGenerator assumes your project uses the given database on its own. Update and Drop commands will mess with other tables if they are not related to the current project that is using MikroORM. Please be careful!

To generate schema from your entity metadata, you can use `SchemaGenerator` helper.

You can use it via CLI:

> To work with the CLI, first install `@mikro-orm/cli` package locally. The version needs to be aligned with the `@mikro-orm/core` package.

```sh
npx mikro-orm schema:create --dump   # Dumps create schema SQL
npx mikro-orm schema:update --dump   # Dumps update schema SQL
npx mikro-orm schema:drop --dump     # Dumps drop schema SQL
```

> You can also use `--run` flag to fire all queries, but be careful as it might break your database. Be sure to always check the generated SQL first before executing. Do not use `--run` flag in production!

`schema:create` will automatically create the database if it does not exist.

`schema:update` drops all unknown tables by default, you can use `--no-drop-tables` to get around it. There is also `--safe` flag that will disable both table dropping and column dropping.

`schema:drop` will by default drop all database tables. You can use `--drop-db` flag to drop the whole database instead.

```shell
npx mikro-orm schema:fresh --run     # !WARNING! Drops the database schema and recreates it
```

This command can be run with the `--seed` option to seed the database after it has been created again.

```shell
npx mikro-orm schema:fresh --run --seed              # seed the database with the default database seeder
npx mikro-orm schema:fresh --run --seed=UsersSeeder  # seed the database with the UsersSeeder
```

> You can specify the default database seeder in the orm config with the key `config.seeder.defaultSeeder`

## Configuration

You can configure the schema generator globally via the ORM config:

```ts
const orm = await MikroORM.init({
  // default values:
  schemaGenerator: {
    disableForeignKeys: true,
    createForeignKeyConstraints: true,
    ignoreSchema: [],
    skipTables: [],
    skipColumns: {},
  },
});
```

### Available options

| Option                                                     | Description                                                                                                                                                                                                                                                                                                                                                              |
|------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `disableForeignKeys: boolean`                             | Whether to wrap schema statements with `set foreign_key_checks = 0` or equivalent. Defaults to `true`. This disables foreign key checks during schema operations to avoid constraint violations during table creation/modification.                                                                                                                                    |
| `createForeignKeyConstraints: boolean`                    | Whether to generate foreign key constraints. Defaults to `true`. When set to `false`, foreign key relationships will not create database-level constraints.                                                                                                                                                                                                           |
| `ignoreSchema: string[]`                                  | Array of schema names to ignore during schema diffing. Useful when working with databases that have multiple schemas and you want to exclude certain schemas from being managed by MikroORM.                                                                                                                                                                          |
| `skipTables: (string \| RegExp)[]`                        | Array of table names and patterns to exclude from schema generation. Accepts exact table names (case-insensitive) and RegExp patterns. Can include schema-qualified names like `'schema.table'`. Tables matching these names or patterns will be completely ignored during schema operations.                                                                      |
| `skipColumns: Dictionary<(string \| RegExp)[]>`           | Object mapping table names to arrays of column names and patterns to exclude from schema generation. Keys can be table names or schema-qualified table names (e.g., `'auth.users'`). Values are arrays of exact column names (case-insensitive) or RegExp patterns. Columns matching these names or patterns will be ignored during schema operations for the specified tables. |
| `managementDbName: string`                                | Name of the management database to use for operations that require administrative privileges (like creating databases). Platform-specific option mainly used by SQL Server.                                                                                                                                                                                           |

### Example configuration

```ts
const orm = await MikroORM.init({
  schemaGenerator: {
    disableForeignKeys: false,
    createForeignKeyConstraints: true,
    ignoreSchema: ['information_schema', 'performance_schema'],
    skipTables: ['auth_sessions', 'audit_log', /^temp_/],
    skipColumns: {
      'auth.users': ['encrypted_password', 'email_confirm_token'],
      users: ['internal_notes', /^system_/],
    },
  },
});
```

> Note that if you disable FK constraints and current schema is using them, the schema diffing will try to remove those that already exist.

## Skipping tables and columns

When working with databases that have existing schema (like Supabase auth schema or legacy systems), you might want to skip certain tables or columns during schema generation:

```ts
const orm = await MikroORM.init({
  schemaGenerator: {
    // Skip entire tables during schema generation
    skipTables: ['posts', 'comments', /audit_.*/],
    
    // Skip specific columns in certain tables
    skipColumns: {
      users: ['password', 'internal_id'],
      'auth.sessions': ['data', /^internal_/],
    },
  },
});
```

Both `skipTables` and `skipColumns` support:
- **String names**: exact table/column name matches (case-insensitive)
- **RegExp patterns**: flexible pattern matching  
- **Schema-qualified names**: use `schema.table` format for specific schemas

This is particularly useful when:
- Working with third-party database schemas (e.g., Supabase auth schema)
- Managing legacy database tables that shouldn't be modified
- Excluding audit or system tables from your application schema

Example for Supabase integration:
```ts
const orm = await MikroORM.init({
  entities: [User], // Your User entity maps to auth.users
  schemaGenerator: {
    // Skip all auth schema tables except users
    skipTables: [
      'auth.sessions',
      'auth.refresh_tokens', 
      'auth.audit_log_entries',
      // ... other auth tables you don't need
    ],
    // Skip sensitive columns in auth.users if needed
    skipColumns: {
      'auth.users': ['encrypted_password', 'email_confirm_token'],
    },
  },
});
```

## Using SchemaGenerator programmatically

Or you can create simple script where you initialize MikroORM like this:

```ts title="./create-schema.ts"
import { MikroORM } from '@mikro-orm/core';

(async () => {
  const orm = await MikroORM.init({
    entities: [Author, Book, ...],
    dbName: 'your-db-name',
    // ...
  });
  const generator = orm.schema;

  const dropDump = await generator.getDropSchemaSQL();
  console.log(dropDump);

  const createDump = await generator.getCreateSchemaSQL();
  console.log(createDump);

  const updateDump = await generator.getUpdateSchemaSQL();
  console.log(updateDump);

  // there is also `generate()` method that returns drop + create queries
  const dropAndCreateDump = await generator.generate();
  console.log(dropAndCreateDump);

  // or you can run those queries directly, but be sure to check them first!
  await generator.dropSchema();
  await generator.createSchema();
  await generator.updateSchema();

  // in tests it can be handy to use those:
  await generator.refreshDatabase(); // ensure db exists and is fresh
  await generator.clearDatabase(); // removes all data

  await orm.close(true);
})();
```

Then run this script via `tsx` (or compile it to plain JS and use `node`):

```sh
$ tsx create-schema
```

## Ignoring specific column changes

When using generated columns, you'll get a perpetual diff on every `SchemaGenerator` run unless you set `ignoreSchemaChanges` to ignore changes to `type` and `extra`.

See the [SQL Generated columns](./defining-entities.md#sql-generated-columns) section for more details.

## Limitations of SQLite

There are limitations of SQLite database because of which it behaves differently than other SQL drivers. Namely, it is not possible to:

- create foreign key constraints when altering columns
- create empty tables without columns
- alter column requires nullability

Because of this, you can end up with different schema with SQLite, so it is not suggested to use SQLite for integration tests of your application.

## Debugging

Sometimes the schema diffing might not work as expected and will produce unwanted queries. Often this is a problem with how you set up the `columnType` or `default/defaultRaw` options of your properties. You can use `MIKRO_ORM_CLI_VERBOSE` env var to enable verbose logging of the CLI, which in turn enables both the underlying queries used to extract the current schema, and logs in the `SchemaComparator` which should help you understand why the ORM sees two columns as different (and what particular options are different).

```bash
$ MIKRO_ORM_CLI_VERBOSE=1 npx mikro-orm schema:update --dump
```
