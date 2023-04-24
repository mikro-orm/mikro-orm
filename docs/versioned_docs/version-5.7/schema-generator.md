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

`schema:update` drops all unknown tables by default, you can use `--no-drop-tables` to get around it. There is also `--safe` flag that will disable both table dropping as well as column dropping.

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

We can configure the schema generator globally via the ORM config:

```ts
const orm = await MikroORM.init({
  // default values:
  schemaGenerator: {
    disableForeignKeys: true, // wrap statements with `set foreign_key_checks = 0` or equivalent
    createForeignKeyConstraints: true, // whether to generate FK constraints
    ignoreSchema: [], // allows ignoring some schemas when diffing
  },
});
```

> Note that if we disable FK constraints and current schema is using them, the schema diffing will try to remove those that already exist.

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
  const generator = orm.getSchemaGenerator();

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

Then run this script via `ts-node` (or compile it to plain JS and use `node`):

```sh
$ ts-node create-schema
```

## Ignoring specific column changes

When using generated columns, we'll get a perpetual diff on every `SchemaGenerator` run unless we set `ignoreSchemaChanges` to ignore changes to `type` and `extra`.

See the [SQL Generated columns](defining-entities.md#SQL Generated columns) section for more details.

## Limitations of SQLite

There are limitations of SQLite database because of which it behaves differently than other SQL drivers. Namely, it is not possible to:

- create foreign key constraints when altering columns
- create empty tables without columns
- alter column requires nullability

Because of this, you can end up with different schema with SQLite, so it is not suggested to use SQLite for integration tests of your application.
